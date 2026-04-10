import configparser
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.http import JsonResponse
from django.shortcuts import render
from django.template.loader import render_to_string
from django.utils.translation import activate
from Roman.backend_funcs.reservation import prepare_reservation_data, send_email
from viewer.models import Reservation

config = configparser.ConfigParser()

def get_all_reservations_data(request):
    if not request.user.is_authenticated or not request.user.is_superuser:
        return JsonResponse({'status': 'error', 'message_sk': 'Prístup zamietnutý.', 'message_en': 'Access denied.'}, status=403)
    config.read('config.ini')
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
    if request.method == 'GET':
        try:
            reserv = Reservation.objects.get(id=reservation_id)
            if not reserv.active:
                reserv.active = True
                reserv.status = 'Schválená'
                reserv.save()
                subject = f'Rezervácia potvrdená / Reservation accepted'
                html_message = render_to_string('email_template.html',
                                                {'reservation': prepare_reservation_data(reserv),
                                                 'button': None,
                                                 'accept_link': None,
                                                 'text': 'Rezervácia potvrdená / Reservation accepted',
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
def vue_app(request):
    language_code = request.session.get('django_language', 'sk')
    activate(language_code)
    return render(request, 'vue_app.html', {'language_code': language_code})
