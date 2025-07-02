import uuid
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class ProductivityMetrics(models.Model):
    """Daily productivity metrics for users"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='productivity_metrics')
    date = models.DateField()
    
    # Task metrics
    total_tasks = models.IntegerField(default=0)
    completed_tasks = models.IntegerField(default=0)
    failed_tasks = models.IntegerField(default=0)
    ongoing_tasks = models.IntegerField(default=0)
    
    # Time metrics
    total_estimated_time = models.IntegerField(default=0)  # in minutes
    total_actual_time = models.IntegerField(default=0)     # in minutes
    average_completion_time = models.FloatField(default=0) # in minutes
    
    # Efficiency metrics
    completion_rate = models.FloatField(default=0)  # percentage
    time_efficiency = models.FloatField(default=0)  # actual vs estimated time ratio
    
    # Priority distribution
    high_priority_completed = models.IntegerField(default=0)
    medium_priority_completed = models.IntegerField(default=0)
    low_priority_completed = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['user', 'date']
        ordering = ['-date']
        indexes = [
            models.Index(fields=['user', 'date']),
            models.Index(fields=['date']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.date}"

class UserInsights(models.Model):
    """AI-generated insights about user productivity patterns"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='insights')
    
    # Insight categories
    INSIGHT_TYPES = [
        ('productivity', 'Productivity'),
        ('time_management', 'Time Management'),
        ('priority_management', 'Priority Management'),
        ('workload_balance', 'Workload Balance'),
        ('improvement', 'Improvement Suggestion'),
    ]
    
    insight_type = models.CharField(max_length=50, choices=INSIGHT_TYPES)
    title = models.CharField(max_length=255)
    description = models.TextField()
    
    # Insight metadata
    confidence_score = models.FloatField(default=0)  # 0-1 scale
    impact_score = models.FloatField(default=0)      # 0-1 scale
    is_actionable = models.BooleanField(default=True)
    
    # Time period this insight covers
    start_date = models.DateField()
    end_date = models.DateField()
    
    # User interaction
    is_read = models.BooleanField(default=False)
    is_applied = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'insight_type']),
            models.Index(fields=['is_read', 'is_actionable']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.title}"

class Goal(models.Model):
    """User-defined productivity goals"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='goals')
    
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    # Goal metrics
    target_completion_rate = models.FloatField(help_text="Target completion rate as percentage")
    target_daily_tasks = models.IntegerField(help_text="Target number of tasks per day")
    target_weekly_tasks = models.IntegerField(help_text="Target number of tasks per week")
    
    # Time period
    start_date = models.DateField()
    end_date = models.DateField()
    
    # Progress tracking
    current_completion_rate = models.FloatField(default=0)
    current_daily_average = models.FloatField(default=0)
    current_weekly_average = models.FloatField(default=0)
    
    # Status
    is_active = models.BooleanField(default=True)
    is_achieved = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['end_date']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.title}"

    @property
    def progress_percentage(self):
        """Calculate overall progress percentage"""
        if self.end_date <= timezone.now().date():
            return 100
        
        total_days = (self.end_date - self.start_date).days
        elapsed_days = (timezone.now().date() - self.start_date).days
        
        if total_days <= 0:
            return 100
        
        return min(100, (elapsed_days / total_days) * 100)

class ProductivityStreak(models.Model):
    """Track user productivity streaks"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='streaks')
    
    streak_type = models.CharField(max_length=50, choices=[
        ('daily_completion', 'Daily Task Completion'),
        ('weekly_completion', 'Weekly Goal Achievement'),
        ('no_failures', 'No Failed Tasks'),
        ('high_efficiency', 'High Efficiency Days'),
    ])
    
    current_streak = models.IntegerField(default=0)
    longest_streak = models.IntegerField(default=0)
    last_activity_date = models.DateField()
    
    # Streak criteria
    min_tasks_per_day = models.IntegerField(default=1)
    min_completion_rate = models.FloatField(default=80.0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['user', 'streak_type']
        indexes = [
            models.Index(fields=['user', 'streak_type']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.streak_type} (Current: {self.current_streak})"

class TaskCategory(models.Model):
    """Categories for task analysis"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='task_categories')
    
    name = models.CharField(max_length=100)
    color = models.CharField(max_length=7, default="#3B82F6")  # Hex color code
    description = models.TextField(blank=True)
    
    # Category statistics
    total_tasks = models.IntegerField(default=0)
    completed_tasks = models.IntegerField(default=0)
    average_completion_time = models.FloatField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['user', 'name']
        ordering = ['name']

    def __str__(self):
        return f"{self.user.username} - {self.name}" 