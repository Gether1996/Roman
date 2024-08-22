from django.http import JsonResponse
from django.shortcuts import render, redirect
from django.utils.translation import activate
from viewer.models import GalleryPhoto, VoucherPhoto, Reservation, TurnedOffDay
from accounts.models import CustomUser
from django.utils.translation import gettext_lazy as _
import configparser
from django.contrib.auth.decorators import login_required
from django.urls import reverse
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from Roman.backend_funcs.reservation import prepare_reservation_data, send_email
from django.template.loader import render_to_string

config = configparser.ConfigParser()


def homepage(request):
    language_code = request.session.get('django_language', 'sk')
    photos = GalleryPhoto.objects.all()
    vouchers = VoucherPhoto.objects.all()

    activate(language_code)
    return render(request, 'homepage.html', {'photos': photos, 'vouchers': vouchers})


def reservation(request):
    return render(request, 'reservation.html')


def settings(request):
    config.read('config.ini')

    days_ahead_roman = int(config['settings-roman']['days_ahead'])
    starting_slot_hour_roman = str(config['settings-roman']['starting_slot_hour'])
    ending_slot_hour_roman = str(config['settings-roman']['ending_slot_hour'])
    working_days_roman = config['settings-roman']['working_days']

    days_ahead_evka = int(config['settings-evka']['days_ahead'])
    starting_slot_hour_evka = str(config['settings-evka']['starting_slot_hour'])
    ending_slot_hour_evka = str(config['settings-evka']['ending_slot_hour'])
    working_days_evka = config['settings-evka']['working_days']

    turned_off_days = TurnedOffDay.objects.all()

    turned_off_days_data = [
        {
            'id': day.id,
            'worker': day.worker,
            'date': day.formatted_date(),
            'whole_day': day.whole_day,
            'time_range': day.formatted_time_range(),
        }
        for day in turned_off_days
    ]

    context = {
        'turned_off_days_data': turned_off_days_data,
        'days_ahead_roman': days_ahead_roman,
        'starting_slot_hour_roman': starting_slot_hour_roman,
        'ending_slot_hour_roman': ending_slot_hour_roman,
        'working_days_roman': working_days_roman,
        'days_ahead_evka': days_ahead_evka,
        'starting_slot_hour_evka': starting_slot_hour_evka,
        'ending_slot_hour_evka': ending_slot_hour_evka,
        'working_days_evka': working_days_evka,
    }

    return render(request, 'settings_view.html', context)


def profile(request, email):
    try:
        user = CustomUser.objects.get(email=email)
        reservations = Reservation.objects.filter(user=user).order_by('datetime_from')

        reservation_data = [
            {
                'id': reservation.id,
                'name_surname': reservation.name_surname,
                'email': reservation.email,
                'phone_number': reservation.phone_number,
                'date': reservation.get_date_string(),
                'time': reservation.get_time_range_string(),
                'worker': reservation.worker,
                'status': reservation.status,
                'special_request': reservation.special_request,
                'created_at': reservation.get_created_at_string(),
            }
            for reservation in reservations
        ]

        context = {
            'reservation_data': reservation_data
        }

        return render(request, 'profile.html', context)

    except CustomUser.DoesNotExist:
        message = _('Najskôr sa prihláste.')
        return render(request, 'error.html', {'message': message})

@login_required
def all_reservations(request):
    sort_by = request.GET.get('sort_by', 'datetime_from')
    order = request.GET.get('order', 'desc')
    page = request.GET.get('page', 1)

    context = {
        'current_sort_by': sort_by,
        'current_order': order,
        'page': page,
    }

    if 'sort_by' not in request.GET:
        if page:
            return redirect(f'{reverse("all_reservations")}?sort_by=datetime_from&order=desc&page={page}')
        else:
            return redirect(f'{reverse("all_reservations")}?sort_by=datetime_from&order=desc')
    return render(request, 'all_reservations.html', context)


def get_all_reservations_data(request):
    config.read('config.ini')
    filters = {
        'name_surname': request.GET.get('name_surname', ''),
        'email': request.GET.get('email', ''),
        'phone_number': request.GET.get('phone_number', ''),
        'date': request.GET.get('date', ''),
        'slot': request.GET.get('slot', ''),
        'worker': request.GET.get('worker', ''),
        'created_at': request.GET.get('created_at', ''),
        'special_request': request.GET.get('special_request', ''),
        'status': request.GET.get('status', ''),
    }

    reservations_per_page = int(config['settings']['reservations_per_page'])
    all_reservations_obj = Reservation.objects.all()

    sort_by = request.GET.get('sort_by', 'datetime_from')
    order = request.GET.get('order', 'desc')

    if filters['name_surname']:
        all_reservations_obj = all_reservations_obj.filter(name_surname__icontains=filters['name_surname'])

    if filters['email']:
        all_reservations_obj = all_reservations_obj.filter(email__icontains=filters['email'])

    if filters['phone_number']:
        all_reservations_obj = all_reservations_obj.filter(phone_number__icontains=filters['phone_number'])

    if filters['worker']:
        all_reservations_obj = all_reservations_obj.filter(worker__icontains=filters['worker'])

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

    print(response_data)

    return JsonResponse(response_data, safe=False)


def approve_reservation_mail(request, reservation_id):
    if request.method == 'GET':
        try:
            reserv = Reservation.objects.get(id=reservation_id)

            if not reserv.active:
                reserv.active = True
                reserv.status = 'Schválená'
                reserv.save()

                subject = f'Vaša rezervácia bola akceptovaná'
                html_message = render_to_string('email_template.html',
                                                {'reservation': prepare_reservation_data(reserv),
                                                 'button': None,
                                                 'accept_link': None,
                                                 'text': '',
                                                 })
                send_email(subject, html_message, reserv.email)

            context = {
                'reservation': prepare_reservation_data(reserv),
            }

            return render(request, 'approved_reservation.html', context)

        except Reservation.DoesNotExist:
            message = 'Rezervácia sa nenašla.'
            return render(request, 'error.html', {'message': message})

    message = 'Zlý request'
    return render(request, 'error.html', {'message': message})
