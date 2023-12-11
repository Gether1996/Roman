def language_code(request):
    language_code = request.session.get('django_language', 'sk')
    return {'language_code': language_code}
