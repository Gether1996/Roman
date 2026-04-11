from django.conf import settings
from django.utils.cache import patch_cache_control


class NoCacheForDynamicResponsesMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        request_path = request.path or ''
        static_url = getattr(settings, 'STATIC_URL', '/static/')
        media_url = getattr(settings, 'MEDIA_URL', '/media/')

        if request_path.startswith(static_url) or request_path.startswith(media_url):
            return response

        content_type = response.get('Content-Type', '')
        should_disable_cache = (
            request_path == '/'
            or request_path.startswith('/api/')
            or request_path.startswith('/login_api/')
            or request_path.startswith('/logout/')
            or request_path.startswith('/registration/')
            or 'text/html' in content_type
            or 'application/json' in content_type
        )

        if should_disable_cache:
            patch_cache_control(
                response,
                no_cache=True,
                no_store=True,
                must_revalidate=True,
                private=True,
                max_age=0,
            )
            response['Pragma'] = 'no-cache'
            response['Expires'] = '0'

        return response
