from django.core.management.base import BaseCommand
from django.utils import timezone
from tasks.models import Task
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Mark overdue tasks as failed'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without actually doing it',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        now = timezone.now()
        
        # Find all ongoing tasks that have passed their deadline
        overdue_tasks = Task.objects.filter(
            status='ongoing',
            deadline__lt=now
        )
        
        count = overdue_tasks.count()
        
        if count == 0:
            self.stdout.write(
                self.style.SUCCESS('No overdue tasks found.')
            )
            return
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    f'DRY RUN: Would mark {count} overdue task(s) as failed:'
                )
            )
            for task in overdue_tasks:
                self.stdout.write(
                    f'  - {task.title} (ID: {task.id}, Deadline: {task.deadline})'
                )
        else:
            # Mark tasks as failed
            updated_count = overdue_tasks.update(
                status='failure',
                updated_at=now
            )
            
            # Log the action
            logger.info(f'Marked {updated_count} overdue tasks as failed')
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully marked {updated_count} overdue task(s) as failed.'
                )
            )
            
            # Log details of each task that was marked as failed
            for task in overdue_tasks:
                logger.info(
                    f'Task "{task.title}" (ID: {task.id}) marked as failed. '
                    f'Deadline was {task.deadline}, current time is {now}'
                ) 