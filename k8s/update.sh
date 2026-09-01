#!/bin/bash

# RelayHorizon Kubernetes Update Script
# Update deployment with new image

set -e

# Generate timestamp for unique image tag
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
IMAGE_TAG="registry.digitalocean.com/curatedletters/relayhorizon:${TIMESTAMP}"

echo "🔄 Updating RelayHorizon deployment..."

# Build and push new image
echo "📦 Building Docker image with tag: ${IMAGE_TAG}"
docker build --platform linux/amd64 -t ${IMAGE_TAG} .
docker tag ${IMAGE_TAG} registry.digitalocean.com/curatedletters/relayhorizon:latest

echo "🔄 Pushing to Digital Ocean Container Registry..."
docker push ${IMAGE_TAG}
docker push registry.digitalocean.com/curatedletters/relayhorizon:latest

# Update deployment
echo "🚀 Updating Kubernetes deployment..."
kubectl set image deployment/relayhorizon relayhorizon=${IMAGE_TAG} -n relayhorizon

echo "⏳ Waiting for rollout to complete..."
kubectl rollout status deployment/relayhorizon -n relayhorizon --timeout=300s

echo "🔍 Deployment status..."
kubectl get pods -n relayhorizon

echo "✅ RelayHorizon update completed!"