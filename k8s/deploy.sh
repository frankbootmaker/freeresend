#!/bin/bash

# RelayHorizon Kubernetes Deployment Script
# Deploy to Digital Ocean Kubernetes

set -e

echo "🚀 Deploying RelayHorizon to Kubernetes..."

# Build and push Docker image
echo "📦 Building Docker image..."
docker build --platform linux/amd64 -t registry.digitalocean.com/curatedletters/relayhorizon:latest .

echo "🔄 Pushing to Digital Ocean Container Registry..."
docker push registry.digitalocean.com/curatedletters/relayhorizon:latest

# Apply Kubernetes manifests
echo "🔧 Applying Kubernetes manifests..."

# Create namespace first
kubectl apply -f k8s/namespace.yaml

# Apply secrets (create from template first if needed)
if [ ! -f "k8s/secret.yaml" ]; then
  echo "⚠️  secret.yaml not found. Copy secret.template.yaml to secret.yaml and update with your values."
  echo "   cp k8s/secret.template.yaml k8s/secret.yaml"
  exit 1
fi
kubectl apply -f k8s/secret.yaml

# Apply application resources
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa.yaml

echo "⏳ Waiting for deployment to be ready..."
kubectl rollout status deployment/relayhorizon -n relayhorizon --timeout=300s

echo "🔍 Getting deployment status..."
kubectl get pods -n relayhorizon
kubectl get services -n relayhorizon
kubectl get ingress -n relayhorizon

echo "✅ RelayHorizon deployment completed!"
echo "🌐 Application will be available at your configured hostname"
echo ""
echo "📋 Useful commands:"
echo "  kubectl get pods -n relayhorizon"
echo "  kubectl logs -f deployment/relayhorizon -n relayhorizon"
echo "  kubectl describe ingress relayhorizon-ingress -n relayhorizon"