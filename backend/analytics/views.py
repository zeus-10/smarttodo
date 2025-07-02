from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q, Count, Avg, Sum, F
from django.db.models.functions import TruncDate, TruncWeek, TruncMonth
from datetime import timedelta, datetime
import json

from .models import (
    ProductivityMetrics, UserInsights, Goal, 
    ProductivityStreak, TaskCategory
)
from .serializers import (
    ProductivityMetricsSerializer, UserInsightsSerializer,
    GoalSerializer, ProductivityStreakSerializer, TaskCategorySerializer
)
from tasks.models import Task

class AnalyticsViewSet(viewsets.ViewSet):
    """Main analytics viewset for productivity insights"""
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def overview(self, request):
        """Get comprehensive analytics overview"""
        user = request.user
        now = timezone.now()
        
        # Get date range from query params
        days = int(request.query_params.get('days', 30))
        start_date = now - timedelta(days=days)
        
        # Get tasks in date range
        tasks = Task.objects.filter(
            created_by=user,
            created_at__gte=start_date
        )
        
        # Basic statistics
        total_tasks = tasks.count()
        completed_tasks = tasks.filter(status='success').count()
        failed_tasks = tasks.filter(status='failure').count()
        ongoing_tasks = tasks.filter(status='ongoing').count()
        
        completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
        
        # Time efficiency
        completed_with_time = tasks.filter(
            status='success',
            actual_duration__isnull=False,
            estimated_duration__isnull=False
        )
        
        if completed_with_time.exists():
            avg_estimated = completed_with_time.aggregate(avg=Avg('estimated_duration'))['avg']
            avg_actual = completed_with_time.aggregate(avg=Avg('actual_duration'))['avg']
            time_efficiency = (avg_estimated / avg_actual * 100) if avg_actual > 0 else 0
        else:
            time_efficiency = 0
        
        # Priority distribution
        priority_stats = tasks.values('priority').annotate(
            count=Count('id'),
            completed=Count('id', filter=Q(status='success'))
        ).order_by('priority')
        
        # Daily trends
        daily_stats = tasks.annotate(
            date=TruncDate('created_at')
        ).values('date').annotate(
            total=Count('id'),
            completed=Count('id', filter=Q(status='success')),
            failed=Count('id', filter=Q(status='failure'))
        ).order_by('date')
        
        # Category analysis
        category_stats = []
        for task in tasks:
            if task.tags:
                for tag in task.tags:
                    category_stats.append({
                        'category': tag,
                        'total': 1,
                        'completed': 1 if task.status == 'success' else 0
                    })
        
        # Aggregate category stats
        category_summary = {}
        for stat in category_stats:
            cat = stat['category']
            if cat not in category_summary:
                category_summary[cat] = {'total': 0, 'completed': 0}
            category_summary[cat]['total'] += stat['total']
            category_summary[cat]['completed'] += stat['completed']
        
        return Response({
            'period': {
                'start_date': start_date.date(),
                'end_date': now.date(),
                'days': days
            },
            'overview': {
                'total_tasks': total_tasks,
                'completed_tasks': completed_tasks,
                'failed_tasks': failed_tasks,
                'ongoing_tasks': ongoing_tasks,
                'completion_rate': round(completion_rate, 2),
                'time_efficiency': round(time_efficiency, 2)
            },
            'priority_distribution': list(priority_stats),
            'daily_trends': list(daily_stats),
            'category_analysis': category_summary
        })

    @action(detail=False, methods=['get'])
    def productivity_trends(self, request):
        """Get productivity trends over time"""
        user = request.user
        now = timezone.now()
        
        # Get date range
        days = int(request.query_params.get('days', 30))
        start_date = now - timedelta(days=days)
        
        # Get daily productivity metrics
        daily_metrics = ProductivityMetrics.objects.filter(
            user=user,
            date__gte=start_date
        ).order_by('date')
        
        # Calculate trends
        trends = []
        for metric in daily_metrics:
            trends.append({
                'date': metric.date,
                'completion_rate': metric.completion_rate,
                'time_efficiency': metric.time_efficiency,
                'total_tasks': metric.total_tasks,
                'completed_tasks': metric.completed_tasks
            })
        
        # Calculate moving averages
        if len(trends) >= 7:
            for i in range(6, len(trends)):
                week_avg = sum(t['completion_rate'] for t in trends[i-6:i+1]) / 7
                trends[i]['weekly_avg_completion'] = round(week_avg, 2)
        
        return Response({
            'trends': trends,
            'summary': {
                'avg_completion_rate': sum(t['completion_rate'] for t in trends) / len(trends) if trends else 0,
                'avg_time_efficiency': sum(t['time_efficiency'] for t in trends) / len(trends) if trends else 0,
                'total_days_analyzed': len(trends)
            }
        })

    @action(detail=False, methods=['get'])
    def time_analysis(self, request):
        """Analyze time management patterns"""
        user = request.user
        now = timezone.now()
        
        days = int(request.query_params.get('days', 30))
        start_date = now - timedelta(days=days)
        
        tasks = Task.objects.filter(
            created_by=user,
            created_at__gte=start_date,
            actual_duration__isnull=False
        )
        
        # Time distribution by priority
        time_by_priority = tasks.values('priority').annotate(
            total_estimated=Sum('estimated_duration'),
            total_actual=Sum('actual_duration'),
            avg_estimated=Avg('estimated_duration'),
            avg_actual=Avg('actual_duration'),
            task_count=Count('id')
        ).order_by('priority')
        
        # Time distribution by day of week
        time_by_day = tasks.annotate(
            day_of_week=TruncDate('created_at')
        ).values('day_of_week').annotate(
            total_time=Sum('actual_duration'),
            task_count=Count('id')
        ).order_by('day_of_week')
        
        # Over/under estimation analysis
        estimation_accuracy = []
        for task in tasks:
            if task.estimated_duration and task.actual_duration:
                accuracy = (task.estimated_duration / task.actual_duration) * 100
                estimation_accuracy.append({
                    'task_id': str(task.id),
                    'title': task.title,
                    'estimated': task.estimated_duration,
                    'actual': task.actual_duration,
                    'accuracy': round(accuracy, 2)
                })
        
        return Response({
            'time_by_priority': list(time_by_priority),
            'time_by_day': list(time_by_day),
            'estimation_accuracy': estimation_accuracy,
            'summary': {
                'total_time_spent': sum(t['total_actual'] for t in time_by_priority),
                'avg_accuracy': sum(t['accuracy'] for t in estimation_accuracy) / len(estimation_accuracy) if estimation_accuracy else 0
            }
        })

    @action(detail=False, methods=['get'])
    def goal_progress(self, request):
        """Get progress towards user goals"""
        user = request.user
        now = timezone.now()
        
        # Get active goals
        active_goals = Goal.objects.filter(
            user=user,
            is_active=True,
            end_date__gte=now.date()
        )
        
        goal_progress = []
        for goal in active_goals:
            # Calculate current progress
            start_date = goal.start_date
            end_date = goal.end_date
            current_date = now.date()
            
            # Get tasks in goal period
            goal_tasks = Task.objects.filter(
                created_by=user,
                created_at__date__gte=start_date,
                created_at__date__lte=current_date
            )
            
            current_completion_rate = 0
            if goal_tasks.exists():
                completed = goal_tasks.filter(status='success').count()
                current_completion_rate = (completed / goal_tasks.count()) * 100
            
            # Calculate daily average
            days_elapsed = (current_date - start_date).days + 1
            current_daily_average = goal_tasks.count() / days_elapsed if days_elapsed > 0 else 0
            
            goal_progress.append({
                'goal': GoalSerializer(goal).data,
                'current_progress': {
                    'completion_rate': round(current_completion_rate, 2),
                    'daily_average': round(current_daily_average, 2),
                    'days_elapsed': days_elapsed,
                    'progress_percentage': goal.progress_percentage
                }
            })
        
        return Response({
            'active_goals': goal_progress,
            'total_goals': active_goals.count()
        })

    @action(detail=False, methods=['get'])
    def insights(self, request):
        """Get AI-generated insights"""
        user = request.user
        
        # Get unread insights
        unread_insights = UserInsights.objects.filter(
            user=user,
            is_read=False
        ).order_by('-created_at')
        
        # Get recent insights
        recent_insights = UserInsights.objects.filter(
            user=user
        ).order_by('-created_at')[:10]
        
        return Response({
            'unread_insights': UserInsightsSerializer(unread_insights, many=True).data,
            'recent_insights': UserInsightsSerializer(recent_insights, many=True).data,
            'total_insights': UserInsights.objects.filter(user=user).count()
        })

    @action(detail=False, methods=['get'])
    def streaks(self, request):
        """Get productivity streaks"""
        user = request.user
        
        streaks = ProductivityStreak.objects.filter(user=user)
        
        return Response({
            'streaks': ProductivityStreakSerializer(streaks, many=True).data,
            'summary': {
                'total_streaks': streaks.count(),
                'longest_streak': max([s.longest_streak for s in streaks]) if streaks else 0
            }
        })

class GoalViewSet(viewsets.ModelViewSet):
    """ViewSet for managing productivity goals"""
    permission_classes = [IsAuthenticated]
    serializer_class = GoalSerializer

    def get_queryset(self):
        return Goal.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def mark_achieved(self, request, pk=None):
        """Mark a goal as achieved"""
        goal = self.get_object()
        goal.is_achieved = True
        goal.is_active = False
        goal.save()
        return Response(GoalSerializer(goal).data)

class UserInsightsViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for user insights"""
    permission_classes = [IsAuthenticated]
    serializer_class = UserInsightsSerializer

    def get_queryset(self):
        return UserInsights.objects.filter(user=self.request.user)

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark an insight as read"""
        insight = self.get_object()
        insight.is_read = True
        insight.save()
        return Response(UserInsightsSerializer(insight).data)

    @action(detail=True, methods=['post'])
    def mark_applied(self, request, pk=None):
        """Mark an insight as applied"""
        insight = self.get_object()
        insight.is_applied = True
        insight.save()
        return Response(UserInsightsSerializer(insight).data) 