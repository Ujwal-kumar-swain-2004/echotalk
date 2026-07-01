# EchoTalk Kubernetes

This folder runs EchoTalk on Kubernetes with plain manifests so you can learn the native objects directly.

## What You Get

- `Namespace` for isolation
- `ConfigMap` for non-secret app configuration
- `Secret` for development credentials
- `StatefulSet` + `PersistentVolumeClaim` for PostgreSQL
- `Deployment` + `PersistentVolumeClaim` for Redis
- `Deployment` + `Service` for Mailpit
- `Deployment` + `Service` for TURN
- `Deployment` + `Service` for the Spring Boot backend
- `Deployment` + `Service` for the nginx/React frontend

## Quick Start

From the repository root:

```powershell
.\scripts\k8s-build-images.ps1
kubectl apply -k k8s
kubectl -n echotalk rollout status deployment/echotalk-backend
kubectl -n echotalk rollout status deployment/echotalk-frontend
```

Open the app:

```powershell
kubectl -n echotalk port-forward service/echotalk-frontend 5180:80
```

Then visit:

- Frontend: `http://localhost:5180`
- API through frontend nginx: `http://localhost:5180/api`
- Socket.IO through frontend nginx: `http://localhost:5180/socket.io`

Optional direct ports:

```powershell
kubectl -n echotalk port-forward service/echotalk-backend 8180:8080 8181:8081
kubectl -n echotalk port-forward service/echotalk-mailpit 8025:8025
```

## Image Notes

The manifests use local image names:

- `echotalk-backend:latest`
- `echotalk-frontend:latest`

For Docker Desktop Kubernetes, the helper script is usually enough.

For Minikube, build inside Minikube's Docker daemon:

```powershell
minikube docker-env --shell powershell | Invoke-Expression
.\scripts\k8s-build-images.ps1
```

For kind, build locally and load images:

```powershell
.\scripts\k8s-build-images.ps1
kind load docker-image echotalk-backend:latest
kind load docker-image echotalk-frontend:latest
```

## Useful Commands

```powershell
kubectl -n echotalk get all
kubectl -n echotalk get pvc
kubectl -n echotalk logs deployment/echotalk-backend -f
kubectl -n echotalk describe pod -l app=echotalk-backend
kubectl delete -k k8s
```

To also delete local database and Redis volumes:

```powershell
kubectl -n echotalk delete pvc --all
```

## Learning Path

1. Read `namespace.yml`, then run `kubectl get ns`.
2. Read `configmap.yml` and `secret.yml`, then run `kubectl -n echotalk get configmap,secret`.
3. Read `postgres.yml` and compare `StatefulSet` with `redis.yml`.
4. Read `backend.yml` and inspect env vars, probes, and service ports.
5. Read `frontend.yml` and `frontend-nginx-configmap.yml` to see how nginx routes `/api` and `/socket.io`.
6. Scale the backend:

```powershell
kubectl -n echotalk scale deployment/echotalk-backend --replicas=2
```

Scale it back when done:

```powershell
kubectl -n echotalk scale deployment/echotalk-backend --replicas=1
```

## Important Development Notes

The secret values in `secret.yml` are development-only values copied from the Docker Compose defaults. Do not use them in a real cluster.

The TURN deployment is included for learning Kubernetes service exposure. Real production WebRTC TURN usually needs careful public IP, UDP port range, and firewall configuration.
