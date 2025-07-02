from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Q, Count, Avg
from datetime import timedelta

from .models import Task, TaskTemplate, TaskComment, TaskAttachment
from .serializers import (
    TaskSerializer, TaskCreateSerializer, TaskUpdateSerializer,
    TaskStatusUpdateSerializer, TaskBulkUpdateSerializer,
    TaskTemplateSerializer, TaskCommentSerializer, TaskAttachmentSerializer
)

class TaskViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing tasks with comprehensive filtering and search capabilities
    """
    permission_classes = [AllowAny]  # Temporarily allow all requests for development
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'priority', 'is_recurring', 'recurrence_pattern']
    search_fields = ['title', 'description', 'tags']
    ordering_fields = ['created_at', 'updated_at', 'deadline', 'priority']
    ordering = ['-created_at']

    def get_queryset(self):
        """Get all tasks for development (no user filtering)"""
        return Task.objects.all()

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create':
            return TaskCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return TaskUpdateSerializer
        elif self.action == 'update_status':
            return TaskStatusUpdateSerializer
        elif self.action == 'bulk_update':
            return TaskBulkUpdateSerializer
        return TaskSerializer

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Get dashboard data with task counts and statistics"""
        user = request.user
        now = timezone.now()
        
        # Get task counts by status
        task_counts = Task.objects.filter(created_by=user).values('status').annotate(
            count=Count('id')
        )
        
        # Get overdue tasks
        overdue_tasks = Task.objects.filter(
            created_by=user,
            status='ongoing',
            deadline__lt=now
        ).count()
        
        # Get tasks due today
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        due_today = Task.objects.filter(
            created_by=user,
            status='ongoing',
            deadline__range=(today_start, today_end)
        ).count()
        
        # Get tasks due this week
        week_end = today_start + timedelta(days=7)
        due_this_week = Task.objects.filter(
            created_by=user,
            status='ongoing',
            deadline__range=(now, week_end)
        ).count()
        
        # Get completion rate for the last 30 days
        thirty_days_ago = now - timedelta(days=30)
        recent_tasks = Task.objects.filter(
            created_by=user,
            created_at__gte=thirty_days_ago
        )
        
        total_recent = recent_tasks.count()
        completed_recent = recent_tasks.filter(status='success').count()
        completion_rate = (completed_recent / total_recent * 100) if total_recent > 0 else 0
        
        # Get average completion time
        completed_tasks = Task.objects.filter(
            created_by=user,
            status='success',
            actual_duration__isnull=False
        )
        avg_completion_time = completed_tasks.aggregate(
            avg_time=Avg('actual_duration')
        )['avg_time'] or 0
        
        return Response({
            'task_counts': list(task_counts),
            'overdue_tasks': overdue_tasks,
            'due_today': due_today,
            'due_this_week': due_this_week,
            'completion_rate': round(completion_rate, 2),
            'avg_completion_time': round(avg_completion_time, 2),
            'total_tasks': Task.objects.filter(created_by=user).count(),
        })

    @action(detail=False, methods=['get'])
    def by_status(self, request):
        """Get tasks grouped by status"""
        status_param = request.query_params.get('status', 'ongoing')
        tasks = self.get_queryset().filter(status=status_param)
        
        page = self.paginate_queryset(tasks)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(tasks, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """Get overdue tasks"""
        now = timezone.now()
        overdue_tasks = self.get_queryset().filter(
            status='ongoing',
            deadline__lt=now
        )
        
        page = self.paginate_queryset(overdue_tasks)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(overdue_tasks, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def due_soon(self, request):
        """Get tasks due within the next 24 hours"""
        now = timezone.now()
        tomorrow = now + timedelta(days=1)
        
        due_soon_tasks = self.get_queryset().filter(
            status='ongoing',
            deadline__range=(now, tomorrow)
        )
        
        page = self.paginate_queryset(due_soon_tasks)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(due_soon_tasks, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """Update task status with custom logic"""
        task = self.get_object()
        serializer = self.get_serializer(task, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        """Start working on a task"""
        task = self.get_object()
        task.start_task()
        serializer = self.get_serializer(task)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark task as completed"""
        task = self.get_object()
        task.mark_as_completed()
        serializer = self.get_serializer(task)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        """Bulk update multiple tasks"""
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            result = serializer.update(None, serializer.validated_data)
            return Response(result)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['delete'])
    def bulk_delete(self, request):
        """Bulk delete multiple tasks"""
        task_ids = request.data.get('task_ids', [])
        if not task_ids:
            return Response(
                {'error': 'task_ids is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        tasks = self.get_queryset().filter(id__in=task_ids)
        deleted_count = tasks.count()
        tasks.delete()
        
        return Response({'deleted_count': deleted_count})

    @action(detail=True, methods=['post'])
    def create_next_occurrence(self, request, pk=None):
        """Create next occurrence for recurring tasks"""
        task = self.get_object()
        if not task.is_recurring:
            return Response(
                {'error': 'Task is not recurring'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        next_task = task.create_next_occurrence()
        if next_task:
            serializer = self.get_serializer(next_task)
            return Response(serializer.data)
        return Response(
            {'error': 'Failed to create next occurrence'}, 
            status=status.HTTP_400_BAD_REQUEST
        )

class TaskTemplateViewSet(viewsets.ModelViewSet):
    """ViewSet for managing task templates"""
    permission_classes = [AllowAny]  # Temporarily allow all requests for development
    serializer_class = TaskTemplateSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'title', 'description']

    def get_queryset(self):
        return TaskTemplate.objects.all()  # Temporarily get all templates for development

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def create_task_from_template(self, request, pk=None):
        """Create a new task from a template"""
        template = self.get_object()
        task_data = {
            'title': template.title,
            'description': template.description,
            'estimated_duration': template.estimated_duration,
            'priority': template.priority,
            'template': template,
            **request.data
        }
        
        serializer = TaskCreateSerializer(
            data=task_data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            task = serializer.save()
            return Response(TaskSerializer(task).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class TaskCommentViewSet(viewsets.ModelViewSet):
    """ViewSet for managing task comments"""
    permission_classes = [AllowAny]  # Temporarily allow all requests for development
    serializer_class = TaskCommentSerializer

    def get_queryset(self):
        return TaskComment.objects.filter(task__created_by=self.request.user)

    def perform_create(self, serializer):
        task_id = self.kwargs.get('task_pk')
        task = Task.objects.get(id=task_id, created_by=self.request.user)
        serializer.save(author=self.request.user, task=task)

class TaskAttachmentViewSet(viewsets.ModelViewSet):
    """ViewSet for managing task attachments"""
    permission_classes = [AllowAny]  # Temporarily allow all requests for development
    serializer_class = TaskAttachmentSerializer

    def get_queryset(self):
        return TaskAttachment.objects.filter(task__created_by=self.request.user)

    def perform_create(self, serializer):
        task_id = self.kwargs.get('task_pk')
        task = Task.objects.get(id=task_id, created_by=self.request.user)
        serializer.save(uploaded_by=self.request.user, task=task) 