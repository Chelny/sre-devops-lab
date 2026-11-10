# Runbook

## API returns 000 / no response

1. Check pods: `kubectl get pods -n sre-lab`
2. Check Postgres: `kubectl get pods -n sre-lab -l app=postgres`
3. Check API logs: `kubectl logs -n sre-lab -l app=api --tail=50`
4. If Postgres is down, it will be recreated automatically (~30s)
5. If API is in `CrashLoopBackOff`, check `kubectl describe pod`

## Rebuild API image after code change

```bash
./scripts/k8s-rebuild.sh
minikube delete
minikube start --driver=docker --container-runtime=docker --cpus=2 --memory=3072
eval $(minikube docker-env)
cd docker && docker compose build api && cd ..
kubectl apply -k k8s/overlays/local
```