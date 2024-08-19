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
from viewer.views import homepage, profile, reservation, settings as settings_view
from Roman.backend_funcs.users import login_api, logout, registration
from Roman.backend_funcs.general import switch_language
from Roman.backend_funcs.settings_view import save_settings, add_turned_off_day, delete_turned_off_day
from Roman.backend_funcs.reservation import check_available_slots, check_available_slots_ahead, create_reservation
from django.views.static import serve
from django.conf.urls.static import static
from django.conf import settings


urlpatterns = [
    re_path(r'^static/(?P<path>.*)$', serve, {'document_root': settings.STATIC_ROOT}),

    #views
    path('', homepage, name='homepage'),
    path('admin/', admin.site.urls),
    path('reservation/', reservation, name='reservation'),
    path('settings_view/', settings_view, name='settings_view'),
    re_path(r'^profile/(?P<email>[^/]+)/$', profile, name='profile'),

    #API
    path('login_api/', login_api, name='login_api'),
    path('save_settings/', save_settings, name='save_settings'),
    path('logout/', logout, name='logout'),
    path('registration/', registration, name='registration'),
    path('add_turned_off_day/', add_turned_off_day, name='add_turned_off_day'),
    path('delete_turned_off_day/', delete_turned_off_day, name='delete_turned_off_day'),
    path('switch_language/<str:language_code>/', switch_language, name='switch_language'),

    path('check_available_slots/', check_available_slots, name='check_available_slots'),
    path('check_available_slots_ahead/<str:worker>/', check_available_slots_ahead, name='check_available_slots_ahead'),
    path('create_reservation/', create_reservation, name='create_reservation'),


] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
