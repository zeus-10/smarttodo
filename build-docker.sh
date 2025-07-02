#!/bin/bash

# Smart Todo Docker Build Script

echo "🔨 Building Smart Todo Docker Image..."

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

# Build the image using buildx for better compatibility
echo "📦 Building Docker image..."
docker buildx build --platform linux/amd64 -t smart-todo:latest .

if [ $? -eq 0 ]; then
    echo "✅ Docker image built successfully!"
    echo ""
    echo "🚀 You can now start the application with:"
    echo "   ./start-docker.sh dev"
    echo "   or"
    echo "   docker-compose -f docker-compose.dev.yml up"
else
    echo "❌ Docker build failed!"
    echo ""
    echo "💡 Troubleshooting tips:"
    echo "   1. Make sure you have Docker Desktop running"
    echo "   2. Check your internet connection"
    echo "   3. If behind corporate firewall, ensure Docker has access to PyPI"
    echo "   4. Try running: docker system prune -f"
    exit 1
fi
