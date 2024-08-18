from django.shortcuts import render
from django.utils.translation import activate
from viewer.models import GalleryPhoto, VoucherPhoto, Reservation, TurnedOffDay
from accounts.models import CustomUser
from django.utils.translation import gettext_lazy as _
import configparser

config = configparser.ConfigParser()


def homepage(request):
    language_code = request.session.get('django_language', 'sk')
    photos = GalleryPhoto.objects.all()
    vouchers = VoucherPhoto.objects.all()

    activate(language_code)
    return render(request, 'homepage.html', {'photos': photos, 'vouchers': vouchers})


def reservation(request):
    turned_off_days = TurnedOffDay.objects.all()

    return render(request, 'reservation.html', {'turned_off_days': turned_off_days})


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