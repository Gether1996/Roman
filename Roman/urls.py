from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, re_path
from django.views.static import serve

from Roman.backend_funcs.general import (
    add_review,
    admin_calendar_data,
    bootstrap,
    delete_review,
    homepage_data,
    my_reservations,
    reservation_bootstrap,
    settings_bootstrap,
    switch_language,
)
from Roman.backend_funcs.reservation import (
    add_personal_note,
    approve_reservation,
    check_available_durations,
    check_available_slots,
    check_available_slots_ahead,
    create_reservation,
    deactivate_reservation,
    deactivate_reservation_by_admin,
    delete_reservation,
)
from Roman.backend_funcs.settings_view import (
    add_turned_off_day,
    delete_turned_off_day,
    delete_turned_off_days,
    save_settings,
)
from Roman.backend_funcs.users import delete_saved_person, login_api, logout, registration
from viewer.views import approve_reservation_mail, get_all_reservations_data, vue_app


urlpatterns = [
    path('', vue_app, name='homepage'),
    path('reservation/', vue_app, name='reservation'),
    path('profile/', vue_app, name='profile'),
    path('all_reservations/', vue_app, name='all_reservations'),
    path('settings_view/', vue_app, name='settings_view'),
    path('calendar_view_admin/', vue_app, name='calendar_view_admin'),
    path('admin/', admin.site.urls),

    path('api/bootstrap/', bootstrap, name='api_bootstrap'),
    path('api/homepage/', homepage_data, name='api_homepage'),
    path('api/reservation-bootstrap/', reservation_bootstrap, name='api_reservation_bootstrap'),
    path('api/my-reservations/', my_reservations, name='api_my_reservations'),
    path('api/settings-bootstrap/', settings_bootstrap, name='api_settings_bootstrap'),
    path('api/admin-calendar/', admin_calendar_data, name='api_admin_calendar'),

    path('login_api/', login_api, name='login_api'),
    path('save_settings/', save_settings, name='save_settings'),
    path('logout/', logout, name='logout'),
    path('registration/', registration, name='registration'),
    path('add_turned_off_day/', add_turned_off_day, name='add_turned_off_day'),
    path('delete_turned_off_day/', delete_turned_off_day, name='delete_turned_off_day'),
    path('delete_turned_off_days/', delete_turned_off_days, name='delete_turned_off_days'),
    path('switch_language/<str:language_code>/', switch_language, name='switch_language'),
    path('check_available_slots/', check_available_slots, name='check_available_slots'),
    path('check_available_slots_ahead/<str:worker>/', check_available_slots_ahead, name='check_available_slots_ahead'),
    path('check_available_durations/<str:worker>/', check_available_durations, name='check_available_durations'),
    path('create_reservation/', create_reservation, name='create_reservation'),
    path('deactivate_reservation/', deactivate_reservation, name='deactivate_reservation'),
    path('get_all_reservations_data/', get_all_reservations_data, name='get_all_reservations_data'),
    path('approve_reservation/', approve_reservation, name='approve_reservation'),
    path('deactivate_reservation_by_admin/', deactivate_reservation_by_admin, name='deactivate_reservation_by_admin'),
    path('add_personal_note/', add_personal_note, name='add_personal_note'),
    path('delete_reservation/', delete_reservation, name='delete_reservation'),
    path('approve_reservation_mail/<int:reservation_id>/', approve_reservation_mail, name='approve_reservation_mail'),
    path('delete_saved_person/', delete_saved_person, name='delete_saved_person'),
    path('add_review/', add_review, name='add_review'),
    path('delete_review/<id>/', delete_review, name='delete_review'),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATICFILES_DIRS[0])

urlpatterns += [
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]
