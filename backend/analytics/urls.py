from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AnalyticsViewSet, GoalViewSet, UserInsightsViewSet

router = DefaultRouter()
router.register(r'', AnalyticsViewSet, basename='analytics')
router.register(r'goals', GoalViewSet, basename='goal')
router.register(r'insights', UserInsightsViewSet, basename='insight')

urlpatterns = [
    path('', include(router.urls)),
]
