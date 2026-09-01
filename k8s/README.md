# RelayHorizon Kubernetes Deployment

Deploy RelayHorizon to a Kubernetes cluster. Prefer Compose/Dokploy ([docs/dokploy.md](../docs/dokploy.md)).

## Prerequisites

- Digital Ocean Kubernetes cluster
- kubectl configured for your cluster
- Docker logged in to Digital Ocean Container Registry
- cert-manager installed for SSL certificates
- nginx-ingress-controller installed
- A hostname pointing to your cluster

## Quick Deployment

```bash
# Deploy everything
./k8s/deploy.sh
```

## Manual Deployment

```bash
# 1. Build and push Docker image
docker build -t registry.digitalocean.com/curatedletters/relayhorizon:latest .
docker push registry.digitalocean.com/curatedletters/relayhorizon:latest

# 2. Apply Kubernetes manifests
kubectl apply -f k8s/namespace.yaml

# Copy and customize the secret file
cp k8s/secret.template.yaml k8s/secret.yaml
# Edit secret.yaml with your actual values
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa.yaml

# 3. Check deployment status
kubectl get pods -n relayhorizon
kubectl get ingress -n relayhorizon
```

## Configuration Files

- `namespace.yaml` - Creates relayhorizon namespace
- `secret.template.yaml` - Template for environment variables and secrets (copy to secret.yaml)
- `deployment.yaml` - RelayHorizon application deployment
- `service.yaml` - Internal service for pods
- `ingress.yaml` - HTTPS ingress for your hostname
- `hpa.yaml` - Horizontal pod autoscaler (2-10 replicas)

## Environment Variables

Update `secret.yaml` with your actual values:

- `NEXTAUTH_URL` - your public HTTPS origin
- `NEXTAUTH_SECRET` - JWT secret key
- `DATABASE_URL` - PostgreSQL connection string
- `AWS_REGION` - AWS SES region
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `DO_API_TOKEN` - Digital Ocean API token
- `ADMIN_EMAIL` - Admin user email
- `ADMIN_PASSWORD` - Admin user password

## Updating the Application

```bash
# Update with new image
./k8s/update.sh
```

## Monitoring

```bash
# Check pods
kubectl get pods -n relayhorizon

# Check logs
kubectl logs -f deployment/relayhorizon -n relayhorizon

# Check ingress
kubectl describe ingress relayhorizon-ingress -n relayhorizon

# Check HPA status
kubectl get hpa -n relayhorizon
```

## Scaling

The HPA automatically scales between 2-10 replicas based on **CPU usage only**.

Memory is deliberately NOT a scaling trigger(memory target removed 2026-08-25, ELI-289: HPA memory utilisation is a per-pod average that never falls as replicas are added, so it welds the replica count up.

Manual scaling:
```bash
kubectl scale deployment relayhorizon --replicas=5 -n relayhorizon
```

## SSL Certificate

The ingress automatically provisions SSL certificates via cert-manager for your configured hostname.

## Troubleshooting

**Pods not starting:**
```bash
kubectl describe pod <pod-name> -n relayhorizon
kubectl logs <pod-name> -n relayhorizon
```

**SSL certificate issues:**
```bash
kubectl describe certificate relayhorizon-tls -n relayhorizon
kubectl describe clusterissuer letsencrypt-prod
```

**Ingress not working:**
```bash
kubectl describe ingress relayhorizon-ingress -n relayhorizon
```

## Clean Up

```bash
# Delete all resources
kubectl delete namespace relayhorizon
```