#!/bin/bash

echo "🚀 Setting up Smart Todo Application..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is not installed. Please install Python 3.9+ first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    print_warning "PostgreSQL is not installed. Please install PostgreSQL 13+ for production use."
fi

# Check if Redis is installed
if ! command -v redis-server &> /dev/null; then
    print_warning "Redis is not installed. Please install Redis for background tasks."
fi

print_status "Setting up backend..."

# Create virtual environment
cd backend
if [ ! -d "venv" ]; then
    print_status "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
print_status "Activating virtual environment..."
source venv/bin/activate

# Install Python dependencies
print_status "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    print_status "Creating .env file..."
    cat > .env << EOF
SECRET_KEY=django-insecure-your-secret-key-here-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database settings
DB_NAME=smart_todo
DB_USER=postgres
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432

# Redis settings
REDIS_URL=redis://localhost:6379/0

# Email settings (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
EOF
    print_success "Created .env file. Please update with your actual database credentials."
fi

# Run Django migrations
print_status "Running Django migrations..."
python manage.py makemigrations
python manage.py migrate

# Create superuser
print_status "Creating superuser..."
echo "from django.contrib.auth.models import User; User.objects.create_superuser('admin', 'admin@example.com', 'admin123') if not User.objects.filter(username='admin').exists() else None" | python manage.py shell

print_success "Backend setup completed!"

print_status "Setting up frontend..."

# Install Node.js dependencies
cd ../frontend
print_status "Installing Node.js dependencies..."
npm install

# Create .env.local file if it doesn't exist
if [ ! -f ".env.local" ]; then
    print_status "Creating .env.local file..."
    cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:8000
EOF
    print_success "Created .env.local file."
fi

print_success "Frontend setup completed!"

# Create additional configuration files
cd ..

# Create postcss.config.js
if [ ! -f "frontend/postcss.config.js" ]; then
    print_status "Creating PostCSS configuration..."
    cat > frontend/postcss.config.js << EOF
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF
fi

# Create tsconfig.json
if [ ! -f "frontend/tsconfig.json" ]; then
    print_status "Creating TypeScript configuration..."
    cat > frontend/tsconfig.json << EOF
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF
fi

# Create missing __init__.py files
print_status "Creating missing Python package files..."
mkdir -p backend/tasks
mkdir -p backend/analytics
mkdir -p backend/ai_features

touch backend/tasks/__init__.py
touch backend/analytics/__init__.py
touch backend/ai_features/__init__.py

# Create missing serializers and URLs
if [ ! -f "backend/analytics/serializers.py" ]; then
    print_status "Creating analytics serializers..."
    cat > backend/analytics/serializers.py << EOF
from rest_framework import serializers
from .models import ProductivityMetrics, UserInsights, Goal, ProductivityStreak, TaskCategory

class ProductivityMetricsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductivityMetrics
        fields = '__all__'

class UserInsightsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserInsights
        fields = '__all__'

class GoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Goal
        fields = '__all__'

class ProductivityStreakSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductivityStreak
        fields = '__all__'

class TaskCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskCategory
        fields = '__all__'
EOF
fi

if [ ! -f "backend/analytics/urls.py" ]; then
    print_status "Creating analytics URLs..."
    cat > backend/analytics/urls.py << EOF
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AnalyticsViewSet, GoalViewSet, UserInsightsViewSet

router = DefaultRouter()
router.register(r'', AnalyticsViewSet, basename='analytics')
router.register(r'goals', GoalViewSet, basename='goal')
router.register(r'insights', UserInsightsViewSet, basename='insight')

urlpatterns = [
    path('', include(router.urls)),
]
EOF
fi

if [ ! -f "backend/ai_features/serializers.py" ]; then
    print_status "Creating AI features serializers..."
    cat > backend/ai_features/serializers.py << EOF
from rest_framework import serializers
from .models import TaskSuggestion, PriorityRecommendation, WorkloadOptimization, UserPattern, SmartTemplate

class TaskSuggestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskSuggestion
        fields = '__all__'

class PriorityRecommendationSerializer(serializers.ModelSerializer):
    class Meta:
        model = PriorityRecommendation
        fields = '__all__'

class WorkloadOptimizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkloadOptimization
        fields = '__all__'

class UserPatternSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserPattern
        fields = '__all__'

class SmartTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SmartTemplate
        fields = '__all__'
EOF
fi

if [ ! -f "backend/ai_features/urls.py" ]; then
    print_status "Creating AI features URLs..."
    cat > backend/ai_features/urls.py << EOF
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AIFeaturesViewSet

router = DefaultRouter()
router.register(r'', AIFeaturesViewSet, basename='ai')

urlpatterns = [
    path('', include(router.urls)),
]
EOF
fi

if [ ! -f "backend/ai_features/views.py" ]; then
    print_status "Creating AI features views..."
    cat > backend/ai_features/views.py << EOF
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import TaskSuggestion, PriorityRecommendation, WorkloadOptimization, UserPattern, SmartTemplate
from .serializers import (
    TaskSuggestionSerializer, PriorityRecommendationSerializer,
    WorkloadOptimizationSerializer, UserPatternSerializer, SmartTemplateSerializer
)

class AIFeaturesViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['post'])
    def prioritize(self, request):
        """Get AI-powered task prioritization"""
        # Mock AI prioritization logic
        return Response({
            'message': 'AI prioritization feature coming soon!',
            'prioritized_tasks': []
        })

    @action(detail=False, methods=['post'])
    def suggest(self, request):
        """Get AI task suggestions"""
        # Mock AI suggestions
        return Response({
            'message': 'AI suggestions feature coming soon!',
            'suggestions': []
        })
EOF
fi

print_success "🎉 Smart Todo Application setup completed!"

echo ""
echo "📋 Next Steps:"
echo "1. Start PostgreSQL and Redis (if installed)"
echo "2. Start the backend: cd backend && source venv/bin/activate && python manage.py runserver"
echo "3. Start the frontend: cd frontend && npm run dev"
echo "4. Open http://localhost:3000 in your browser"
echo ""
echo "🔑 Default admin credentials:"
echo "   Username: admin"
echo "   Password: admin123"
echo "   Admin URL: http://localhost:8000/admin"
echo ""
echo "📚 For more information, see the README.md file" 