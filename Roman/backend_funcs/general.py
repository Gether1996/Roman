import ast
import configparser
import json
from datetime import datetime
from statistics import mean

from django.http import JsonResponse
from django.utils.translation import activate
from django.utils.translation import gettext_lazy as _

from viewer.models import (
    AlreadyMadeReservation,
    GalleryPhoto,
    Reservation,
    Review,
    TurnedOffDay,
    VoucherPhoto,
)


config = configparser.ConfigParser()


def get_request_language(request):
    language_code = request.session.get('django_language', 'sk')
    activate(language_code)
    return language_code


def static_file_url(file_field):
    value = str(file_field or '')
    if not value:
        return ''
    return value if value.startswith('/') else f'/{value}'


def switch_language(request, language_code):
    if request.method == 'POST':
        activate(language_code)
        request.session['django_language'] = language_code
        return JsonResponse({"status": "success"})
    return JsonResponse({"status": "error"})


def bootstrap(request):
    language_code = get_request_language(request)
    user = request.user

    return JsonResponse({
        'is_authenticated': user.is_authenticated,
        'is_superuser': user.is_superuser if user.is_authenticated else False,
        'language': language_code,
        'user': {
            'email': user.email if user.is_authenticated else '',
            'name': getattr(user, 'name', '') if user.is_authenticated else '',
            'surname': getattr(user, 'surname', '') if user.is_authenticated else '',
            'phone_number': getattr(user, 'phone_number', '') if user.is_authenticated else '',
        }
    })


def homepage_data(request):
    get_request_language(request)

    photos = [
        {
            'id': photo.id,
            'src': static_file_url(photo.photo),
            'alt': getattr(photo, 'alt', '') or 'Foto',
        }
        for photo in GalleryPhoto.objects.all()
    ]
    vouchers = [
        {
            'id': voucher.id,
            'src': static_file_url(voucher.photo),
            'alt': getattr(voucher, 'alt', '') or 'Poukazka',
        }
        for voucher in VoucherPhoto.objects.all()
    ]

    reviews = Review.objects.all().order_by('-created_at')[:15]
    enriched_reviews = []

    for review in reviews:
        enriched_reviews.append({
            'id': review.id,
            'worker': review.worker,
            'name_surname': review.name_surname,
            'message': review.message,
            'stars': review.stars,
            'created_at': review.created_at.strftime('%d.%m.%Y %H:%M'),
        })

    recent_roman_stars = [review['stars'] for review in enriched_reviews[:10] if review['worker'] == 'roman']
    recent_evka_stars = [review['stars'] for review in enriched_reviews[:10] if review['worker'] == 'evka']

    return JsonResponse({
        'photos': photos,
        'vouchers': vouchers,
        'reviews': enriched_reviews,
        'roman_avg': round(mean(recent_roman_stars), 2) if recent_roman_stars else 0,
        'evka_avg': round(mean(recent_evka_stars), 2) if recent_evka_stars else 0,
    })


def reservation_bootstrap(request):
    get_request_language(request)

    user_options = [
        {
            'id': str(user.id),
            'name_surname': user.name_surname,
            'email': user.email if user.email else '',
            'phone': user.phone_number if user.phone_number else '',
        }
        for user in AlreadyMadeReservation.objects.all().order_by('name_surname')
    ]

    prefill = {
        'name_surname': '',
        'email': '',
        'phone': '',
    }

    if request.user.is_authenticated and not request.user.is_superuser:
        prefill = {
            'name_surname': f'{request.user.name} {request.user.surname}'.strip(),
            'email': request.user.email or '',
            'phone': request.user.phone_number or '',
        }

    return JsonResponse({
        'user_options': user_options,
        'prefill': prefill,
    })


def my_reservations(request):
    get_request_language(request)

    if not request.user.is_authenticated:
        return JsonResponse({'status': 'error'}, status=401)

    reservations = Reservation.objects.filter(email=request.user.email).order_by('-datetime_from')
    data = [
        {
            'id': reservation.id,
            'name_surname': reservation.name_surname,
            'massage_name': reservation.massage_name if reservation.massage_name else "",
            'email': reservation.email if reservation.email else "",
            'phone_number': reservation.phone_number if reservation.phone_number else "",
            'date': reservation.get_date_string(),
            'time': reservation.get_time_range_string(),
            'worker': reservation.worker,
            'status': reservation.status if reservation.status else "",
            'special_request': reservation.special_request if reservation.special_request else "",
            'created_at': reservation.get_created_at_string(),
            'active': reservation.active,
            'is_past': datetime.now() > reservation.datetime_to,
            'cancellation_reason': reservation.cancellation_reason if reservation.cancellation_reason else ""
        }
        for reservation in reservations
    ]
    return JsonResponse({'reservations': data})


def parse_working_days(raw_value):
    try:
        parsed = ast.literal_eval(raw_value)
        return parsed if isinstance(parsed, list) else []
    except (SyntaxError, ValueError):
        return []


def settings_bootstrap(request):
    get_request_language(request)

    if not request.user.is_authenticated:
        return JsonResponse({'status': 'error'}, status=401)
    if not request.user.is_superuser:
        return JsonResponse({'status': 'error'}, status=403)

    config.read('config.ini')

    if 'settings-roman' not in config or 'settings-evka' not in config or 'settings' not in config:
        return JsonResponse({'status': 'error', 'message': 'Server configuration missing (config.ini).'}, status=503)

    days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

    def worker_payload(worker_key):
        return {
            'days_ahead': int(config[worker_key]['days_ahead']),
            'working_days': parse_working_days(config[worker_key]['working_days']),
            'hours': {
                day: {
                    'start': str(config[worker_key][f'{day}_starting_hour']),
                    'end': str(config[worker_key][f'{day}_ending_hour']),
                }
                for day in days
            }
        }

    turned_off_days = [
        {
            'id': day.id,
            'worker': day.worker,
            'date': day.formatted_date(),
            'whole_day': day.whole_day,
            'time_range': day.formatted_time_range(),
        }
        for day in TurnedOffDay.objects.all().order_by('-date')
    ]

    return JsonResponse({
        'roman': worker_payload('settings-roman'),
        'evka': worker_payload('settings-evka'),
        'turned_off_days': turned_off_days,
        'reservations_per_page': int(config['settings']['reservations_per_page']),
    })


def admin_calendar_data(request):
    get_request_language(request)

    if not request.user.is_authenticated:
        return JsonResponse({'status': 'error'}, status=401)
    if not request.user.is_superuser:
        return JsonResponse({'status': 'error'}, status=403)

    current_datetime = datetime.now()
    future_reservations = Reservation.objects.filter(datetime_from__gt=current_datetime)
    events = []

    for reservation in future_reservations:
        events.append({
            'id': reservation.id,
            'title': f"{reservation.worker} - {reservation.name_surname}",
            'start': reservation.datetime_from.isoformat(),
            'end': reservation.datetime_to.isoformat(),
            'borderColor': reservation.get_color(),
            'backgroundColor': reservation.get_color(),
            'textColor': 'white',
            'extendedProps': {
                'phone': reservation.phone_number,
                'email': reservation.email,
                'active': "True" if reservation.active else "False",
            }
        })

    return JsonResponse({'events': events})


def add_review(request):
    get_request_language(request)
    json_data = json.loads(request.body)

    name = json_data.get('name_surname')
    message = json_data.get('message')
    stars = json_data.get('stars')
    worker = json_data.get('worker')

    if not name or not message or not stars or not worker:
        return JsonResponse({'error': 'Invalid input'}, status=400)

    try:
        stars = int(stars)
        if stars < 1 or stars > 5:
            return JsonResponse({'error': 'Rating must be between 1 and 5'}, status=400)
    except ValueError:
        return JsonResponse({'error': 'Rating must be a number'}, status=400)

    Review.objects.create(
        name_surname=name,
        message=message,
        stars=stars,
        worker=worker.lower(),
        created_at=datetime.now(),
    )

    return JsonResponse({'message': 'Review submitted successfully'}, status=200)


def delete_review(request, id):
    get_request_language(request)

    if request.method == 'DELETE':
        try:
            review = Review.objects.get(id=id)
            review.delete()
            return JsonResponse({'status': 'success'})
        except Review.DoesNotExist:
            return JsonResponse({'status': 'error'})
    return JsonResponse({'status': 'error', 'message': _('Zly request')})
