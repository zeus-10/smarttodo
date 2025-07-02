#!/bin/bash

# Start Celery Worker and Beat Scheduler for Smart Todo
echo "Starting Celery services for Smart Todo..."

# Start Celery Worker in background
echo "Starting Celery Worker..."
celery -A smart_todo worker --loglevel=info &

# Wait a moment for worker to start
sleep 2

# Start Celery Beat Scheduler in background
echo "Starting Celery Beat Scheduler..."
celery -A smart_todo beat --loglevel=info &

echo "Celery services started!"
echo "Worker and Beat scheduler are running in the background."
echo "To stop them, use: pkill -f 'celery'"
echo ""
echo "To view logs, check the terminal output above."
echo "To test the overdue task check, run:"
echo "  python manage.py mark_overdue_tasks --dry-run" 