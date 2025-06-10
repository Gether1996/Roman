from django.utils.translation import activate
from django.http import JsonResponse
import json
from viewer.models import Review
from datetime import datetime


def switch_language(request, language_code):
    if request.method == 'POST':
        activate(language_code)
        request.session['django_language'] = language_code
        return JsonResponse({"status": "success"})
    return JsonResponse({"status": "error"})

def add_review(request):
    json_data = json.loads(request.body)

    # Extract fields
    name = json_data.get('name_surname')
    message = json_data.get('message')
    stars = json_data.get('stars')
    worker = json_data.get('worker')

    # Validate input
    if not name or not message or not stars or not worker:
        return JsonResponse({'error': 'Invalid input'}, status=400)

    # Optional: convert stars to integer and validate range
    try:
        stars = int(stars)
        if stars < 1 or stars > 5:
            return JsonResponse({'error': 'Rating must be between 1 and 5'}, status=400)
    except ValueError:
        return JsonResponse({'error': 'Rating must be a number'}, status=400)

    new_review = Review.objects.create(
        name_surname=name,
        message=message,
        stars=stars,
        worker=worker.lower(),
        created_at=datetime.now(),
    )

    return JsonResponse({'message': 'Review submitted successfully'}, status=200)

def delete_review(request, id):
    if request.method == 'DELETE':
        try:
            review = Review.objects.get(id=id)
            review.delete()
            return JsonResponse({'status': 'success'})
        except Review.DoesNotExist:
            return JsonResponse({'status': 'error'})
    return JsonResponse({'status': 'error', 'message': _('Zlý request')})