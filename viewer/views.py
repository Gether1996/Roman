from django.shortcuts import render
from django.utils.translation import activate
from django.http import JsonResponse
from viewer.models import GalleryPhoto, VoucherPhoto, Reservation
from accounts.models import CustomUser
from django.utils.translation import gettext_lazy as _


def homepage(request):
    language_code = request.session.get('django_language', 'sk')
    photos = GalleryPhoto.objects.all()
    vouchers = VoucherPhoto.objects.all()

    activate(language_code)
    return render(request, 'homepage.html', {'photos': photos, 'vouchers': vouchers})





def profile(request, email):
    try:
        user = CustomUser.objects.get(email=email)
        reservations = Reservation.objects.filter(user=user).order_by('datetime_from')

        reservation_data = [
            {
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


def switch_language(request, language_code):
    if request.method == 'POST':
        activate(language_code)
        request.session['django_language'] = language_code
        return JsonResponse({"status": "success"})
    return JsonResponse({"status": "error"})