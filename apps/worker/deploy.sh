#!/bin/bash

# Worker Service Deployment Script
# Supports multiple platforms: Render, Railway, Docker

set -e

echo "🚀 Men's Health Finder Worker Service Deployment"
echo "================================================"

# Check if environment is set
if [ -z "$DEPLOY_ENV" ]; then
    echo "Please set DEPLOY_ENV (production/staging)"
    exit 1
fi

# Build TypeScript
echo "📦 Building TypeScript..."
npm run build

# Deploy based on platform
if [ "$DEPLOY_PLATFORM" = "render" ]; then
    echo "🚀 Deploying to Render..."
    # Render auto-deploys from GitHub
    echo "Push to GitHub to trigger Render deployment"
    echo "Or use: render deploy"
    
elif [ "$DEPLOY_PLATFORM" = "railway" ]; then
    echo "🚀 Deploying to Railway..."
    railway up
    
elif [ "$DEPLOY_PLATFORM" = "docker" ]; then
    echo "🐳 Building Docker image..."
    docker build -t mhf-worker:latest -f Dockerfile ../..
    
    if [ "$DEPLOY_ENV" = "production" ]; then
        # Tag and push to registry
        docker tag mhf-worker:latest $DOCKER_REGISTRY/mhf-worker:latest
        docker push $DOCKER_REGISTRY/mhf-worker:latest
    else
        echo "✅ Docker image built locally"
    fi
else
    echo "❌ Unknown platform. Use: render, railway, or docker"
    exit 1
fi

echo "✅ Deployment complete!"