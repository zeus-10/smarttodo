# Automatic Task Failure System

## Overview

The Smart Todo app automatically marks tasks as failed when their deadline passes without completion. This system runs via scheduled Celery tasks and ensures that overdue tasks don't remain in "ongoing" status indefinitely.

## How It Works

### 1. Management Command
- **File**: `tasks/management/commands/mark_overdue_tasks.py`
- **Purpose**: Finds all ongoing tasks that have passed their deadline and marks them as failed
- **Usage**: `python manage.py mark_overdue_tasks [--dry-run]`

### 2. Celery Task
- **File**: `tasks/tasks.py` (function: `mark_overdue_tasks`)
- **Purpose**: Wraps the management command for scheduled execution
- **Schedule**: Runs every 5 minutes via Celery Beat

### 3. Scheduled Execution
- **Frequency**: Every 5 minutes
- **Configuration**: `smart_todo/settings.py` in `CELERY_BEAT_SCHEDULE`

## Setup and Usage

### Prerequisites
1. Redis server running
2. Celery worker and beat scheduler running
3. Django server running

### Starting the System

1. **Start Redis** (if not already running):
   ```bash
   brew services start redis
   ```

2. **Start Celery services**:
   ```bash
   cd backend
   ./start_celery.sh
   ```
   
   Or manually:
   ```bash
   # Terminal 1: Start Celery Worker
   celery -A smart_todo worker --loglevel=info
   
   # Terminal 2: Start Celery Beat Scheduler
   celery -A smart_todo beat --loglevel=info
   ```

3. **Start Django server**:
   ```bash
   python manage.py runserver
   ```

### Testing the System

1. **Dry run** (see what would be marked as failed):
   ```bash
   python manage.py mark_overdue_tasks --dry-run
   ```

2. **Manual execution**:
   ```bash
   python manage.py mark_overdue_tasks
   ```

3. **Check logs**:
   ```bash
   tail -f debug.log
   ```

## Configuration

### Schedule Settings
The system is configured in `smart_todo/settings.py`:

```python
CELERY_BEAT_SCHEDULE = {
    'mark-overdue-tasks': {
        'task': 'tasks.tasks.mark_overdue_tasks',
        'schedule': 300.0,  # Every 5 minutes
    },
    # ... other scheduled tasks
}
```

### Logging
All automatic task failures are logged to `debug.log` with details including:
- Number of tasks marked as failed
- Task titles and IDs
- Original deadlines and current time

## Monitoring

### Check Celery Status
```bash
# Check if workers are running
celery -A smart_todo inspect active

# Check scheduled tasks
celery -A smart_todo inspect scheduled
```

### View Task Status
```bash
# Check for overdue tasks
python manage.py shell
>>> from tasks.models import Task
>>> from django.utils import timezone
>>> Task.objects.filter(status='ongoing', deadline__lt=timezone.now()).count()
```

## Troubleshooting

### Common Issues

1. **Tasks not being marked as failed**:
   - Check if Celery worker is running: `celery -A smart_todo inspect active`
   - Check if Celery beat is running: `ps aux | grep celery`
   - Check logs: `tail -f debug.log`

2. **Redis connection issues**:
   - Ensure Redis is running: `brew services list | grep redis`
   - Check Redis connection: `redis-cli ping`

3. **Permission issues**:
   - Make sure the script is executable: `chmod +x start_celery.sh`

### Debug Commands

```bash
# Test the management command
python manage.py mark_overdue_tasks --dry-run

# Check Celery configuration
celery -A smart_todo inspect conf

# View recent logs
tail -20 debug.log

# Check database for overdue tasks
python manage.py shell -c "
from tasks.models import Task
from django.utils import timezone
overdue = Task.objects.filter(status='ongoing', deadline__lt=timezone.now())
print(f'Found {overdue.count()} overdue tasks')
for task in overdue:
    print(f'- {task.title} (due: {task.deadline})')
"
```

## Integration with Frontend

The frontend automatically reflects these changes:
- Failed tasks appear in the "Failed" section
- Task status updates are reflected in real-time
- Analytics and dashboard metrics are updated accordingly

## Security Considerations

- The system only affects tasks that are already overdue
- All actions are logged for audit purposes
- The management command can be run with `--dry-run` for testing
- No user data is modified without proper validation

## Performance

- The check runs every 5 minutes, which provides a good balance between responsiveness and server load
- Only ongoing tasks with passed deadlines are queried
- Database queries are optimized with proper indexing
- Logging is asynchronous and doesn't block the main process 