import json
from django.http import JsonResponse
import time
import configparser

config = configparser.ConfigParser()
config.read('config.ini')

def save_settings(request):
    if request.method == 'POST':
        json_data = json.loads(request.body)

        days_ahead_roman = json_data.get('days_ahead_roman')
        time_from_roman = json_data.get('time_from_roman')
        time_to_roman = json_data.get('time_to_roman')

        days_ahead_evka = json_data.get('days_ahead_evka')
        time_from_evka = json_data.get('time_from_evka')
        time_to_evka = json_data.get('time_to_evka')

        print(json_data)

        if days_ahead_roman:
            config.set('settings-roman', 'days_ahead', days_ahead_roman)

        if time_from_roman:
            config.set('settings-roman', 'starting_slot_hour', time_from_roman)

        if time_to_roman:
            config.set('settings-roman', 'ending_slot_hour', time_to_roman)

        if days_ahead_evka:
            config.set('settings-evka', 'days_ahead', days_ahead_evka)

        if time_from_evka:
            config.set('settings-evka', 'starting_slot_hour', time_from_evka)

        if time_to_evka:
            config.set('settings-evka', 'ending_slot_hour', time_to_evka)

        with open('config.ini', 'w') as config_file:
            config.write(config_file)

        return JsonResponse({'status': 'success'})
    return JsonResponse({'status': 'error'})