from django.utils.translation import activate
from django.http import JsonResponse


def switch_language(request, language_code):
    if request.method == 'POST':
        activate(language_code)
        request.session['django_language'] = language_code
        return JsonResponse({"status": "success"})
    return JsonResponse({"status": "error"})