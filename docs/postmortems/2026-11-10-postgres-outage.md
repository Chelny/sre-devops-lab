# Postmortem: PostgreSQL pod deletion — 2026-11-10

## Summary

At 2026-11-10 ~17:00 UTC, the PostgreSQL pod was manually deleted in the `sre-lab` namespace to simulate an outage. The API returned no response (`000` from curl) for ~25 seconds until Kubernetes recreated the pod and the API reconnected.

## Impact

- **Duration**: ~30 seconds
- **User impact**: API returned no response (`connection refused`) for ~25s. Worse than a 5xx: clients waited then timed out.
- **Data loss**: none (emptyDir, no writes in flight)

## Timeline (UTC)

| Time | Event |
|---|---|
| 17:00:00 | `kubectl delete pod -l app=postgres` executed |
| 17:00:02 | API `/ready` starts failing, pods removed from Service |
| 17:00:05 | API logs show `ECONNREFUSED postgres:5432`, pods crash (`RESTARTS 2`) |
| 17:00:10 | Postgres pod recreated by Deployment |
| 17:00:25 | Postgres ready, API reconnects |
| 17:00:35 | All `/items` requests return 200 again |

## Root cause

Manual deletion (simulation). In production, this would be caused by node failure, OOMKill, or a bad deploy.

## Detection

- `curl` loop showed `200` → `000` transition
- `kubectl get pods` showed `RESTARTS 2` on API pods
- Grafana: `api_http_requests_total{status=~"5.."}` spiked, then went silent
- Prometheus: `/ready` target went `down`

## Resolution

Kubernetes recreated the pod automatically. No manual intervention.

## What went well

- readinessProbe correctly removed API pods from the Service when DB was unreachable
- Postgres was recreated automatically by the Deployment
- Grafana and Prometheus stayed up throughout

## What went wrong

- API pods crashed instead of waiting for Postgres (`RESTARTS 2`)
- No `waitForDb()` retry loop → `ECONNREFUSED` fatal
- No Prometheus alert → incident detected after the fact, not in real time
- `emptyDir` for Postgres → data loss risk (none here, but in production this is unacceptable)

## Action items

- [ ] Add `waitForDb()` retry loop in `api/src/db/pool.ts` (P1)
- [ ] Add `initContainer` waiting for Postgres in `api-deployment.yaml` (P1)
- [ ] Add Prometheus alert: `rate(api_http_requests_total{status=~"5.."}[1m]) > 0.1` for 2m (P2)
- [ ] Migrate Postgres to `StatefulSet` + `PersistentVolumeClaim` (P2)
- [ ] Add `docs/runbook.md` with recovery procedures (P3)