from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def api_info(request):
    """Simple API info endpoint for the root URL"""
    return JsonResponse({
        'message': 'Smart Todo API',
        'version': '1.0.0',
        'description': 'A dynamic, fully-functional Todo List application with time-based automation.',
        'endpoints': {
            'tasks': '/api/tasks/',
            'analytics': '/api/analytics/',
            'admin': '/admin/',
        },
        'documentation': 'Visit the frontend at http://localhost:3000 for the full application interface.'
    })
