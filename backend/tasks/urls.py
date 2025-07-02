from django.urls import path, include
from rest_framework.routers import DefaultRouter, SimpleRouter
from rest_framework_nested import routers
from .views import (
    TaskViewSet, TaskTemplateViewSet, 
    TaskCommentViewSet, TaskAttachmentViewSet
)

# Create the main router
router = DefaultRouter()
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'templates', TaskTemplateViewSet, basename='template')

# Create nested routers for comments and attachments
task_router = routers.NestedDefaultRouter(router, r'tasks', lookup='task')
task_router.register(r'comments', TaskCommentViewSet, basename='task-comments')
task_router.register(r'attachments', TaskAttachmentViewSet, basename='task-attachments')

urlpatterns = [
    path('', include(router.urls)),
    path('', include(task_router.urls)),
] 