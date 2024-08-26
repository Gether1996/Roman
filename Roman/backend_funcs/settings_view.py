import json
from django.http import JsonResponse
import configparser
from viewer.models import TurnedOffDay

config = configparser.ConfigParser()
config.read('config.ini')

def save_settings(request):
    if request.method == 'POST':
        json_data = json.loads(request.body)

        days_ahead_roman = json_data.get('days_ahead_roman')
        time_from_roman = json_data.get('time_from_roman')
        time_to_roman = json_data.get('time_to_roman')
        selected_days_roman = json_data.get('selected_days_roman')

        days_ahead_evka = json_data.get('days_ahead_evka')
        time_from_evka = json_data.get('time_from_evka')
        time_to_evka = json_data.get('time_to_evka')
        selected_days_evka = json_data.get('selected_days_evka')

        files_per_page = json_data.get('files_per_page')

        if files_per_page:
            config.set('settings', 'reservations_per_page', files_per_page)

        if days_ahead_roman:
            config.set('settings-roman', 'days_ahead', days_ahead_roman)
        if time_from_roman:
            config.set('settings-roman', 'starting_slot_hour', time_from_roman)
        if time_to_roman:
            config.set('settings-roman', 'ending_slot_hour', time_to_roman)
        if selected_days_roman:
            config.set('settings-roman', 'working_days', str(selected_days_roman))

        if days_ahead_evka:
            config.set('settings-evka', 'days_ahead', days_ahead_evka)
        if time_from_evka:
            config.set('settings-evka', 'starting_slot_hour', time_from_evka)
        if time_to_evka:
            config.set('settings-evka', 'ending_slot_hour', time_to_evka)
        if selected_days_evka:
            config.set('settings-evka', 'working_days', str(selected_days_evka))

        with open('config.ini', 'w') as config_file:
            config.write(config_file)

        return JsonResponse({'status': 'success'})
    return JsonResponse({'status': 'error'})


def add_turned_off_day(request):
    if request.method == 'POST':
        json_data = json.loads(request.body)

        whole_day_bool = bool(json_data.get('whole_day'))

        new_turned_off_day = TurnedOffDay.objects.create(
            worker=json_data.get('worker'),
            date=json_data.get('date'),
            whole_day=whole_day_bool,
            time_from=json_data.get('time_from') if not whole_day_bool else None,
            time_to=json_data.get('time_to') if not whole_day_bool else None
        )

        return JsonResponse({'status': 'success'})
    return JsonResponse({'status': 'error'})


def delete_turned_off_day(request):
    if request.method == 'DELETE':
        json_data = json.loads(request.body)

        try:
            turned_off_day = TurnedOffDay.objects.get(id=json_data.get('turnedOffDayId'))
            turned_off_day.delete()
            return JsonResponse({'status': 'success', 'message': 'Obmedzenie vymazané'})
        except TurnedOffDay.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'Obmedzenie sa nenašlo.'})
    return JsonResponse({'status': 'error'})