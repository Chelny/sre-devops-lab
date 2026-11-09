#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/k8s-rebuild.sh
# Rebuilds the API image inside Minikube, restarts the deployment,
# and waits for the rollout to complete.

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NAMESPACE="sre-lab"
DEPLOYMENT="api"

echo "==> Checking prerequisites"
command -v minikube >/dev/null || { echo "minikube not found"; exit 1; }
command -v kubectl  >/dev/null || { echo "kubectl not found"; exit 1; }
command -v docker   >/dev/null || { echo "docker not found"; exit 1; }

if ! docker info >/dev/null 2>&1; then
  echo "Docker Desktop is not running. Start it and retry."
  exit 1
fi

if ! minikube status --format='{{.Host}}' 2>/dev/null | grep -q Running; then
  echo "Minikube is not running. Start it with: minikube start --driver=docker --container-runtime=docker"
  exit 1
fi

echo "==> Pointing Docker to Minikube daemon"
eval "$(minikube docker-env)"

echo "==> Building image inside Minikube"
cd "${PROJECT_ROOT}/docker"
docker compose build api

echo "==> Restarting deployment ${DEPLOYMENT} in namespace ${NAMESPACE}"
kubectl rollout restart "deployment/${DEPLOYMENT}" -n "${NAMESPACE}"

echo "==> Waiting for rollout to complete (timeout 120s)"
kubectl rollout status "deployment/${DEPLOYMENT}" -n "${NAMESPACE}" --timeout=120s

echo "==> Pods:"
kubectl get pods -n "${NAMESPACE}" -l "app=${DEPLOYMENT}"

echo "==> Done. Test with:"
echo "    kubectl port-forward -n ${NAMESPACE} svc/api 3000:3000"
echo "    curl http://localhost:3000/health"