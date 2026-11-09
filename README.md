# sre-devops-lab

![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-22-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-4169E1?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
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
| CI                      | GitHub Actions                        |
| IaC (planned)           | Terraform + LocalStack                |
| Observability (planned) | Prometheus, Grafana                   |

## Project layout

```text
.
├── api/ # Node.js + TypeScript API
├── docker/ # Docker Compose (api + postgres)
├── k8s/ # Kubernetes manifests (planned)
├── terraform/ # IaC with LocalStack (planned)
├── monitoring/ # Prometheus + Grafana (planned)
├── scripts/ # Automation scripts
├── docs/ # Architecture, runbooks, postmortems
└── .github/workflows/ # CI
```

## Progress

- [x] **Step 1** — API + PostgreSQL running locally (`pnpm dev`)
- [x] **Step 2** — Full stack via Docker Compose (`docker compose up`)
- [ ] **Step 3** — CI with GitHub Actions (lint, test, build)
- [ ] **Step 4** — Kubernetes local deploy (Minikube) with health checks and autoscaling
- [ ] **Step 5** — Terraform + LocalStack (IaC without AWS costs)
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