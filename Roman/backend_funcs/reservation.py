from django.conf import settings
from django.http import JsonResponse
from viewer.models import Reservation, TurnedOffDay, AlreadyMadeReservation
import json
from datetime import datetime, timedelta
from django.utils.translation import gettext_lazy as _
import configparser
from django.core.mail import send_mail
from django.template.loader import render_to_string

config = configparser.ConfigParser()

def send_email(subject, html_message, to_mail):
    from_email = getattr(settings, 'EMAIL_HOST_USER')
    send_mail(
        subject=subject,
        message='',
        from_email=from_email,
        recipient_list=[to_mail],
        html_message=html_message,
    )

def prepare_reservation_data(reservation):
    data = {
        'id': str(reservation.id),
        'name_surname': reservation.name_surname,
        'massage_name': reservation.massage_name if reservation.massage_name else "",
        'email': reservation.email if reservation.email else '',
        'phone_number': str(reservation.phone_number).replace(" ", "") if reservation.phone_number else '',
        'date': reservation.get_date_string(),
        'slot': reservation.get_time_range_string(),
        'active': reservation.active,
        'worker': reservation.worker,
        'status': reservation.status,
        'created_at': reservation.get_created_at_string(),
        'special_request': reservation.special_request if reservation.special_request else '',
        'personal_note': reservation.personal_note if reservation.personal_note else '',
        'cancellation_reason': reservation.cancellation_reason if reservation.cancellation_reason else '',
    }
    return data

def create_reservation(request):
    if request.method == 'POST':
        active = False
        status = 'Čaká sa schválenie'
        note = 'user'
        user = request.user if request.user.is_authenticated else None
        if user and user.is_superuser:
            active = True
            status = 'Schválená'
            note = 'admin'

        config.read('config.ini')
        json_data = json.loads(request.body)

        selected_date = json_data.get('selectedDate')
        time_slot = json_data.get('timeSlot')
        duration = json_data.get('duration')
        massage_name = json_data.get('massageName')

        datetime_from_obj = datetime.strptime(f"{selected_date} {time_slot}", "%Y-%m-%d %H:%M")
        date_time_to_obj = datetime_from_obj + timedelta(minutes=int(duration))

        user = request.user if request.user.is_authenticated else None

        new_reservation = Reservation.objects.create(
            massage_name=massage_name,
            user=user,
            name_surname=json_data.get('nameSurname'),
            email=json_data.get('email'),
            phone_number=json_data.get('phone'),
            worker=json_data.get('worker'),
            status=status,
            active=active,
            special_request=json_data.get('note') if note == 'user' else '',
            personal_note=json_data.get('note') if note == 'admin' else '',
            datetime_from=datetime_from_obj,
            datetime_to=date_time_to_obj,
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )

        try:
            already_created_reservation = AlreadyMadeReservation.objects.get(name_surname=json_data.get('nameSurname'))
        except AlreadyMadeReservation.DoesNotExist:
            already_created_reservation = AlreadyMadeReservation.objects.create(
                name_surname=json_data.get('nameSurname'),
                email=json_data.get('email'),
                phone_number=json_data.get('phone'),
            )

        if note == 'user':
            subject = f'Nová rezervácia ({new_reservation.worker})'
            accept_link = f'https://masazevlcince.sk/approve_reservation_mail/{new_reservation.id}/'
            all_reservations_link = f'https://masazevlcince.sk/all_reservations/'
            text = f'Nová rezervácia pre maséra {new_reservation.worker}'
            html_message = render_to_string('email_template.html',
                                            {'reservation': prepare_reservation_data(new_reservation),
                                             'button': True,
                                             'accept_link': accept_link,
                                             'all_reservations_link': all_reservations_link,
                                             'text': text,
                                             })
            send_email(subject, html_message, getattr(settings, 'MAIN_EMAIL'))

        if note == 'admin' and new_reservation.email:
            subject = f'Rezervácia potvrdená / Reservation accepted'
            html_message = render_to_string('email_template.html',
                                            {'reservation': prepare_reservation_data(new_reservation),
                                             'button': None,
                                             'accept_link': None,
                                             'all_reservations_link': None,
                                             'text': 'Rezervácia potvrdená / Reservation accepted',
                                             })
            send_email(subject, html_message, new_reservation.email)
        return JsonResponse({'status': 'success'})
    return JsonResponse({'status': 'error'})

def check_available_slots(request):
    if request.method == 'POST':
        config.read('config.ini')
        json_data = json.loads(request.body)

        worker = json_data.get('worker')
        selected_date = json_data['selectedDate']
        selected_date = datetime.strptime(selected_date, '%Y-%m-%d').date()
        weekday_name = selected_date.strftime('%A')

        worker_config = config['settings-roman'] if worker == 'Roman' else config['settings-evka']
        starting_hour_str = worker_config.get(f'{weekday_name}_starting_hour')
        ending_hour_str = worker_config.get(f'{weekday_name}_ending_hour')

        # Determine work hours
        starting_hour = datetime.strptime(starting_hour_str, '%H:%M').time()
        ending_hour = datetime.strptime(ending_hour_str, '%H:%M').time()

        # Get all reservations and turned-off days for the worker on the selected date
        reservations = Reservation.objects.filter(datetime_from__date=selected_date, active=True)
        turned_off_days = TurnedOffDay.objects.filter(worker=worker, date=selected_date)

        # Create a list of all possible slots for the day
        available_slots = []
        current_time = datetime.combine(selected_date, starting_hour)
        end_time = datetime.combine(selected_date, ending_hour)

        # Calculate the end time for the last possible starting slot to account for the minimum reservation time
        last_possible_start = end_time - timedelta(minutes=30)  # Adjust for 30-minute reservations

        while current_time <= last_possible_start:  # Include last possible starting time
            next_time = current_time + timedelta(minutes=15)  # Assuming 15-minute slots
            slot_start = current_time.time()
            slot_end = next_time.time()

            # Check if the slot overlaps with any turned-off time or reservations
            is_available = True

            # Check against turned-off days with specific times
            for turned_off_day in turned_off_days:
                turned_off_start = turned_off_day.time_from
                turned_off_end = turned_off_day.time_to

                # If the turned-off day covers the whole day, mark as unavailable
                if turned_off_day.whole_day:
                    is_available = False
                    break

                # If the turned-off period is specified, exclude overlapping slots
                if turned_off_start and turned_off_end:
                    # Calculate slot end time considering the 30-minute duration
                    slot_end = (datetime.combine(selected_date, slot_start) + timedelta(minutes=30)).time()

                    # Check if any part of the slot overlaps with the turned-off period
                    if not (slot_end <= turned_off_start or slot_start >= turned_off_end):
                        is_available = False
                        break

            # Check against reservations
            for reservation in reservations:
                reservation_start_time = (reservation.datetime_from - timedelta(minutes=15)).time()
                # Adding 15-minute break after each reservation
                reservation_end_time = (reservation.datetime_to + timedelta(minutes=15)).time()

                # Check if the entire 30-minute duration is available
                if (slot_start < reservation_end_time and
                        (datetime.combine(selected_date, slot_start) + timedelta(
                            minutes=30)).time() > reservation_start_time):
                    is_available = False
                    break

            if is_available:
                available_slots.append(f"{slot_start.strftime('%H:%M')}")

            current_time = next_time
        return JsonResponse({'status': 'success', 'available_slots': available_slots})
    return JsonResponse({'status': 'error'})

def check_available_slots_ahead(request, worker):
    if request.method == 'GET':
        config.read('config.ini')
        today = datetime.now().date()
        tomorrow = today + timedelta(days=1)
        worker_config = config['settings-roman'] if worker == 'Roman' else config['settings-evka']

        if request.user.is_superuser:
            days_to_check_ahead = 180
        else:
            days_to_check_ahead = int(worker_config['days_ahead'])
        working_days = worker_config['working_days']
        end_date = today + timedelta(days=days_to_check_ahead)

        def intervals_overlap(start1, end1, start2, end2):
            # true if any overlap at all (half-open intervals [start, end))
            return start1 < end2 and start2 < end1

        slot_duration = timedelta(minutes=30)
        start_step = timedelta(minutes=15)   # (NEW) match POST
        buffer = timedelta(minutes=15)       # (NEW) match POST
        events = []

        for single_date in (today + timedelta(n) for n in range((end_date - today).days + 1)):
            if single_date == today or single_date == tomorrow:
                continue
            weekday_name = single_date.strftime('%A')

            if weekday_name not in working_days:
                continue

            starting_hour_str = worker_config.get(f'{weekday_name}_starting_hour')
            ending_hour_str = worker_config.get(f'{weekday_name}_ending_hour')
            if not starting_hour_str or not ending_hour_str:
                continue

            starting_hour = datetime.strptime(starting_hour_str, '%H:%M').time()
            ending_hour = datetime.strptime(ending_hour_str, '%H:%M').time()
            day_start = datetime.combine(single_date, starting_hour)
            day_end = datetime.combine(single_date, ending_hour)

            # 1) Entire day turned off?
            turned_off_day = TurnedOffDay.objects.filter(
                worker=worker, date=single_date, whole_day=True
            ).first()
            if turned_off_day:
                continue

            # 2) Build blocked intervals (as datetimes)
            blocked = []

            # Reservations (active only) — (CHANGED) apply ±15 min buffer and clip to work window
            reservations = Reservation.objects.filter(
                datetime_from__date=single_date, active=True
            )
            for r in reservations:
                b_start = max(day_start, r.datetime_from - buffer)  # (NEW)
                b_end   = min(day_end,   r.datetime_to   + buffer)  # (NEW)
                if b_start < b_end:                                  # (NEW)
                    blocked.append((b_start, b_end))                 # (NEW)

            # Partial turned-off slots (unchanged)
            turned_off_slots = TurnedOffDay.objects.filter(
                worker=worker, date=single_date, whole_day=False
            )
            for off in turned_off_slots:
                off_start = datetime.combine(single_date, off.time_from)
                off_end = datetime.combine(single_date, off.time_to)
                blocked.append((off_start, off_end))

            # Merge (unchanged)
            blocked.sort(key=lambda x: x[0])
            merged = []
            for b_start, b_end in blocked:
                if not merged or b_start > merged[-1][1]:
                    merged.append([b_start, b_end])
                else:
                    merged[-1][1] = max(merged[-1][1], b_end)
            blocked = [(s, e) for s, e in merged]

            # 3) Count only full 30-min slots, starting every 15 minutes (CHANGED)
            available_slots_count = 0
            t = day_start
            last_possible_start = day_end - slot_duration
            while t <= last_possible_start:
                slot_start = t
                slot_end = t + slot_duration

                overlaps = any(
                    intervals_overlap(slot_start, slot_end, b_start, b_end)
                    for (b_start, b_end) in blocked
                )
                if not overlaps:
                    available_slots_count += 1

                t += start_step  # (CHANGED) 15-min step to mirror POST

            # 4) Slovak plurals (unchanged)
            if available_slots_count == 1:
                possible = _('voľný')
            elif 2 <= available_slots_count <= 4:
                possible = _('voľné')
            else:
                possible = _('voľných')

            if available_slots_count > 0:
                events.append({
                    'start': single_date.strftime('%Y-%m-%d'),
                    'end': single_date.strftime('%Y-%m-%d'),
                    'title': f"{available_slots_count} {possible}",
                    'className': 'allowed-events-day'
                })

        return JsonResponse({'status': 'success', 'events': events})
    return JsonResponse({'status': 'error'})

def check_available_durations(request, worker):
    if request.method == 'POST':
        config.read('config.ini')
        json_data = json.loads(request.body)
        selected_date = json_data.get('pickedDateGeneralData')
        selected_date = datetime.strptime(selected_date, '%Y-%m-%d').date()
        time_slot_start_str = json_data.get('timeSlot')  # Time as string (e.g., "15:30")
        time_slot_start = datetime.strptime(time_slot_start_str, '%H:%M').time()  # Convert to time object
        weekday_name = selected_date.strftime('%A')

        worker_config = config['settings-roman'] if worker == 'Roman' else config['settings-evka']
        starting_hour_str = worker_config.get(f'{weekday_name}_starting_hour')
        ending_hour_str = worker_config.get(f'{weekday_name}_ending_hour')

        # Determine work hours
        starting_hour = datetime.strptime(starting_hour_str, '%H:%M').time()
        ending_hour = datetime.strptime(ending_hour_str, '%H:%M').time()

        turned_off_times = TurnedOffDay.objects.filter(worker=worker, date=selected_date)
        reservations = Reservation.objects.filter(datetime_from__date=selected_date, active=True)

        # Define possible duration windows in minutes
        duration_options = [30, 45, 60, 90, 120]
        available_durations = []

        for duration in duration_options:
            end_time = (datetime.combine(selected_date, time_slot_start) + timedelta(minutes=duration)).time()

            # Check if the window is within working hours
            if not (starting_hour <= time_slot_start <= ending_hour and starting_hour <= end_time <= ending_hour):
                continue

            # Check if this duration overlaps with any turned-off times
            overlaps = False
            for off_day in turned_off_times:
                off_start = off_day.time_from
                off_end = off_day.time_to

                if off_day.whole_day or (off_start and off_end and off_start < end_time and time_slot_start < off_end):
                    overlaps = True
                    break

            # Check for overlap with existing reservations, considering a 15-minute buffer
            for reservation in reservations:
                reservation_start = (reservation.datetime_from - timedelta(minutes=15)).time()
                reservation_end = (reservation.datetime_to + timedelta(minutes=15)).time()

                if reservation_start < end_time and time_slot_start < reservation_end:
                    overlaps = True
                    break

            if not overlaps:
                available_durations.append(duration)
            else:
                print(f"Duration {duration} is not available due to overlap.")

        print("Available durations:", available_durations)
        return JsonResponse({'status': 'success', 'available_durations': available_durations})
    return JsonResponse({'status': 'error'})

def deactivate_reservation(request):
    if request.method == 'DELETE':
        json_data = json.loads(request.body)
        try:
            reservation = Reservation.objects.get(id=json_data.get('reservation_id'))
            reservation.active = False
            reservation.status = 'Zrušená zákazníkom'
            reservation.cancellation_reason = json_data.get('reason')
            reservation.save()

            subject = f'Rezervácia zrušená zákazníkom'
            html_message = render_to_string('email_template.html',
                                            {'reservation': prepare_reservation_data(reservation),
                                                'button': None,
                                                'accept_link': None,
                                                'text': f'Dôvod zrušenia: {reservation.cancellation_reason if reservation.cancellation_reason else "Zrušené zákazníkom bez udania dôvodu."}',
                                                })
            send_email(subject, html_message, getattr(settings, 'MAIN_EMAIL'))
            return JsonResponse({'status': 'success', 'message': _('Rezervácia úspešne zrušená.')})
        except Reservation.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': _('Rezervácia sa nenašla.')})
    return JsonResponse({'status': 'error', 'message': _('Zlý request')})

def approve_reservation(request):
    if request.method == 'POST':
        json_data = json.loads(request.body)
        try:
            reservation = Reservation.objects.get(id=json_data.get('id'))
            reservation.active = True
            reservation.status = 'Schválená'
            reservation.save()

            if reservation.email:
                subject = f'Rezervácia potvrdená / Reservation accepted'
                html_message = render_to_string('email_template.html',
                                                {'reservation': prepare_reservation_data(reservation),
                                                 'button': None,
                                                 'accept_link': None,
                                                 'text': 'Rezervácia potvrdená / Reservation accepted',
                                                 })
                send_email(subject, html_message, reservation.email)
            return JsonResponse({'status': 'success'})
        except Reservation.DoesNotExist:
            return JsonResponse({'status': 'error'})
    return JsonResponse({'status': 'error', 'message': _('Zlý request')})

def deactivate_reservation_by_admin(request):
    if request.method == 'DELETE':
        json_data = json.loads(request.body)

        try:
            reservation = Reservation.objects.get(id=json_data.get('id'))
            reservation.active = False
            reservation.status = 'Zrušená Masérom'
            reservation.personal_note = json_data.get('note')
            reservation.save()

            if reservation.email:
                subject = f'Rezervácia zrušená / Reservation cancelled'
                html_message = render_to_string('email_template.html',
                                                {'reservation': prepare_reservation_data(reservation),
                                                 'button': None,
                                                 'accept_link': None,
                                                 'text': f'Poznámka maséra: {json_data.get("note")}' if json_data.get("note") else "",
                                                 })
                send_email(subject, html_message, reservation.email)
            return JsonResponse({'status': 'success'})
        except Reservation.DoesNotExist:
            return JsonResponse({'status': 'error'})
    return JsonResponse({'status': 'error', 'message': _('Zlý request')})

def delete_reservation(request):
    if request.method == 'DELETE':
        json_data = json.loads(request.body)
        try:
            reservation = Reservation.objects.get(id=json_data.get('id'))
            reservation.delete()
            return JsonResponse({'status': 'success'})
        except Reservation.DoesNotExist:
            return JsonResponse({'status': 'error'})
    return JsonResponse({'status': 'error', 'message': _('Zlý request')})

def add_personal_note(request):
    if request.method == 'POST':
        json_data = json.loads(request.body)

        try:
            reservation = Reservation.objects.get(id=json_data.get('id'))
            reservation.personal_note = json_data.get('note')
            reservation.save()
            return JsonResponse({'status': 'success'})

        except Reservation.DoesNotExist:
            return JsonResponse({'status': 'error'})
    return JsonResponse({'status': 'error', 'message': _('Zlý request')})
