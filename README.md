# sre-devops-lab

![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-22-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-4169E1?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![Kubernetes](https://img.shields.io/badge/Kubernetes-Minikube-326CE5?logo=kubernetes&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-12.9.1-F69220?logo=pnpm&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/CI-GitHub_Actions-2088FF?logo=githubactions&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow)

![CI](https://github.com/Chelny/sre-devops-lab/actions/workflows/ci.yaml/badge.svg)

A hands-on SRE/DevOps portfolio project: a Node.js + TypeScript API running on Docker, PostgreSQL, and Kubernetes, Terraform, and an observability stack.

## Goal

Practice the full SRE/DevOps toolchain end-to-end on a realistic, small application:

- Containerized API with health checks
- Local orchestration with Docker Compose
- CI with GitHub Actions
- Kubernetes manifests (Minikube)
- Infrastructure as Code (Terraform + LocalStack)
- Monitoring and incident simulations (Prometheus + Grafana + postmortems)

## Stack

| Layer                   | Tool                                  |
|-------------------------|---------------------------------------|
| API                     | Node.js 22, TypeScript 6, Express 5   |
| Database                | PostgreSQL 18 (Docker)                |
| Package manager         | pnpm 12.9.1 (via Corepack)            |
| Container               | Docker, multi-stage Dockerfile        |
| Orchestration (cluster) | Kubernetes on Minikube                |
| CI                      | GitHub Actions                        |
| IaC (planned)           | Terraform + LocalStack                |
| Observability (planned) | Prometheus, Grafana                   |

## Project layout

```text
.
├── api/                # Node.js + TypeScript API
├── docker/             # Docker Compose (api + postgres)
├── k8s/                # Kubernetes manifests (base + overlays)
│   ├── base/           # Common resources
│   └── overlays/local/ # Local environment overlay
├── terraform/          # IaC with LocalStack (S3, DynamoDB, Lambda)
│   └── lambda/         # Lambda source code
├── monitoring/         # Prometheus + Grafana (planned)
├── scripts/            # Automation scripts
├── docs/               # Architecture, runbooks, postmortems
└── .github/workflows/  # CI
```

## Progress

- [x] **Step 1** — API + PostgreSQL running locally (`pnpm dev`)
- [x] **Step 2** — Full stack via Docker Compose (`docker compose up`)
- [x] **Step 3** — CI with GitHub Actions (lint, test, build)
- [x] **Step 4** — Kubernetes local deploy (Minikube) with health checks and autoscaling
- [x] **Step 5** — Terraform + LocalStack (S3, DynamoDB, Lambda) without AWS costs
- [ ] **Step 6** — Prometheus + Grafana + incident simulations and postmortems

## Quick start

### Prerequisites

- Node.js 22+
- pnpm 12.9.1+ (via `corepack enable`)
- Docker Desktop

### Run locally

```bash
# 1. Start PostgreSQL
cd docker
docker compose up -d db

# 2. Install dependencies and run the API
cd ../api
pnpm install
cp .env.example .env
pnpm dev
```

API is available at http://localhost:3000.

### Run everything in Docker

```bash
cd docker
docker compose up --build
```

### Run on Kubernetes (Minikube)

```bash
# 1. Start the cluster
minikube start --driver=docker --container-runtime=docker --cpus=2 --memory=3072

# 2. Point Docker to Minikube and build the image
eval $(minikube docker-env)
cd docker && docker compose build api && cd ..

# 3. Deploy
kubectl apply -k k8s/overlays/local

# 4. Wait for pods
kubectl get pods -n sre-lab -w

# 5. Access the API
kubectl port-forward -n sre-lab svc/api 3000:3000
# In another terminal
curl http://localhost:3000/health
```

To rebuild after code changes, use the helper script:

```bash
./scripts/k8s-rebuild.sh
```

### Provision AWS resources with Terraform (LocalStack)

No AWS account or credit card required: [LocalStack](https://localstack.cloud) emulates AWS services locally.

```bash
# 1. Start LocalStack (first run opens a browser for free login)
lstk start

# 2. In another terminal, provision resources
cd terraform
cd lambda && zip -r ../function.zip . && cd ..
lstk terraform init
lstk terraform apply -auto-approve

# 3. Verify
aws --profile localstack s3 ls
aws --profile localstack dynamodb list-tables
aws --profile localstack lambda list-functions
aws --profile localstack lambda invoke \
  --function-name hello --payload '{}' response.json
cat response.json

# 4. Clean up
lstk terraform destroy -auto-approve
```

## Endpoints

| Method | Path         | Purpose                     |
|--------|--------------|-----------------------------|
| GET    | `/health`    | Liveness probe              |
| GET    | `/ready`     | Readiness probe (checks DB) |
| GET    | `/items`     | List items                  |
| POST   | `/items`     | Create an item              |
| DELETE | `/items/:id` | Delete an item              |

```bash
curl http://localhost:3000/health
curl http://localhost:3000/ready
curl http://localhost:3000/items
curl -X POST http://localhost:3000/items \
  -H 'Content-Type: application/json' \
  -d '{"name":"second item"}'
```

## Tests and lint

```bash
cd api
pnpm lint
pnpm test
pnpm build
```

## Notes
The PostgreSQL container is exposed on port 5433 (host) to avoid conflicts with a local PostgreSQL on 5432. Inside Docker and Kubernetes, the API connects to `postgres:5432`.

`pnpm-workspace.yaml` is required in the Docker build context because pnpm 11+ reads `overrides` from it, not from `package.json`.

The Kubernetes Secret in `k8s/base/secret.yaml` contains plaintext credentials for local lab use only. In a real project, use Sealed Secrets or External Secrets Operator.

PostgreSQL runs with an `emptyDir` volume on Kubernetes, so data is not persisted across pod restarts. Production would use a `StatefulSet` with a `PersistentVolumeClaim`.

Terraform state (`*.tfstate`) and `.terraform/` are **not committed**. `.terraform.lock.hcl` is committed for provider version reproducibility.

`terraform/function.zip` is generated from `terraform/lambda/` and is not committed.

## License
[MIT](LICENSE)