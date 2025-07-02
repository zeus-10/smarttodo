#!/bin/bash

# Smart Todo Docker Startup Script

echo "🚀 Starting Smart Todo Application with Docker..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install Docker Compose."
    exit 1
fi

# Function to show usage
show_usage() {
    echo "Usage: $0 [dev|prod]"
    echo "  dev  - Start development environment with hot reloading"
    echo "  prod - Start production environment"
    echo ""
    echo "Examples:"
    echo "  $0 dev   # Start development environment"
    echo "  $0 prod  # Start production environment"
}

# Check arguments
if [ $# -eq 0 ]; then
    echo "🤔 No environment specified. Starting development environment..."
    ENV="dev"
elif [ "$1" = "dev" ]; then
    ENV="dev"
elif [ "$1" = "prod" ]; then
    ENV="prod"
else
    echo "❌ Invalid argument: $1"
    show_usage
    exit 1
fi

# Start the appropriate environment
if [ "$ENV" = "dev" ]; then
    echo "🔧 Starting development environment..."
    echo "📝 Features: Hot reloading, volume mounting, development settings"
    echo ""
    docker-compose -f docker-compose.dev.yml up --build
else
    echo "🏭 Starting production environment..."
    echo "📝 Features: Gunicorn, optimized settings, production-ready"
    echo ""
    docker-compose up --build
fi

echo ""
echo "✅ Application started!"
echo ""
echo "🌐 Access your application:"
echo "   - Frontend: http://localhost:3000/"
echo "   - Django Admin: http://localhost:8000/admin/"
echo "   - API: http://localhost:8000/api/"
echo "   - Celery Flower: http://localhost:5555/"
echo ""
echo "📊 Monitor services:"
echo "   - View logs: docker-compose logs -f [service_name]"
echo "   - Stop services: docker-compose down"
echo "   - Restart: docker-compose restart [service_name]"
