# ☸️ GreenRack AI en Kubernetes

Despliegue básico de todo el sistema en un cluster local de Kubernetes.
Es el equivalente a `docker-compose.yml`, pero orquestado por Kubernetes
(reinicio automático de pods, health checks, réplicas y escalado).

## Arquitectura

```text
                        namespace: greenrack
 ┌───────────────────────────────────────────────────────────────┐
 │  iot (Deployment) ──MQTT──► mqtt (Deployment + Service)       │
 │                                  │                            │
 │                                  ▼                            │
 │  frontend x2 ──(navegador)──► backend (Deployment)            │
 │  Service LB :5173             Service LB :4000                │
 │                                  │            │               │
 │                                  ▼            ▼               │
 │                  postgres (Deployment+PVC)  ai-service        │
 │                  Service :5432              Service :8000     │
 └───────────────────────────────────────────────────────────────┘
```

| Archivo | Qué crea |
|---|---|
| `00-namespace.yaml` | Namespace `greenrack` |
| `01-config.yaml` | ConfigMap (URLs, MQTT) y Secret (contraseña BD, JWT) |
| `02-postgres.yaml` | PostgreSQL 16 + volumen persistente de 1 GiB |
| `03-mqtt.yaml` | Broker Mosquitto |
| `04-ai-service.yaml` | Servicio de IA (FastAPI) |
| `05-backend.yaml` | API Express, expuesta en `localhost:4000` |
| `06-iot.yaml` | Nodo IoT simulado |
| `07-frontend.yaml` | Web React (2 réplicas), expuesta en `localhost:5173` |
| `deploy.ps1` / `deploy.sh` | Construye las imágenes y aplica todo |

## Requisitos

1. **Docker Desktop** (https://www.docker.com/products/docker-desktop/) con WSL 2.
2. Activar Kubernetes: *Docker Desktop → Settings → Kubernetes → Enable Kubernetes → Apply & restart*.
   Esperar a que el indicador de Kubernetes esté en verde. `kubectl` viene incluido.
3. Recomendado: *Settings → Resources* con al menos **6 GB de RAM** (el servicio de IA usa TensorFlow).

Comprobar:

```powershell
docker version
kubectl get nodes      # debe mostrar "docker-desktop   Ready"
```

## Despliegue

Desde la raíz del repositorio:

```powershell
powershell -ExecutionPolicy Bypass -File .\k8s\deploy.ps1
```

(Linux/macOS/Git Bash: `bash k8s/deploy.sh`)

La primera vez tarda varios minutos (descarga imágenes base e instala TensorFlow).
Al terminar:

- Web: http://localhost:5173
- API: http://localhost:4000
- Usuario inicial: `admin@greenrack.local` (definido en `database/init-user.sql`)

**App móvil (Expo):** usar `EXPO_PUBLIC_API_URL=http://<IP-de-tu-PC>:4000`.

## Comandos útiles (evidencia para el video)

```powershell
kubectl get all -n greenrack                           # todo lo desplegado
kubectl logs -f deployment/iot -n greenrack            # telemetría IoT enviándose
kubectl logs -f deployment/backend -n greenrack        # backend guardando en PostgreSQL
kubectl scale deployment frontend --replicas=3 -n greenrack   # escalado
kubectl delete pod -l app=backend -n greenrack         # auto-recuperación: K8s crea otro pod
kubectl get pods -n greenrack -w                       # ver los pods en tiempo real
```

## Actualizar después de cambiar código

Volver a ejecutar `deploy.ps1`: reconstruye las imágenes y reinicia los pods
para que usen la versión nueva (los manifiestos usan `imagePullPolicy: Always`).

## Eliminar todo

```powershell
kubectl delete namespace greenrack
```

## Problemas comunes

| Síntoma | Solución |
|---|---|
| `ErrImagePull` / `ImagePullBackOff` | Las imágenes no se construyeron en el mismo Docker que usa Kubernetes. Volver a ejecutar `deploy.ps1`. Con minikube: cambiar `imagePullPolicy` a `IfNotPresent` y ejecutar `minikube image load greenrack/backend:1.0` (y las demás). |
| `localhost:4000` no responde | `kubectl port-forward svc/backend 4000:4000 -n greenrack` |
| `localhost:5173` no responde | `kubectl port-forward svc/frontend 5173:5173 -n greenrack` |
| `ai-service` en `OOMKilled` | Dar más RAM a Docker Desktop o subir `limits.memory` en `04-ai-service.yaml`. |
| Puertos ocupados | Detener `docker compose down` antes de desplegar en Kubernetes (usan los mismos puertos). |
| Login falla tras cambiar el SQL | Los scripts solo corren con la BD vacía: `kubectl delete namespace greenrack` y desplegar de nuevo. |

> El panel de control local (`control/controller.js`, puerto 5000) no forma parte del
> despliegue en Kubernetes: en el cluster, los servicios los gestiona Kubernetes.
