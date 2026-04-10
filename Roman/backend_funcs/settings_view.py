import json
from django.conf import settings
from django.http import JsonResponse
import configparser
from viewer.models import TurnedOffDay
from datetime import datetime, timedelta

config = configparser.ConfigParser()


def _require_superuser(request):
    if not request.user.is_authenticated or not request.user.is_superuser:
        return JsonResponse({'status': 'error', 'message_sk': 'Prístup zamietnutý.', 'message_en': 'Access denied.'}, status=403)
    return None


import re as _re

_TIME_RE = _re.compile(r'^([01]\d|2[0-3]):[0-5]\d$')


def _validate_positive_int(value, max_val=None):
    """Return integer if value is a valid positive integer string, else None."""
    try:
        n = int(str(value))
    except (TypeError, ValueError):
        return None
    if n < 1:
        return None
    if max_val is not None and n > max_val:
        return None
    return n


def save_settings(request):
    denied = _require_superuser(request)
    if denied:
        return denied
    if request.method == 'POST':
        config.read(settings.CONFIG_INI_PATH)
        try:
            json_data = json.loads(request.body)
        except (json.JSONDecodeError, ValueError):
            return JsonResponse({'status': 'error', 'message': 'Invalid JSON.'}, status=400)

        days_of_week = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

        days_ahead_roman = json_data.get('days_ahead_roman')
        selected_days_roman = json_data.get('selected_days_roman')

        days_ahead_evka = json_data.get('days_ahead_evka')
        selected_days_evka = json_data.get('selected_days_evka')

        files_per_page = json_data.get('files_per_page')

        if files_per_page is not None:
            validated = _validate_positive_int(files_per_page, max_val=500)
            if validated is None:
                return JsonResponse({'status': 'error', 'message': 'files_per_page must be an integer between 1 and 500.'}, status=400)
            config.set('settings', 'reservations_per_page', str(validated))

        if days_ahead_roman is not None:
            validated = _validate_positive_int(days_ahead_roman, max_val=365)
            if validated is None:
                return JsonResponse({'status': 'error', 'message': 'days_ahead_roman must be an integer between 1 and 365.'}, status=400)
            config.set('settings-roman', 'days_ahead', str(validated))
        if selected_days_roman:
            config.set('settings-roman', 'working_days', str(selected_days_roman))

        for day in days_of_week:
            time_from_key_roman = f'time_from_roman_{day}'
            time_to_key_roman = f'time_to_roman_{day}'
            time_from_key_evka = f'time_from_evka_{day}'
            time_to_key_evka = f'time_to_evka_{day}'
            for key, section, field in [
                (time_from_key_roman, 'settings-roman', f'{day}_starting_hour'),
                (time_to_key_roman, 'settings-roman', f'{day}_ending_hour'),
                (time_from_key_evka, 'settings-evka', f'{day}_starting_hour'),
                (time_to_key_evka, 'settings-evka', f'{day}_ending_hour'),
            ]:
                val = json_data.get(key)
                if val:
                    if not _TIME_RE.match(str(val)):
                        return JsonResponse({'status': 'error', 'message': f'Invalid time format for {key}. Expected HH:MM.'}, status=400)
                    config.set(section, field, val)

        if days_ahead_evka is not None:
            validated = _validate_positive_int(days_ahead_evka, max_val=365)
            if validated is None:
                return JsonResponse({'status': 'error', 'message': 'days_ahead_evka must be an integer between 1 and 365.'}, status=400)
            config.set('settings-evka', 'days_ahead', str(validated))
        if selected_days_evka:
            config.set('settings-evka', 'working_days', str(selected_days_evka))

        with open(settings.CONFIG_INI_PATH, 'w', encoding='utf-8') as config_file:
            config.write(config_file)

        return JsonResponse({'status': 'success'})
    return JsonResponse({'status': 'error'})


def add_turned_off_day(request):
    denied = _require_superuser(request)
    if denied:
        return denied
    if request.method == 'POST':
        config.read(settings.CONFIG_INI_PATH)
        try:
            json_data = json.loads(request.body)
        except (ValueError, KeyError):
            return JsonResponse({'status': 'error', 'message': 'Invalid JSON.'}, status=400)

        worker = json_data.get('worker')
        date_from_str = json_data.get('date_from')
        date_to_str = json_data.get('date_to')

        if worker not in ('Roman', 'Evka'):
            return JsonResponse({'status': 'error', 'message': 'Invalid worker.'}, status=400)
        if not date_from_str or not date_to_str:
            return JsonResponse({'status': 'error', 'message': 'date_from and date_to are required.'}, status=400)

        try:
            date_from = datetime.strptime(date_from_str, '%Y-%m-%d').date()
            date_to = datetime.strptime(date_to_str, '%Y-%m-%d').date()
        except ValueError:
            return JsonResponse({'status': 'error', 'message': 'Invalid date format. Use YYYY-MM-DD.'}, status=400)

        if date_to < date_from:
            return JsonResponse({'status': 'error', 'message': 'date_to must not be before date_from.'}, status=400)

        whole_day_bool = bool(json_data.get('whole_day'))
        time_from = json_data.get('time_from') if not whole_day_bool else None
        time_to = json_data.get('time_to') if not whole_day_bool else None

        # Iterate through the date range
        current_date = date_from
        while current_date <= date_to:
            TurnedOffDay.objects.create(
                worker=worker,
                date=current_date,
                whole_day=whole_day_bool,
                time_from=time_from,
                time_to=time_to
            )
            current_date += timedelta(days=1)

        return JsonResponse({'status': 'success'})
    return JsonResponse({'status': 'error'})


def delete_turned_off_day(request):
    denied = _require_superuser(request)
    if denied:
        return denied
    if request.method == 'DELETE':
        json_data = json.loads(request.body)

        try:
            turned_off_day = TurnedOffDay.objects.get(id=json_data.get('turnedOffDayId'))
            turned_off_day.delete()
            return JsonResponse({'status': 'success', 'message': 'Obmedzenie vymazané'})
        except TurnedOffDay.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'Obmedzenie sa nenašlo.'})
    return JsonResponse({'status': 'error'})


def delete_turned_off_days(request):
    denied = _require_superuser(request)
    if denied:
        return denied
    if request.method == 'DELETE':
        json_data = json.loads(request.body)

        for day_id in json_data.get('ids'):
            try:
                turned_off_day = TurnedOffDay.objects.get(id=day_id)
                turned_off_day.delete()
            except TurnedOffDay.DoesNotExist:
                return JsonResponse({'status': 'error', 'message': 'Obmedzenie sa nenašlo.'})
        return JsonResponse({'status': 'success', 'message': 'Obmedzenia vymazané'})
    return JsonResponse({'status': 'error'})
