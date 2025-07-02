# Docker Setup for Smart Todo Application

This Docker setup provides a complete containerized environment for the Smart Todo Django application with PostgreSQL, Redis, and Celery.

## Services Included

- **Django Web Application** - Main application server
- **PostgreSQL** - Database
- **Redis** - Message broker for Celery
- **Celery Worker** - Background task processing
- **Celery Beat** - Task scheduler
- **Celery Flower** - Monitoring and management interface

## Quick Start

### Production Setup

1. **Build and start all services:**
   ```bash
   docker-compose up --build
   ```

2. **Create a superuser (in a new terminal):**
   ```bash
   docker-compose exec web python manage.py createsuperuser
   ```

3. **Access the application:**
   - Django Admin: http://localhost:8000/admin/
   - API: http://localhost:8000/api/
   - Celery Flower: http://localhost:5555/

### Development Setup

1. **Start development environment:**
   ```bash
   docker-compose -f docker-compose.dev.yml up --build
   ```

2. **The development setup includes:**
   - Hot reloading for Django
   - Auto-reload for Celery workers
   - Volume mounting for live code changes

## Environment Variables

The following environment variables are configured in the Docker Compose files:

### Database
- `DB_NAME`: smart_todo_db
- `DB_USER`: postgres
- `DB_PASSWORD`: postgres123
- `DB_HOST`: db
- `DB_PORT`: 5432

### Redis
- `REDIS_URL`: redis://redis:6379/0
- `CELERY_BROKER_URL`: redis://redis:6379/0
- `CELERY_RESULT_BACKEND`: redis://redis:6379/0

### Django
- `DEBUG`: True (development) / False (production)
- `SECRET_KEY`: Django secret key
- `ALLOWED_HOSTS`: Allowed hosts for CORS

### Email (for notifications)
- `EMAIL_HOST`: smtp.gmail.com
- `EMAIL_PORT`: 587
- `EMAIL_USE_TLS`: True
- `EMAIL_HOST_USER`: Your email
- `EMAIL_HOST_PASSWORD`: Your app password

## Useful Commands

### Database Operations
```bash
# Run migrations
docker-compose exec web python manage.py migrate

# Create superuser
docker-compose exec web python manage.py createsuperuser

# Reset database
docker-compose down -v
docker-compose up --build
```

### Celery Operations
```bash
# Check Celery worker status
docker-compose exec celery celery -A smart_todo inspect active

# Monitor tasks in Flower
# Open http://localhost:5555 in your browser
```

### Development Commands
```bash
# View logs
docker-compose logs -f web
docker-compose logs -f celery

# Access Django shell
docker-compose exec web python manage.py shell

# Run tests
docker-compose exec web python manage.py test
```

## Ports

- **8000**: Django application
- **5432**: PostgreSQL database
- **6379**: Redis
- **5555**: Celery Flower (monitoring)

## Volumes

- `postgres_data`: PostgreSQL data persistence
- `redis_data`: Redis data persistence
- `static_volume`: Static files
- `media_volume`: Media files

## Production Considerations

1. **Security:**
   - Change default passwords
   - Use environment-specific secret keys
   - Configure proper CORS settings
   - Enable HTTPS

2. **Performance:**
   - Use production-grade database
   - Configure Redis persistence
   - Set up proper logging
   - Use CDN for static files

3. **Monitoring:**
   - Set up health checks
   - Configure logging aggregation
   - Monitor resource usage

## Troubleshooting

### Common Issues

1. **Database connection refused:**
   - Wait for PostgreSQL to fully start
   - Check if the database service is healthy

2. **Redis connection issues:**
   - Ensure Redis container is running
   - Check Redis logs: `docker-compose logs redis`

3. **Celery tasks not processing:**
   - Verify Celery worker is running
   - Check Redis connection
   - Monitor Flower interface

4. **Static files not loading:**
   - Run collectstatic: `docker-compose exec web python manage.py collectstatic`
   - Check static volume mounting

### Logs
```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs web
docker-compose logs celery
docker-compose logs db
docker-compose logs redis
```

## Customization

### Adding New Services
1. Add service definition to `docker-compose.yml`
2. Update environment variables if needed
3. Add health checks for dependencies

### Environment-Specific Configurations
1. Create environment-specific compose files
2. Use `.env` files for sensitive data
3. Override settings for different environments

## Support

For issues related to:
- **Docker**: Check Docker and Docker Compose documentation
- **Django**: Refer to Django documentation
- **Celery**: Check Celery documentation
- **PostgreSQL**: Refer to PostgreSQL documentation
