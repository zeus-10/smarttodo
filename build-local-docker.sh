#!/bin/bash

# Smart Todo Local Docker Build Script
# This script builds the Docker image using your local pip configuration

echo "🔨 Building Smart Todo Docker Image using local environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "Dockerfile" ]; then
    echo "❌ Dockerfile not found. Please run this script from the project root."
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "backend/venv" ]; then
    echo "❌ Virtual environment not found. Please activate your virtual environment first."
    exit 1
fi

echo "📦 Creating a pip cache from your local environment..."

# Create a temporary directory for pip cache
mkdir -p .docker-pip-cache

# Install packages to the cache directory using your local pip
cd backend
source venv/bin/activate
pip download -r requirements.txt -d ../.docker-pip-cache
cd ..

echo "🐳 Building Docker image with local pip cache..."

# Build the Docker image using the local cache
docker buildx build \
    --platform linux/amd64 \
    --build-arg PIP_CACHE_DIR=.docker-pip-cache \
    -t smart-todo:latest .

if [ $? -eq 0 ]; then
    echo "✅ Docker image built successfully!"
    echo ""
    echo "🧹 Cleaning up temporary files..."
    rm -rf .docker-pip-cache
    echo ""
    echo "🚀 You can now start the application with:"
    echo "   ./start-docker.sh dev"
    echo "   or"
    echo "   docker-compose -f docker-compose.dev.yml up"
else
    echo "❌ Docker build failed!"
    echo ""
    echo "🧹 Cleaning up temporary files..."
    rm -rf .docker-pip-cache
    echo ""
    echo "💡 Troubleshooting tips:"
    echo "   1. Make sure you have Docker Desktop running"
    echo "   2. Check your internet connection"
    echo "   3. Ensure your virtual environment is activated"
    echo "   4. Try running: docker system prune -f"
    exit 1
fi
