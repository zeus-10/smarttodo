from rest_framework import serializers
from .models import ProductivityMetrics, UserInsights, Goal, ProductivityStreak, TaskCategory

class ProductivityMetricsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductivityMetrics
        fields = '__all__'

class UserInsightsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserInsights
        fields = '__all__'

class GoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Goal
        fields = '__all__'

class ProductivityStreakSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductivityStreak
        fields = '__all__'

class TaskCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskCategory
        fields = '__all__'
