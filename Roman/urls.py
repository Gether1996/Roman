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
from viewer.views import homepage, profile, reservation, settings as settings_view, get_all_reservations_data, \
    all_reservations, approve_reservation_mail
from Roman.backend_funcs.users import login_api, logout, registration, delete_saved_person
from Roman.backend_funcs.general import switch_language
from Roman.backend_funcs.settings_view import save_settings, add_turned_off_day, delete_turned_off_day
from Roman.backend_funcs.reservation import check_available_slots, check_available_slots_ahead, create_reservation, \
    deactivate_reservation, approve_reservation, deactivate_reservation_by_admin, add_personal_note, delete_reservation
from django.views.static import serve
from django.conf.urls.static import static
from django.conf import settings


urlpatterns = [
    re_path(r'^static/(?P<path>.*)$', serve, {'document_root': settings.STATIC_ROOT}),

    #views
    path('', homepage, name='homepage'),
    path('admin/', admin.site.urls),
    path('reservation/', reservation, name='reservation'),
    path('all_reservations/', all_reservations, name='all_reservations'),
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
    path('deactivate_reservation/', deactivate_reservation, name='deactivate_reservation'),
    path('get_all_reservations_data/', get_all_reservations_data, name='get_all_reservations_data'),

    path('approve_reservation/', approve_reservation, name='approve_reservation'),
    path('deactivate_reservation_by_admin/', deactivate_reservation_by_admin, name='deactivate_reservation_by_admin'),
    path('add_personal_note/', add_personal_note, name='add_personal_note'),
    path('delete_reservation/', delete_reservation, name='delete_reservation'),

    path('approve_reservation_mail/<int:reservation_id>/', approve_reservation_mail, name='approve_reservation_mail'),
    path('delete_saved_person/', delete_saved_person, name='delete_saved_person'),


] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
