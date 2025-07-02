from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Task, TaskTemplate
from .tasks import update_task_statuses, send_deadline_reminders


@receiver(post_save, sender=Task)
def task_post_save(sender, instance, created, **kwargs):
    """Handle post-save signals for Task model."""
    if created:
        # Schedule reminder for new tasks with deadlines
        if instance.deadline:
            # Schedule a reminder for this specific task
            from .tasks import send_deadline_reminders
            send_deadline_reminders.apply_async(
                eta=instance.deadline
            )
    else:
        # Update task status based on deadline
        from .tasks import update_task_statuses
        update_task_statuses.apply_async()


@receiver(post_delete, sender=Task)
def task_post_delete(sender, instance, **kwargs):
    """Handle post-delete signals for Task model."""
    # Clean up any scheduled tasks related to this task
    pass


@receiver(post_save, sender=TaskTemplate)
def template_post_save(sender, instance, created, **kwargs):
    """Handle post-save signals for TaskTemplate model."""
    if created and instance.is_recurring:
        # Schedule recurring task creation
        from .tasks import process_recurring_tasks
        process_recurring_tasks.apply_async() 