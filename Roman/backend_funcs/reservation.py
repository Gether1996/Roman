from django.http import JsonResponse
from viewer.models import Reservation, TurnedOffDay
import json
from datetime import datetime, timedelta
from django.utils.translation import gettext_lazy as _
import configparser

config = configparser.ConfigParser()
config.read('config.ini')

def create_reservation(request):
    if request.method == 'POST':
        json_data = json.loads(request.body)

        selected_date = json_data.get('selectedDate')
        time_slot = json_data.get('timeSlot')
        duration = json_data.get('duration')

        datetime_from_obj = datetime.strptime(f"{selected_date} {time_slot}", "%Y-%m-%d %H:%M")
        date_time_to_obj = datetime_from_obj + timedelta(minutes=int(duration))

        user = request.user if request.user else None

        new_reservation = Reservation.objects.create(
            user=user,
            name_surname=json_data.get('nameSurname'),
            email=json_data.get('email'),
            phone_number=json_data.get('phone'),
            worker=json_data.get('worker'),
            status='Čaká sa schválenie',
            special_request=json_data.get('note'),
            datetime_from=datetime_from_obj,
            datetime_to=date_time_to_obj,
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )

        print(json_data)
        return JsonResponse({'status': 'success'})
    return JsonResponse({'status': 'error'})

def check_available_slots(request):
    if request.method == 'POST':
        json_data = json.loads(request.body)

        worker = json_data.get('worker')
        selected_date = json_data['selectedDate']
        selected_date = datetime.strptime(selected_date, '%Y-%m-%d').date()

        worker_config = config['settings-roman'] if worker == 'Roman' else config['settings-evka']

        # Determine work hours
        starting_hour = datetime.strptime(worker_config['starting_slot_hour'], '%H:%M').time()
        ending_hour = datetime.strptime(worker_config['ending_slot_hour'], '%H:%M').time()

        # Get all reservations and turned-off days for the worker on the selected date
        reservations = Reservation.objects.filter(datetime_from__date=selected_date)
        turned_off_days = TurnedOffDay.objects.filter(worker=worker, date=selected_date)

        # Create a list of all possible slots for the day
        available_slots = []
        current_time = datetime.combine(selected_date, starting_hour)
        end_time = datetime.combine(selected_date, ending_hour)

        while current_time < end_time:
            next_time = current_time + timedelta(minutes=30)  # Assuming 30-minute slots
            slot_start = current_time.time()
            slot_end = next_time.time()

            # Check if the slot overlaps with any turned-off time or reservations
            is_available = True

            # Check against turned-off days
            for turned_off_day in turned_off_days:
                if turned_off_day.whole_day or (turned_off_day.time_from <= slot_start <= turned_off_day.time_to):
                    is_available = False
                    break

            # Check against reservations
            for reservation in reservations:
                if reservation.datetime_from.time() < slot_end and reservation.datetime_to.time() > slot_start:
                    is_available = False
                    break

            if is_available:
                available_slots.append(f"{slot_start.strftime('%H:%M')}")

            current_time = next_time
        return JsonResponse({'status': 'success', 'available_slots': available_slots})
    return JsonResponse({'status': 'error'})


def check_available_slots_ahead(request, worker):
    if request.method == 'GET':
        today = datetime.now().date()
        worker_config = config['settings-roman'] if worker == 'Roman' else config['settings-evka']

        days_to_check_ahead = int(worker_config['days_ahead'])
        working_days = worker_config['working_days']
        end_date = today + timedelta(days=days_to_check_ahead)

        starting_hour = datetime.strptime(worker_config['starting_slot_hour'], '%H:%M').time()
        ending_hour = datetime.strptime(worker_config['ending_slot_hour'], '%H:%M').time()
        slot_duration = 30  # Assuming 30 minutes per slot

        events = []

        for single_date in (today + timedelta(n) for n in range((end_date - today).days + 1)):
            # Skip if not a working day
            if single_date.strftime('%A') not in working_days:
                continue

            # Check if the day is turned off for the whole day
            turned_off_day = TurnedOffDay.objects.filter(worker=worker, date=single_date, whole_day=True).first()
            if turned_off_day:
                continue

            # Get all reservations and partial turned-off slots for that day
            reservations = Reservation.objects.filter(datetime_from__date=single_date)
            turned_off_slots = TurnedOffDay.objects.filter(worker=worker, date=single_date, whole_day=False)

            available_slots_count = 0
            current_time = datetime.combine(single_date, starting_hour)

            while current_time.time() < ending_hour:
                next_time = current_time + timedelta(minutes=slot_duration)
                slot_start = current_time.time()
                slot_end = next_time.time()

                # Check if the slot overlaps with any turned-off time
                slot_is_available = True
                for off in turned_off_slots:
                    if off.time_from <= slot_start < off.time_to or off.time_from < slot_end <= off.time_to:
                        slot_is_available = False
                        break

                # Check if the slot overlaps with any reservation
                for reservation in reservations:
                    if reservation.datetime_from.time() < slot_end and reservation.datetime_to.time() > slot_start:
                        slot_is_available = False
                        break

                if slot_is_available:
                    available_slots_count += 1

                current_time = next_time

            if available_slots_count > 0:
                events.append({
                    'start': single_date.strftime('%Y-%m-%d'),
                    'end': single_date.strftime('%Y-%m-%d'),
                    'title': f"{available_slots_count} voľných"
                })

        return JsonResponse({'status': 'success', 'events': events})
    return JsonResponse({'status': 'error'})