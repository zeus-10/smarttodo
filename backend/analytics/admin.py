from django.contrib import admin
from .models import UserInsights, TaskCategory, ProductivityStreak, ProductivityMetrics, Goal

@admin.register(UserInsights)
class UserInsightsAdmin(admin.ModelAdmin):
    list_display = ['user', 'insight_type', 'created_at']
    list_filter = ['insight_type', 'created_at']
    search_fields = ['user__username']

@admin.register(TaskCategory)
class TaskCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'created_at']
    list_filter = ['created_at']
    search_fields = ['name', 'user__username']

@admin.register(ProductivityStreak)
class ProductivityStreakAdmin(admin.ModelAdmin):
    list_display = ['user', 'streak_type', 'current_streak', 'longest_streak', 'created_at']
    list_filter = ['streak_type', 'created_at']
    search_fields = ['user__username']

@admin.register(ProductivityMetrics)
class ProductivityMetricsAdmin(admin.ModelAdmin):
    list_display = ['user', 'date', 'total_tasks', 'completed_tasks', 'completion_rate', 'created_at']
    list_filter = ['date', 'created_at']
    search_fields = ['user__username']

@admin.register(Goal)
class GoalAdmin(admin.ModelAdmin):
    list_display = ['user', 'title', 'target_completion_rate', 'current_completion_rate', 'is_active', 'end_date']
    list_filter = ['is_active', 'is_achieved', 'created_at']
    search_fields = ['title', 'description', 'user__username'] 