import configparser
import logging

from django.conf import settings
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.http import JsonResponse
from django.shortcuts import render
from django.template.loader import render_to_string
from django.utils.translation import activate
from django.views.decorators.csrf import ensure_csrf_cookie
from Roman.backend_funcs.content import get_content
from Roman.backend_funcs.system_config import reload_config
from Roman.backend_funcs.audit import log_change, reservation_label
from Roman.backend_funcs.reservation import (
    CANCELLED_STATUSES,
    build_google_calendar_link,
    build_ics,
    check_approve_token,
    prepare_reservation_data,
    send_email,
)
from viewer.models import Reservation

config = configparser.ConfigParser()
logger = logging.getLogger(__name__)

def get_all_reservations_data(request):
    if not request.user.is_authenticated or not request.user.is_superuser:
        return JsonResponse({'status': 'error', 'message_sk': 'Prístup zamietnutý.', 'message_en': 'Access denied.'}, status=403)
    reload_config(config)
    filters = {
        'name_surname': request.GET.get('name_surname', ''),
        'email': request.GET.get('email', ''),
        'phone_number': request.GET.get('phone_number', ''),
        'date': request.GET.get('date', ''),
        'slot': request.GET.get('slot', ''),
        'type': request.GET.get('type', ''),
        'worker': request.GET.get('worker', ''),
        'created_at': request.GET.get('created_at', ''),
        'special_request': request.GET.get('special_request', ''),
        'status': request.GET.get('status', ''),
    }

    reservations_per_page = int(config['settings']['reservations_per_page'])
    all_reservations_obj = Reservation.objects.all()
    sort_by = request.GET.get('sort_by', 'datetime_from')
    if sort_by not in ('datetime_from', 'created_at', 'name_surname', 'worker', 'status'):
        sort_by = 'datetime_from'
    order = request.GET.get('order', 'asc')

    if filters['name_surname']:
        all_reservations_obj = all_reservations_obj.filter(name_surname__icontains=filters['name_surname'])

    if filters['email']:
        all_reservations_obj = all_reservations_obj.filter(email__icontains=filters['email'])

    if filters['phone_number']:
        all_reservations_obj = all_reservations_obj.filter(phone_number__icontains=filters['phone_number'])

    if filters['worker']:
        all_reservations_obj = all_reservations_obj.filter(worker__icontains=filters['worker'])

    if filters['type']:
        all_reservations_obj = all_reservations_obj.filter(massage_name__icontains=filters['type'])

    if filters['special_request']:
        all_reservations_obj = all_reservations_obj.filter(special_request__icontains=filters['special_request'])

    if filters['status']:
        all_reservations_obj = all_reservations_obj.filter(status__icontains=filters['status'])

    if filters['created_at']:
        all_reservations_obj_filtered = [
            reservation for reservation in all_reservations_obj
            if filters['created_at'] in reservation.get_created_at_string()
        ]
        all_reservations_obj = all_reservations_obj.filter(created_at__in=[reservation.created_at for reservation in all_reservations_obj_filtered])

    if filters['date']:
        all_reservations_obj_filtered = [
            reservation for reservation in all_reservations_obj
            if filters['date'] in reservation.get_date_string()
        ]
        all_reservations_obj = all_reservations_obj.filter(datetime_from__in=[reservation.datetime_from for reservation in all_reservations_obj_filtered])

    if filters['slot']:
        all_reservations_obj_filtered = [
            reservation for reservation in all_reservations_obj
            if filters['slot'] in reservation.get_time_range_string()
        ]
        all_reservations_obj = all_reservations_obj.filter(datetime_from__in=[reservation.datetime_from for reservation in all_reservations_obj_filtered])

    if order == 'asc' and sort_by:
        all_reservations_obj = all_reservations_obj.order_by(str(sort_by))
    elif order == 'desc' and sort_by:
        all_reservations_obj = all_reservations_obj.order_by(f'-{sort_by}')

    paginator = Paginator(all_reservations_obj, reservations_per_page)
    page = request.GET.get('page', 1)
    try:
        loaded_reservations = paginator.page(page)
    except PageNotAnInteger:
        loaded_reservations = paginator.page(1)
    except EmptyPage:
        loaded_reservations = paginator.page(paginator.num_pages)

    formatted_reservations = []
    for reservation in loaded_reservations:
        formatted_reservations.append(prepare_reservation_data(reservation))

    response_data = {
        'reservations': formatted_reservations,
        'pagination': {
            'current_page': loaded_reservations.number,
            'total_pages': paginator.num_pages,
            'total_files': paginator.count,
            'files_per_page': reservations_per_page,
            'has_previous': loaded_reservations.has_previous(),
            'has_next': loaded_reservations.has_next(),
        }
    }
    return JsonResponse(response_data, safe=False)


def approve_reservation_mail(request, reservation_id):
    """Approve a reservation from the link in the notification e-mail.

    Works with one click exactly like before. Security: new e-mails carry a
    signed token, so reservations can't be approved by guessing IDs. Links from
    e-mails sent before this change (no token) keep working for reservations
    created before the change (those have no consent timestamp).
    """
    token = request.GET.get('t') or request.POST.get('t') or ''

    try:
        reserv = Reservation.objects.get(id=reservation_id)
    except Reservation.DoesNotExist:
        return render(request, 'error.html', {'message': 'Rezervácia sa nenašla.'}, status=404)

    allowed = (
        (request.user.is_authenticated and request.user.is_superuser)
        or check_approve_token(reservation_id, token)
        or (not token and reserv.consent_at is None)  # legacy link from an older e-mail
    )

    if not allowed:
        return render(request, 'error.html', {
            'message': 'Odkaz na schválenie je neplatný alebo vypršal.',
            'detail': 'Prihláste sa ako administrátor a schváľte rezerváciu v administrácii.',
            'show_admin_link': True,
        }, status=403)

    cancelled = reserv.status in CANCELLED_STATUSES
    context = {'reservation': prepare_reservation_data(reserv), 'token': token, 'cancelled': cancelled}

    if request.method in ('GET', 'POST') and not reserv.active and not cancelled:
        reserv.active = True
        reserv.status = 'Schválená'
        reserv.save()
        log_change(request, 'approve', 'reservation', 'Schválená rezervácia (odkazom z e-mailu): ' + reservation_label(reserv),
                   obj=reserv, actor_name='Odkaz zo schvaľovacieho e-mailu')
        try:
            if reserv.email:
                subject = 'Rezervácia potvrdená / Reservation accepted'
                html_message = render_to_string('email_template.html', {
                    'reservation': prepare_reservation_data(reserv),
                    'button': None,
                    'accept_link': None,
                    'calendar_link': build_google_calendar_link(reserv),
                    'text': 'Rezervácia potvrdená / Reservation accepted',
                })
                send_email(subject, html_message, reserv.email, ics_content=build_ics(reserv))
        except Exception as email_error:
            logger.error('Approval (mail link) email failed: %s', email_error)
        context['reservation'] = prepare_reservation_data(reserv)
        context['just_approved'] = True

    context['approved'] = reserv.active
    return render(request, 'approved_reservation.html', context)


@ensure_csrf_cookie
def vue_app(request):
    language_code = request.session.get('django_language', 'sk')
    if language_code not in ('sk', 'en'):
        language_code = 'sk'
    activate(language_code)
    meta = {'title': 'Masáže Vlčince', 'description': ''}
    try:
        general = get_content()['general']
        meta['title'] = general['seo_title'].get(language_code) or general['seo_title'].get('sk') or general['site_name']
        meta['description'] = general['seo_description'].get(language_code) or general['seo_description'].get('sk') or ''
        meta['site_name'] = general['site_name']
    except Exception as exc:  # never break the page because of content
        logger.error('Content load failed: %s', exc)
    return render(request, 'vue_app.html', {
        'language_code': language_code,
        'meta': meta,
        'canonical': f"{getattr(settings, 'SITE_URL', '').rstrip('/')}{request.path}",
    })
