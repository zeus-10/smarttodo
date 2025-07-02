# Smart Todo - Full-Stack Task Management Application

A dynamic, fully-functional Todo List application with time-based automation and analytics, built with Django REST API backend and Next.js frontend, all containerized with Docker.

## 🏗️ Architecture Overview

The application follows a microservices architecture with the following components:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Infrastructure │
│   (Next.js)     │◄──►│   (Django)      │◄──►│   (Docker)      │
│   Port: 3000    │    │   Port: 8000    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                       ┌─────────────────┐
                       │   Celery        │
                       │   (Redis)       │
                       │   Port: 6379    │
                       └─────────────────┘
```

## 📋 Current Status

### ✅ Completed Features
- **Task Management**: Full CRUD operations with categories, tags, and priorities
- **Analytics & Reporting**: Comprehensive data analysis and productivity metrics
- **Automation**: Scheduled tasks for reminders, cleanup, and recurring tasks
- **Real-time Processing**: Celery background tasks with Redis
- **Docker Infrastructure**: Complete containerization for development and production
- **Frontend**: Modern Next.js interface with Tailwind CSS
- **Monitoring**: Celery Flower for task monitoring and Django Admin



## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Git

### Installation & Running
```bash
# Clone the repository
git clone <repository-url>
cd resollect

# Start all services
./start-docker.sh dev

# Or manually
docker-compose -f docker-compose.dev.yml up --build
```

### Access Points
- **Frontend Application**: http://localhost:3000
- **Django Admin**: http://localhost:8000/admin/
- **API Documentation**: http://localhost:8000/api/
- **Celery Flower (Monitoring)**: http://localhost:5555

## 📁 Project Structure

```
resollect/
├── backend/                 # Django Backend
│   ├── smart_todo/         # Main Django project
│   ├── tasks/              # Task management app
│   ├── analytics/          # Analytics and reporting
│   ├── celery.py           # Celery configuration
│   ├── requirements.txt    # Python dependencies
│   └── manage.py           # Django management
├── frontend/               # Next.js Frontend
│   ├── app/                # Next.js 13+ app directory
│   ├── components/         # React components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions
│   ├── types/              # TypeScript definitions
│   └── package.json        # Node.js dependencies
├── docker-compose.yml      # Production Docker setup
├── docker-compose.dev.yml  # Development Docker setup
├── Dockerfile              # Backend Docker image
├── frontend/Dockerfile     # Frontend production image
├── frontend/Dockerfile.dev # Frontend development image
└── README.md              # This file
```

## 🔧 Backend Components

### 1. Django Core (`smart_todo/`)

**Purpose**: Main Django project configuration and settings

**Key Files**:
- `settings.py`: Application configuration, database, middleware, installed apps
- `urls.py`: Main URL routing
- `views.py`: API info endpoint
- `celery.py`: Celery task queue configuration

**Features**:
- REST Framework with JWT authentication
- CORS configuration for frontend communication
- PostgreSQL database configuration
- Redis integration for Celery
- Email configuration for notifications

### 2. Tasks App (`tasks/`)

**Purpose**: Core task management functionality

**Models**:
- `Task`: Main task entity with title, description, due date, priority, status
- `Category`: Task categorization
- `Tag`: Task tagging system
- `RecurringTask`: Automated task generation
- `TaskHistory`: Audit trail for task changes

**Key Features**:
- CRUD operations for tasks
- Task filtering and search
- Priority and status management
- Due date tracking
- Category and tag organization
- Recurring task automation

**API Endpoints**:
```
GET    /api/tasks/          # List tasks with filtering
POST   /api/tasks/          # Create new task
GET    /api/tasks/{id}/     # Get specific task
PUT    /api/tasks/{id}/     # Update task
DELETE /api/tasks/{id}/     # Delete task
GET    /api/categories/     # List categories
GET    /api/tags/          # List tags
```

### 3. Analytics App (`analytics/`)

**Purpose**: Data analysis and reporting

**Models**:
- `TaskAnalytics`: Aggregated task statistics
- `UserAnalytics`: User behavior metrics
- `PerformanceMetrics`: System performance data

**Features**:
- Task completion statistics
- Productivity trends
- Time tracking analysis
- Performance monitoring
- Custom report generation

**API Endpoints**:
```
GET    /api/analytics/tasks/        # Task statistics
GET    /api/analytics/user/         # User analytics
GET    /api/analytics/performance/  # Performance metrics
GET    /api/analytics/reports/      # Custom reports
```

### 4. Celery Task Queue

**Purpose**: Background task processing and automation

**Configuration** (`celery.py`):
- Redis as message broker
- Task result backend
- Worker configuration
- Beat scheduler setup

**Scheduled Tasks**:
- `mark_overdue_tasks`: Check and mark overdue tasks (every 30 seconds)
- `send_deadline_reminders`: Send email reminders (hourly)
- `cleanup_old_tasks`: Remove old completed tasks (daily)
- `generate_daily_report`: Create daily analytics report (9 AM daily)
- `send_weekly_summary`: Send weekly progress summary (Sunday 10 AM)
- `process_recurring_tasks`: Generate recurring tasks (midnight daily)

**Task Implementation** (`tasks/tasks.py`):
```python
@shared_task
def mark_overdue_tasks():
    """Mark tasks as overdue if past due date"""

@shared_task
def send_deadline_reminders():
    """Send email reminders for upcoming deadlines"""

@shared_task
def generate_daily_report():
    """Generate and store daily analytics report"""
```

## 🎨 Frontend Components

### 1. Next.js Application Structure

**Framework**: Next.js 14 with App Router
**Styling**: Tailwind CSS
**State Management**: React Query + React Hook Form
**UI Components**: Headless UI + Heroicons

### 2. Core Components

#### Dashboard (`components/Dashboard.tsx`)
**Purpose**: Main application interface
**Features**:
- Task overview and statistics
- Quick task creation
- Recent activity feed
- Performance metrics display

#### Task Management Components
- `TaskList`: Display and manage task lists
- `TaskForm`: Create and edit tasks
- `TaskCard`: Individual task display
- `TaskFilters`: Advanced filtering and search
- `TaskCalendar`: Calendar view of tasks

#### Analytics Components (`components/Analytics.tsx`)
**Purpose**: Data visualization and reporting
**Features**:
- Charts and graphs (Recharts)
- Productivity metrics
- Time tracking visualization
- Custom date range selection

### 3. Custom Hooks

#### `useTasks` (`hooks/useTasks.ts`)
**Purpose**: Task data management
**Features**:
- CRUD operations for tasks
- Real-time data synchronization
- Optimistic updates
- Error handling

### 4. API Integration (`lib/api.ts`)
**Purpose**: Backend communication
**Features**:
- Axios HTTP client configuration
- JWT token management
- Request/response interceptors
- Error handling

## 🐳 Docker Infrastructure

### 1. Development Environment (`docker-compose.dev.yml`)

**Services**:
- `db`: PostgreSQL 15 database
- `redis`: Redis 7 for Celery
- `web`: Django development server
- `frontend`: Next.js development server
- `celery`: Celery worker
- `celery-beat`: Celery scheduler
- `flower`: Celery monitoring

**Features**:
- Hot reloading for development
- Volume mounting for live code changes
- Development-specific settings
- Health checks for dependencies

### 2. Production Environment (`docker-compose.yml`)

**Services**:
- Same services as development but optimized for production
- Gunicorn for Django (instead of development server)
- Production Next.js build
- Optimized settings

### 3. Docker Images

#### Backend (`Dockerfile`)
```dockerfile
FROM python:3.11-slim
# Python dependencies installation
# Django application setup
# Gunicorn configuration
```

#### Frontend (`frontend/Dockerfile`)
```dockerfile
FROM node:18-alpine
# Node.js dependencies
# Next.js build process
# Production server
```

## 🔄 Data Flow

### 1. Task Creation Flow
```
Frontend Form → API Request → Django View → Database → Celery Task → Email Notification
```

### 2. Real-time Updates
```
Database Change → Django Signal → Celery Task → Frontend Update (via polling)
```

### 3. Scheduled Automation
```
Celery Beat → Scheduled Task → Task Processing → Database Update → Notification
```

## 🔐 Security Features

### 1. Authentication
- JWT (JSON Web Tokens) for API authentication
- Token refresh mechanism
- Secure token storage

### 2. Authorization
- Role-based access control
- Permission-based views
- API endpoint protection

### 3. Data Protection
- CORS configuration
- Input validation
- SQL injection prevention
- XSS protection

## 📊 Monitoring & Observability

### 1. Celery Flower
- Real-time task monitoring
- Worker status tracking
- Task execution history
- Performance metrics

### 2. Django Admin
- Database management
- User administration
- System configuration
- Data inspection

### 3. Logging
- Application logs
- Error tracking
- Performance monitoring
- Debug information

## 🚀 Deployment

### Development
```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up --build

# View logs
docker-compose -f docker-compose.dev.yml logs -f [service_name]

# Stop services
docker-compose -f docker-compose.dev.yml down
```

### Production
```bash
# Start production environment
docker-compose up --build

# Scale services
docker-compose up --scale celery=3

# Backup database
docker-compose exec db pg_dump -U postgres smart_todo_db > backup.sql
```

## 🛠️ Development Workflow

### 1. Code Changes
- Frontend: Changes reflect immediately (hot reload)
- Backend: Restart required for Python changes
- Database: Migrations for model changes

### 2. Testing
```bash
# Backend tests
docker-compose -f docker-compose.dev.yml exec web python manage.py test

# Frontend tests
docker-compose -f docker-compose.dev.yml exec frontend npm test
```

### 3. Database Migrations
```bash
# Create migrations
docker-compose -f docker-compose.dev.yml exec web python manage.py makemigrations

# Apply migrations
docker-compose -f docker-compose.dev.yml exec web python manage.py migrate
```

## 📈 Performance Optimization

### 1. Backend
- Database query optimization
- Caching with Redis
- Pagination for large datasets
- Background task processing

### 2. Frontend
- Code splitting
- Image optimization
- Bundle size optimization
- Caching strategies

### 3. Infrastructure
- Container resource limits
- Load balancing
- Database connection pooling
- CDN integration

## 🔧 Configuration

### Environment Variables
```bash
# Database
DB_NAME=smart_todo_db
DB_USER=postgres
DB_PASSWORD=postgres123
DB_HOST=db
DB_PORT=5432

# Redis
REDIS_URL=redis://redis:6379/0

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# JWT
JWT_SECRET_KEY=your-secret-key
JWT_ACCESS_TOKEN_LIFETIME=5
JWT_REFRESH_TOKEN_LIFETIME=1

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request


## 🔧 Troubleshooting

### Common Issues



#### Frontend Not Starting
If the frontend container fails to start:
```bash
# Rebuild the frontend container
docker-compose -f docker-compose.dev.yml build frontend --no-cache
docker-compose -f docker-compose.dev.yml up frontend
```

#### Database Connection Issues
If Django can't connect to PostgreSQL:
```bash
# Check if database container is running
docker-compose -f docker-compose.dev.yml ps

# Restart the database
docker-compose -f docker-compose.dev.yml restart db
```

#### Permission Issues
If you encounter volume mounting permission errors:
```bash
# The development setup avoids volume mounts to prevent permission issues
# Use the provided docker-compose.dev.yml configuration
```

### Logs and Debugging
```bash
# View all service logs
docker-compose -f docker-compose.dev.yml logs

# View specific service logs
docker-compose -f docker-compose.dev.yml logs [service_name]

# Follow logs in real-time
docker-compose -f docker-compose.dev.yml logs -f [service_name]
```

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the logs for debugging

---

**Smart Todo** - Empowering productivity through intelligent task management.
