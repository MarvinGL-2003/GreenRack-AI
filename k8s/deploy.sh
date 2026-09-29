#!/usr/bin/env bash
# Despliega GreenRack AI en Kubernetes (Docker Desktop, minikube, etc.).
# Uso, desde la raíz del repositorio:  bash k8s/deploy.sh
set -euo pipefail
cd "$(dirname "$0")/.."

echo "== 1/4 Construyendo imágenes Docker =="
docker build -t greenrack/backend:1.0 .
docker build -t greenrack/frontend:1.0 -f Dockerfile.frontend .
docker build -t greenrack/ai-service:1.0 ./system/ai-service
docker build -t greenrack/iot:1.0 ./iot-node

echo "== 2/4 Creando namespace y scripts de base de datos =="
kubectl apply -f k8s/00-namespace.yaml
# Los prefijos 01- y 02- aseguran que schema.sql se ejecute antes que init-user.sql
kubectl create configmap postgres-init -n greenrack \
  --from-file=01-schema.sql=database/schema.sql \
  --from-file=02-init-user.sql=database/init-user.sql \
  --dry-run=client -o yaml | kubectl apply -f -

echo "== 3/4 Aplicando manifiestos =="
kubectl apply -f k8s/

echo "== 4/4 Esperando a que los pods estén listos (la IA tarda un poco) =="
for d in postgres mqtt ai-service backend iot frontend; do
  kubectl rollout status "deployment/$d" -n greenrack --timeout=600s
done

kubectl get pods,svc -n greenrack
echo
echo "Listo:"
echo "  Web:     http://localhost:5173"
echo "  API:     http://localhost:4000"
echo "  Usuario: admin@greenrack.local"
