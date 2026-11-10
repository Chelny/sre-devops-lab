# Architecture

## Overview

```text
┌─────────────────────────────────────────────────────────────┐
│ Developer │
│ pnpm dev ──► API (localhost:3000) │
│ └──► PostgreSQL (localhost:5433 via Docker) │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Kubernetes (Minikube) │
│ namespace: sre-lab │
│ │
│ ┌──────────────┐ scrape ┌──────────────┐ │
│ │ Prometheus │◄────────────│ API (x2) │ │
│ │ :9090 │ /metrics │ :3000 │ │
│ └──────┬───────┘ └──────┬───────┘ │
│ │ │ │
│ │ query │ SQL │
│ ▼ ▼ │
│ ┌──────────────┐ ┌──────────────┐ │
│ │ Grafana │ │ PostgreSQL │ │
│ │ :3000 │ │ :5432 │ │
│ └──────────────┘ └──────────────┘ │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ LocalStack (Docker) │
│ S3 bucket • DynamoDB table • Lambda function │
│ endpoint: localhost:4566 │
└─────────────────────────────────────────────────────────────┘
```

## Components

### API (`api/`)
- Node.js 22 + TypeScript 6 + Express 5
- Exposes `/health` (liveness), `/ready` (readiness), `/metrics` (Prometheus), and CRUD `/items`
- Uses `pg` pool for PostgreSQL, `prom-client` for metrics
- Multi-stage Dockerfile (build → runtime, non-root user)

### Database (`docker/`, `k8s/base/postgres-*.yaml`)
- PostgreSQL 18
- Local: Docker Compose, port 5433 (host) → 5432 (container)
- K8s: Deployment + ClusterIP Service, `emptyDir` volume (lab only)

### Kubernetes (`k8s/`)
- Kustomize pattern: `base/` (common) + `overlays/local/` (environment)
- API: 2 replicas, HPA (2–5, CPU 70%), liveness/readiness probes
- Prometheus: scrapes `api:3000/metrics` every 15s
- Grafana: provisioned Prometheus datasource

### Terraform (`terraform/`)
- Provider points to LocalStack (`localhost:4566`), no real AWS
- Resources: S3 bucket, DynamoDB table, Lambda + IAM role
- State: local, not committed. `.terraform.lock.hcl` committed for reproducibility

### Observability (`k8s/base/prometheus-*.yaml`, `k8s/base/grafana-*.yaml`)
- Metrics: `api_http_requests_total` (counter), `api_http_request_duration_seconds` (histogram)
- Dashboard: request rate, P95 latency, requests by status

## Failure modes

| Failure | Detection | Behavior |
|---|---|---|
| PostgreSQL pod deleted | `/ready` fails, `api_http_requests_total{status=~"5.."}` spikes | API pods removed from Service, no response (`000`), Postgres recreated, API reconnects (~30s) |
| API pod crash | `kubectl get pods` shows `CrashLoopBackOff` | K8s restarts pod, readinessProbe gates traffic |
| High CPU | HPA target > 70% | HPA scales 2 → 5 replicas |

See `docs/postmortems/2026-11-10-postgres-outage.md` for a real simulation.

## Design decisions

- **Port 5433 for Postgres host**: avoids conflict with a local PostgreSQL on 5432
- **`imagePullPolicy: Never`**: image built inside Minikube, not pulled from a registry
- **`emptyDir` for Postgres**: lab-only, no persistence. Production would use `StatefulSet` + `PVC`
- **Plaintext Secret**: lab-only. Production would use Sealed Secrets or External Secrets Operator
- **`waitForDb()` not implemented**: known gap, tracked in postmortem action items (P1)

## Known limitations

- No GitOps (ArgoCD/Flux) — deployments are manual `kubectl apply`
- No Alertmanager — Prometheus rules not configured
- No log aggregation (Loki) — logs via `kubectl logs` only
- Dashboard is not versioned as JSON (created manually in Grafana UI)
- No CI step for Terraform (`terraform plan` not run on PR)