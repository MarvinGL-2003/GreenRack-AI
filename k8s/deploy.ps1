# Despliega GreenRack AI en Kubernetes (Docker Desktop).
# Uso, desde la raíz del repositorio:  .\k8s\deploy.ps1
# Si PowerShell bloquea el script:     powershell -ExecutionPolicy Bypass -File .\k8s\deploy.ps1

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

function Run($cmd) {
    Write-Host "> $cmd" -ForegroundColor Cyan
    Invoke-Expression $cmd
    if ($LASTEXITCODE -ne 0) { throw "Falló: $cmd" }
}

Write-Host "== 1/4 Construyendo imágenes Docker ==" -ForegroundColor Green
Run "docker build -t greenrack/backend:1.0 ."
Run "docker build -t greenrack/frontend:1.0 -f Dockerfile.frontend ."
Run "docker build -t greenrack/ai-service:1.0 ./system/ai-service"
Run "docker build -t greenrack/iot:1.0 ./iot-node"

Write-Host "== 2/4 Creando namespace y scripts de base de datos ==" -ForegroundColor Green
Run "kubectl apply -f k8s/00-namespace.yaml"
# Los prefijos 01- y 02- aseguran que schema.sql se ejecute antes que init-user.sql
Run "kubectl create configmap postgres-init -n greenrack --from-file=01-schema.sql=database/schema.sql --from-file=02-init-user.sql=database/init-user.sql --dry-run=client -o yaml | kubectl apply -f -"

Write-Host "== 3/4 Aplicando manifiestos ==" -ForegroundColor Green
$ErrorActionPreference = "Continue"
kubectl get deployment backend -n greenrack 2>&1 | Out-Null
$yaDesplegado = ($LASTEXITCODE -eq 0)
$ErrorActionPreference = "Stop"
Run "kubectl apply -f k8s/"
# Si ya estaba desplegado, reinicia los pods para que usen las imágenes recién construidas
if ($yaDesplegado) {
    Run "kubectl rollout restart deployment/backend deployment/frontend deployment/ai-service deployment/iot -n greenrack"
}

Write-Host "== 4/4 Esperando a que los pods estén listos (la IA tarda un poco) ==" -ForegroundColor Green
foreach ($d in "postgres", "mqtt", "ai-service", "backend", "iot", "frontend") {
    Run "kubectl rollout status deployment/$d -n greenrack --timeout=600s"
}

Run "kubectl get pods,svc -n greenrack"
Write-Host ""
Write-Host "Listo:" -ForegroundColor Green
Write-Host "  Web:     http://localhost:5173"
Write-Host "  API:     http://localhost:4000"
Write-Host "  Usuario: admin@greenrack.local"
