import uuid
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator

class TaskTemplate(models.Model):
    """Template for creating recurring or common tasks"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    estimated_duration = models.IntegerField(help_text="Estimated duration in minutes", default=60)
    priority = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        default=3,
        help_text="Priority level from 1 (lowest) to 5 (highest)"
    )
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class Task(models.Model):
    """Main Task model with all required fields and additional features"""
    STATUS_CHOICES = [
        ('ongoing', 'Ongoing'),
        ('success', 'Success'),
        ('failure', 'Failure'),
    ]
    
    PRIORITY_CHOICES = [
        (1, 'Very Low'),
        (2, 'Low'),
        (3, 'Medium'),
        (4, 'High'),
        (5, 'Very High'),
    ]
    
    RECURRENCE_CHOICES = [
        ('none', 'None'),
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
    ]

    # Core fields
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    deadline = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ongoing')
    
    # Additional fields
    priority = models.IntegerField(
        choices=PRIORITY_CHOICES,
        default=3,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    
    # Recurring task support
    is_recurring = models.BooleanField(default=False)
    recurrence_pattern = models.CharField(
        max_length=20,
        choices=RECURRENCE_CHOICES,
        default='none'
    )
    next_occurrence = models.DateTimeField(null=True, blank=True)
    
    # Template support
    template = models.ForeignKey(
        TaskTemplate,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tasks'
    )
    
    # Time tracking
    estimated_duration = models.IntegerField(
        help_text="Estimated duration in minutes",
        default=60
    )
    actual_duration = models.IntegerField(
        help_text="Actual duration in minutes",
        null=True,
        blank=True
    )
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Metadata
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tasks')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Tags for categorization
    tags = models.JSONField(default=list, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'deadline']),
            models.Index(fields=['created_by', 'status']),
            models.Index(fields=['priority', 'deadline']),
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        # Auto-update status based on deadline
        if self.deadline and self.status == 'ongoing':
            now = timezone.now()
            if self.deadline < now:
                self.status = 'failure'
        
        super().save(*args, **kwargs)

    @property
    def is_overdue(self):
        """Check if task is overdue"""
        return self.deadline < timezone.now() and self.status == 'ongoing'

    @property
    def time_until_deadline(self):
        """Get time remaining until deadline"""
        if self.deadline:
            return self.deadline - timezone.now()
        return None

    @property
    def completion_rate(self):
        """Calculate completion rate based on time spent vs estimated"""
        if self.estimated_duration and self.actual_duration:
            return min(100, (self.actual_duration / self.estimated_duration) * 100)
        return 0

    def mark_as_completed(self):
        """Mark task as completed"""
        self.status = 'success'
        self.completed_at = timezone.now()
        if self.started_at:
            duration = (self.completed_at - self.started_at).total_seconds() / 60
            self.actual_duration = int(duration)
        self.save()

    def start_task(self):
        """Start working on the task"""
        self.started_at = timezone.now()
        self.save()

    def create_next_occurrence(self):
        """Create next occurrence for recurring tasks"""
        if not self.is_recurring or self.recurrence_pattern == 'none':
            return None
        
        from datetime import timedelta
        
        if self.recurrence_pattern == 'daily':
            next_deadline = self.deadline + timedelta(days=1)
        elif self.recurrence_pattern == 'weekly':
            next_deadline = self.deadline + timedelta(weeks=1)
        elif self.recurrence_pattern == 'monthly':
            # Simple monthly addition (could be improved)
            next_deadline = self.deadline + timedelta(days=30)
        else:
            return None
        
        return Task.objects.create(
            title=self.title,
            description=self.description,
            deadline=next_deadline,
            priority=self.priority,
            is_recurring=self.is_recurring,
            recurrence_pattern=self.recurrence_pattern,
            estimated_duration=self.estimated_duration,
            created_by=self.created_by,
            template=self.template,
            tags=self.tags
        )

class TaskComment(models.Model):
    """Comments on tasks for collaboration"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Comment by {self.author.username} on {self.task.title}"

class TaskAttachment(models.Model):
    """File attachments for tasks"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to='task_attachments/')
    filename = models.CharField(max_length=255)
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.filename 