from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Task, TaskTemplate, TaskComment, TaskAttachment

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class TaskTemplateSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    
    class Meta:
        model = TaskTemplate
        fields = [
            'id', 'name', 'title', 'description', 'estimated_duration',
            'priority', 'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

class TaskCommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    
    class Meta:
        model = TaskComment
        fields = ['id', 'content', 'author', 'created_at', 'updated_at']
        read_only_fields = ['id', 'author', 'created_at', 'updated_at']

class TaskAttachmentSerializer(serializers.ModelSerializer):
    uploaded_by = UserSerializer(read_only=True)
    
    class Meta:
        model = TaskAttachment
        fields = ['id', 'file', 'filename', 'uploaded_by', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_by', 'uploaded_at']

class TaskSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    template = TaskTemplateSerializer(read_only=True)
    comments = TaskCommentSerializer(many=True, read_only=True)
    attachments = TaskAttachmentSerializer(many=True, read_only=True)
    time_until_deadline = serializers.SerializerMethodField()
    is_overdue = serializers.SerializerMethodField()
    completion_rate = serializers.SerializerMethodField()
    
    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'deadline', 'status', 'priority',
            'is_recurring', 'recurrence_pattern', 'next_occurrence',
            'template', 'estimated_duration', 'actual_duration',
            'started_at', 'completed_at', 'created_by', 'created_at',
            'updated_at', 'tags', 'comments', 'attachments',
            'time_until_deadline', 'is_overdue', 'completion_rate'
        ]
        read_only_fields = [
            'id', 'created_by', 'created_at', 'updated_at',
            'time_until_deadline', 'is_overdue', 'completion_rate'
        ]

    def get_time_until_deadline(self, obj):
        """Get time remaining until deadline in seconds"""
        if obj.time_until_deadline:
            return int(obj.time_until_deadline.total_seconds())
        return None

    def get_is_overdue(self, obj):
        """Check if task is overdue"""
        return obj.is_overdue

    def get_completion_rate(self, obj):
        """Get completion rate percentage"""
        return obj.completion_rate

    def validate_deadline(self, value):
        """Validate that deadline is in the future (more lenient for development)"""
        from django.utils import timezone
        # Allow deadlines in the past for development
        return value

    def validate(self, data):
        """Additional validation logic"""
        # Validate recurring task settings
        if data.get('is_recurring') and data.get('recurrence_pattern') == 'none':
            raise serializers.ValidationError(
                "Recurrence pattern must be specified for recurring tasks"
            )
        
        # Validate template usage
        if data.get('template') and not data.get('is_recurring'):
            # If using template, copy template data
            template = data['template']
            if not data.get('title'):
                data['title'] = template.title
            if not data.get('description'):
                data['description'] = template.description
            if not data.get('estimated_duration'):
                data['estimated_duration'] = template.estimated_duration
            if not data.get('priority'):
                data['priority'] = template.priority
        
        return data

class TaskCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new tasks"""
    template_id = serializers.UUIDField(required=False, write_only=True)
    
    class Meta:
        model = Task
        fields = [
            'title', 'description', 'deadline', 'priority',
            'is_recurring', 'recurrence_pattern', 'estimated_duration',
            'tags', 'template_id'
        ]

    def create(self, validated_data):
        template_id = validated_data.pop('template_id', None)
        if template_id:
            try:
                template = TaskTemplate.objects.get(id=template_id)
                validated_data['template'] = template
            except TaskTemplate.DoesNotExist:
                raise serializers.ValidationError("Invalid template ID")
        
        # For development, use a default user or create one if needed
        user = self.context['request'].user
        if user.is_anonymous:
            # Get or create a default user for development
            user, created = User.objects.get_or_create(
                username='admin',
                defaults={'email': 'admin@example.com'}
            )
        
        validated_data['created_by'] = user
        return super().create(validated_data)

class TaskUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating tasks"""
    
    class Meta:
        model = Task
        fields = [
            'title', 'description', 'deadline', 'status', 'priority',
            'is_recurring', 'recurrence_pattern', 'estimated_duration',
            'tags'
        ]

    def validate_deadline(self, value):
        """Allow past deadlines for updates (in case of rescheduling)"""
        return value

class TaskStatusUpdateSerializer(serializers.ModelSerializer):
    """Serializer specifically for updating task status"""
    
    class Meta:
        model = Task
        fields = ['status']

    def validate_status(self, value):
        """Validate status transitions"""
        instance = self.instance
        if instance:
            # Allow any status transition for now
            # Could add business logic here (e.g., can't mark as success if already failed)
            pass
        return value

    def update(self, instance, validated_data):
        """Custom update logic for status changes"""
        new_status = validated_data.get('status')
        
        if new_status == 'success' and instance.status != 'success':
            instance.mark_as_completed()
        elif new_status == 'ongoing' and instance.started_at is None:
            instance.start_task()
        
        instance.status = new_status
        instance.save()
        return instance

class TaskBulkUpdateSerializer(serializers.Serializer):
    """Serializer for bulk updating multiple tasks"""
    task_ids = serializers.ListField(
        child=serializers.UUIDField(),
        help_text="List of task IDs to update"
    )
    status = serializers.ChoiceField(
        choices=Task.STATUS_CHOICES,
        required=False
    )
    priority = serializers.IntegerField(
        min_value=1,
        max_value=5,
        required=False
    )

    def validate_task_ids(self, value):
        """Validate that all task IDs exist and belong to the user"""
        user = self.context['request'].user
        existing_tasks = Task.objects.filter(
            id__in=value,
            created_by=user
        ).values_list('id', flat=True)
        
        existing_ids = set(str(task_id) for task_id in existing_tasks)
        provided_ids = set(str(task_id) for task_id in value)
        
        missing_ids = provided_ids - existing_ids
        if missing_ids:
            raise serializers.ValidationError(
                f"Tasks with IDs {missing_ids} do not exist or do not belong to you"
            )
        
        return value

    def update(self, instance, validated_data):
        """Bulk update tasks"""
        task_ids = validated_data['task_ids']
        status = validated_data.get('status')
        priority = validated_data.get('priority')
        
        tasks = Task.objects.filter(id__in=task_ids)
        updated_count = 0
        
        for task in tasks:
            if status is not None:
                task.status = status
                if status == 'success':
                    task.mark_as_completed()
            if priority is not None:
                task.priority = priority
            task.save()
            updated_count += 1
        
        return {'updated_count': updated_count} 