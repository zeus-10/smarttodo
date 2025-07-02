from celery import shared_task
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from datetime import timedelta
from .models import Task
from django.core.management import call_command
import logging

logger = logging.getLogger(__name__)

@shared_task
def update_task_statuses():
    """
    Celery task to automatically update task statuses based on deadlines
    Runs every 5 minutes via Celery Beat
    """
    now = timezone.now()
    
    # Find ongoing tasks that have passed their deadline
    overdue_tasks = Task.objects.filter(
        status='ongoing',
        deadline__lt=now
    )
    
    # Update status to 'failure'
    updated_count = overdue_tasks.update(status='failure')
    
    # Create next occurrences for recurring tasks
    for task in overdue_tasks.filter(is_recurring=True):
        task.create_next_occurrence()
    
    return f"Updated {updated_count} tasks to failure status"

@shared_task
def send_deadline_reminders():
    """
    Celery task to send email reminders for upcoming deadlines
    Runs every hour via Celery Beat
    """
    now = timezone.now()
    
    # Find tasks due within the next 24 hours
    tomorrow = now + timedelta(days=1)
    upcoming_tasks = Task.objects.filter(
        status='ongoing',
        deadline__range=(now, tomorrow)
    ).select_related('created_by')
    
    for task in upcoming_tasks:
        if task.created_by.email:
            # Calculate hours until deadline
            hours_until_deadline = (task.deadline - now).total_seconds() / 3600
            
            if hours_until_deadline <= 1:
                subject = f"URGENT: Task '{task.title}' is due in {int(hours_until_deadline * 60)} minutes!"
            elif hours_until_deadline <= 6:
                subject = f"Task '{task.title}' is due in {int(hours_until_deadline)} hours"
            else:
                subject = f"Reminder: Task '{task.title}' is due tomorrow"
            
            message = f"""
            Hi {task.created_by.first_name or task.created_by.username},
            
            This is a reminder about your task: {task.title}
            
            Details:
            - Description: {task.description or 'No description provided'}
            - Deadline: {task.deadline.strftime('%Y-%m-%d %H:%M')}
            - Priority: {task.get_priority_display()}
            
            Please complete this task before the deadline.
            
            Best regards,
            Smart Todo App
            """
            
            try:
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=settings.EMAIL_HOST_USER,
                    recipient_list=[task.created_by.email],
                    fail_silently=True
                )
            except Exception as e:
                print(f"Failed to send email reminder for task {task.id}: {e}")
    
    return f"Sent {upcoming_tasks.count()} deadline reminders"

@shared_task
def cleanup_old_tasks():
    """
    Celery task to clean up old completed/failed tasks
    Keeps tasks from the last 90 days
    """
    cutoff_date = timezone.now() - timedelta(days=90)
    
    old_tasks = Task.objects.filter(
        created_at__lt=cutoff_date,
        status__in=['success', 'failure']
    )
    
    deleted_count = old_tasks.count()
    old_tasks.delete()
    
    return f"Cleaned up {deleted_count} old tasks"

@shared_task
def generate_daily_report():
    """
    Celery task to generate and send daily productivity report
    Runs daily at 9 AM
    """
    yesterday = timezone.now().date() - timedelta(days=1)
    yesterday_start = timezone.make_aware(
        timezone.datetime.combine(yesterday, timezone.datetime.min.time())
    )
    yesterday_end = timezone.make_aware(
        timezone.datetime.combine(yesterday, timezone.datetime.max.time())
    )
    
    # Get all users who have tasks
    users_with_tasks = Task.objects.values_list('created_by', flat=True).distinct()
    
    for user_id in users_with_tasks:
        from django.contrib.auth.models import User
        user = User.objects.get(id=user_id)
        
        if not user.email:
            continue
        
        # Get yesterday's tasks
        yesterday_tasks = Task.objects.filter(
            created_by=user,
            created_at__range=(yesterday_start, yesterday_end)
        )
        
        # Calculate statistics
        total_tasks = yesterday_tasks.count()
        completed_tasks = yesterday_tasks.filter(status='success').count()
        failed_tasks = yesterday_tasks.filter(status='failure').count()
        ongoing_tasks = yesterday_tasks.filter(status='ongoing').count()
        
        completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
        
        # Get today's tasks
        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_tasks = Task.objects.filter(
            created_by=user,
            status='ongoing',
            deadline__gte=today_start
        ).count()
        
        subject = f"Daily Report - {yesterday.strftime('%Y-%m-%d')}"
        
        message = f"""
        Hi {user.first_name or user.username},
        
        Here's your daily productivity report for {yesterday.strftime('%Y-%m-%d')}:
        
        Yesterday's Summary:
        - Total tasks: {total_tasks}
        - Completed: {completed_tasks}
        - Failed: {failed_tasks}
        - Still ongoing: {ongoing_tasks}
        - Completion rate: {completion_rate:.1f}%
        
        Today's Outlook:
        - Tasks due today: {today_tasks}
        
        Keep up the great work!
        
        Best regards,
        Smart Todo App
        """
        
        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[user.email],
                fail_silently=True
            )
        except Exception as e:
            print(f"Failed to send daily report to {user.email}: {e}")
    
    return "Daily reports sent"

@shared_task
def process_recurring_tasks():
    """
    Celery task to process recurring tasks and create next occurrences
    Runs daily at midnight
    """
    now = timezone.now()
    
    # Find completed recurring tasks that need next occurrences
    completed_recurring_tasks = Task.objects.filter(
        status='success',
        is_recurring=True,
        recurrence_pattern__in=['daily', 'weekly', 'monthly']
    )
    
    created_count = 0
    for task in completed_recurring_tasks:
        next_task = task.create_next_occurrence()
        if next_task:
            created_count += 1
    
    return f"Created {created_count} new recurring tasks"

@shared_task
def send_weekly_summary():
    """
    Celery task to send weekly productivity summary
    Runs every Sunday at 10 AM
    """
    # Get the start and end of last week
    now = timezone.now()
    days_since_monday = now.weekday()
    last_monday = now - timedelta(days=days_since_monday + 7)
    last_sunday = last_monday + timedelta(days=6)
    
    # Get all users
    from django.contrib.auth.models import User
    users = User.objects.filter(is_active=True)
    
    for user in users:
        if not user.email:
            continue
        
        # Get last week's tasks
        last_week_tasks = Task.objects.filter(
            created_by=user,
            created_at__range=(last_monday, last_sunday)
        )
        
        # Calculate weekly statistics
        total_tasks = last_week_tasks.count()
        completed_tasks = last_week_tasks.filter(status='success').count()
        failed_tasks = last_week_tasks.filter(status='failure').count()
        
        completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
        
        # Get average daily tasks
        daily_tasks = {}
        for i in range(7):
            day_start = last_monday + timedelta(days=i)
            day_end = day_start + timedelta(days=1)
            daily_count = last_week_tasks.filter(
                created_at__range=(day_start, day_end)
            ).count()
            daily_tasks[day_start.strftime('%A')] = daily_count
        
        subject = f"Weekly Summary - Week of {last_monday.strftime('%Y-%m-%d')}"
        
        message = f"""
        Hi {user.first_name or user.username},
        
        Here's your weekly productivity summary for the week of {last_monday.strftime('%Y-%m-%d')}:
        
        Weekly Summary:
        - Total tasks: {total_tasks}
        - Completed: {completed_tasks}
        - Failed: {failed_tasks}
        - Completion rate: {completion_rate:.1f}%
        
        Daily Breakdown:
        """
        
        for day, count in daily_tasks.items():
            message += f"- {day}: {count} tasks\n"
        
        message += """
        
        Keep up the great work and have a productive week ahead!
        
        Best regards,
        Smart Todo App
        """
        
        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[user.email],
                fail_silently=True
            )
        except Exception as e:
            print(f"Failed to send weekly summary to {user.email}: {e}")
    
    return "Weekly summaries sent"

@shared_task
def mark_overdue_tasks():
    """
    Celery task to mark overdue tasks as failed.
    This task should be scheduled to run periodically (e.g., every hour).
    """
    try:
        logger.info("Starting overdue task check...")
        call_command('mark_overdue_tasks')
        logger.info("Overdue task check completed successfully")
    except Exception as e:
        logger.error(f"Error during overdue task check: {str(e)}")
        raise

@shared_task
def cleanup_old_tasks():
    """
    Celery task to clean up old completed/failed tasks.
    This can be scheduled to run daily to keep the database clean.
    """
    try:
        from tasks.models import Task
        from datetime import timedelta
        
        # Delete tasks older than 30 days that are completed or failed
        cutoff_date = timezone.now() - timedelta(days=30)
        deleted_count = Task.objects.filter(
            status__in=['success', 'failure'],
            updated_at__lt=cutoff_date
        ).delete()[0]
        
        logger.info(f"Cleaned up {deleted_count} old tasks")
    except Exception as e:
        logger.error(f"Error during task cleanup: {str(e)}")
        raise 