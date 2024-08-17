"""
URL configuration for Roman project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, re_path
from viewer.views import homepage, switch_language, profile
from accounts.views import login_api, logout, registration
from django.views.static import serve
from django.conf.urls.static import static
from django.conf import settings


urlpatterns = [
    re_path(r'^static/(?P<path>.*)$', serve, {'document_root': settings.STATIC_ROOT}),
    path('login_api/', login_api, name='login_api'),
    path('logout/', logout, name='logout'),
    path('registration/', registration, name='registration'),
    re_path(r'^profile/(?P<email>[^/]+)/$', profile, name='profile'),

    path('', homepage, name='homepage'),
    path('admin/', admin.site.urls),
    path('switch_language/<str:language_code>/', switch_language, name='switch_language'),


] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
