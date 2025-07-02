from django.contrib import admin
from .models import Task, TaskTemplate, TaskComment, TaskAttachment

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'status', 'priority', 'deadline', 'created_by', 'created_at']
    list_filter = ['status', 'priority', 'is_recurring', 'created_at']
    search_fields = ['title', 'description']
    readonly_fields = ['id', 'created_at', 'updated_at']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'description', 'deadline', 'status', 'priority')
        }),
        ('Time Tracking', {
            'fields': ('estimated_duration', 'actual_duration', 'started_at', 'completed_at')
        }),
        ('Recurring Settings', {
            'fields': ('is_recurring', 'recurrence_pattern', 'next_occurrence'),
            'classes': ('collapse',)
        }),
        ('Relationships', {
            'fields': ('template', 'created_by'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('tags', 'id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(TaskTemplate)
class TaskTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'title', 'priority', 'estimated_duration', 'created_by', 'created_at']
    list_filter = ['priority', 'created_at']
    search_fields = ['name', 'title', 'description']
    readonly_fields = ['id', 'created_at', 'updated_at']

@admin.register(TaskComment)
class TaskCommentAdmin(admin.ModelAdmin):
    list_display = ['task', 'author', 'created_at']
    list_filter = ['created_at']
    search_fields = ['content', 'task__title', 'author__username']
    readonly_fields = ['id', 'created_at', 'updated_at']

@admin.register(TaskAttachment)
class TaskAttachmentAdmin(admin.ModelAdmin):
    list_display = ['task', 'filename', 'uploaded_by', 'uploaded_at']
    list_filter = ['uploaded_at']
    search_fields = ['filename', 'task__title', 'uploaded_by__username']
    readonly_fields = ['id', 'uploaded_at'] 