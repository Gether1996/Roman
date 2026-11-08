import json
from django.conf import settings
from django.http import JsonResponse
import configparser
from viewer.models import TurnedOffDay
from Roman.backend_funcs.system_config import reload_config, save_config
from Roman.backend_funcs.audit import change, diff_dicts, diff_snapshots, log_change, reservation_label, reservation_snapshot, RESERVATION_FIELDS, SECTION_LABELS, config_label
from datetime import datetime, timedelta

config = configparser.ConfigParser()


def _require_superuser(request):
    if not request.user.is_authenticated or not request.user.is_superuser:
        return JsonResponse({'status': 'error', 'message_sk': 'Prístup zamietnutý.', 'message_en': 'Access denied.'}, status=403)
    return None


import re as _re

_TIME_RE = _re.compile(r'^([01]\d|2[0-3]):[0-5]\d$')
VALID_DAY_LABELS = ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')


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
        reload_config(config)
        before = {s: dict(config.items(s)) for s in config.sections()}
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

        for key, minimum, maximum in (('break_minutes', 0, 120), ('public_lead_days', 0, 30), ('admin_days_ahead', 7, 730)):
            if json_data.get(key) is not None:
                try:
                    value = int(json_data.get(key))
                except (TypeError, ValueError):
                    value = None
                if value is None or value < minimum or value > maximum:
                    return JsonResponse({'status': 'error', 'message': f'{key} must be between {minimum} and {maximum}.',
                                         'message_sk': f'Hodnota musí byť medzi {minimum} a {maximum}.'}, status=400)
                if 'settings' not in config:
                    config.add_section('settings')
                config.set('settings', key, str(value))

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
        if selected_days_roman is not None and isinstance(selected_days_roman, list):
            config.set('settings-roman', 'working_days', str([d for d in selected_days_roman if d in VALID_DAY_LABELS]))

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
        if selected_days_evka is not None and isinstance(selected_days_evka, list):
            config.set('settings-evka', 'working_days', str([d for d in selected_days_evka if d in VALID_DAY_LABELS]))

        # Settings live in the database now (formerly config.ini, which was lost on container rebuilds).
        save_config(config)
        after = {s: dict(config.items(s)) for s in config.sections()}
        diffs = [change(f'{s}.{k}', config_label(s, k), before.get(s, {}).get(k, ''), v)
                 for s, values in after.items() for k, v in values.items() if before.get(s, {}).get(k) != v]
        if diffs:
            area = 'settings' if all(d['field'].startswith('settings.') for d in diffs) else 'schedule'
            who = sorted({d['label'].split(':')[0] for d in diffs})
            log_change(request, 'update', area, ('Zmenené rezervačné pravidlá' if area == 'settings' else 'Zmenený rozvrh – ' + ', '.join(who)),
                       object_type='Config', changes=diffs)

        return JsonResponse({'status': 'success'})
    return JsonResponse({'status': 'error'})


def add_turned_off_day(request):
    denied = _require_superuser(request)
    if denied:
        return denied
    if request.method == 'POST':
        reload_config(config)
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

        if not whole_day_bool:
            if not time_from or not time_to:
                return JsonResponse({'status': 'error', 'message': 'time_from and time_to are required for a partial restriction.'}, status=400)
            if not _TIME_RE.match(str(time_from)) or not _TIME_RE.match(str(time_to)):
                return JsonResponse({'status': 'error', 'message': 'Invalid time format. Expected HH:MM.'}, status=400)
            if time_to <= time_from:
                return JsonResponse({'status': 'error', 'message': 'time_to must be after time_from.'}, status=400)

        log_change(request, 'create', 'days_off',
                   f"Pridané voľno – {worker}: {date_from:%d. %m. %Y}" + (f" – {date_to:%d. %m. %Y}" if date_to != date_from else '')
                   + (' (celý deň)' if whole_day_bool else f' ({time_from} – {time_to})'), object_type='TurnedOffDay')
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
            log_change(request, 'delete', 'days_off', f'Odstránené voľno – {turned_off_day.worker}: {turned_off_day.date:%d. %m. %Y}'
                       + ('' if turned_off_day.whole_day else f' ({turned_off_day.formatted_time_range()})'), obj=turned_off_day)
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
                log_change(request, 'delete', 'days_off', f'Odstránené voľno – {turned_off_day.worker}: {turned_off_day.date:%d. %m. %Y}'
                           + ('' if turned_off_day.whole_day else f' ({turned_off_day.formatted_time_range()})'), obj=turned_off_day)
                turned_off_day.delete()
            except TurnedOffDay.DoesNotExist:
                return JsonResponse({'status': 'error', 'message': 'Obmedzenie sa nenašlo.'})
        return JsonResponse({'status': 'success', 'message': 'Obmedzenia vymazané'})
    return JsonResponse({'status': 'error'})
