"""System settings stored in the database (formerly config.ini).

The data keeps the exact config.ini structure (section → key → value) and is
exposed as a regular `configparser.ConfigParser`, so the booking logic reads it
the same way as before – only the storage changed.

Source of truth:
  1. DB table viewer.ConfigEntry (once it contains anything)
  2. otherwise config.ini at settings.CONFIG_INI_PATH (fallback for a fresh
     deploy before `import_config_ini` ran)
  3. otherwise DEFAULT_CONFIG below (= the original config.ini)
"""
import configparser
import logging
from datetime import datetime
from pathlib import Path

from django.conf import settings
from django.db import transaction

from viewer.models import ConfigEntry

logger = logging.getLogger(__name__)

_DAYS = ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')


def _worker_defaults(days_ahead, working_days, hours):
    data = {'days_ahead': str(days_ahead), 'working_days': str(working_days)}
    for day in _DAYS:
        start, end = hours.get(day, ('09:00', '17:00'))
        data[f'{day}_starting_hour'] = start
        data[f'{day}_ending_hour'] = end
    return data


DEFAULT_CONFIG = {
    'settings-roman': _worker_defaults(30, ['Monday', 'Wednesday', 'Thursday', 'Friday', 'Tuesday'], {
        'monday': ('09:00', '20:00'), 'tuesday': ('09:00', '15:00'), 'wednesday': ('09:00', '20:00'),
        'thursday': ('09:00', '20:00'), 'friday': ('09:00', '20:00'), 'saturday': ('08:30', '17:00'),
        'sunday': ('10:00', '15:00'),
    }),
    'settings-evka': _worker_defaults(45, ['Monday', 'Tuesday', 'Thursday'], {
        'monday': ('15:30', '18:00'), 'tuesday': ('17:00', '19:00'), 'wednesday': ('15:30', '19:00'),
        'thursday': ('15:30', '18:00'), 'friday': ('15:30', '17:30'), 'saturday': ('09:00', '17:00'),
        'sunday': ('10:00', '15:00'),
    }),
    'settings': {'reservations_per_page': '100'},
}


def _read_ini(path):
    parser = configparser.ConfigParser()
    if path and Path(path).is_file():
        parser.read(path, encoding='utf-8')
    return {section: dict(parser.items(section)) for section in parser.sections()}


def _db_dict():
    data = {}
    for entry in ConfigEntry.objects.all():
        data.setdefault(entry.section, {})[entry.key] = entry.value
    return data


def config_dict():
    """Current settings as {section: {key: value}} (missing keys filled from defaults)."""
    data = _db_dict()
    if not data:
        data = _read_ini(getattr(settings, 'CONFIG_INI_PATH', None))
    merged = {section: dict(values) for section, values in DEFAULT_CONFIG.items()}
    for section, values in data.items():
        merged.setdefault(section, {}).update(values)
    return merged


def reload_config(parser):
    """Refill an existing ConfigParser (module-level `config` objects) from the DB."""
    parser.clear()
    parser.read_dict(config_dict())
    return parser


def load_config():
    return reload_config(configparser.ConfigParser())


@transaction.atomic
def save_config(parser):
    """Persist every value of the parser to the DB."""
    now = datetime.now()
    for section in parser.sections():
        for key, value in parser.items(section):
            ConfigEntry.objects.update_or_create(section=section, key=key, defaults={'value': str(value), 'updated_at': now})


def import_ini(path=None, force=False):
    """Copy config.ini into the DB.

    Returns (imported: bool, message). Without `force` it only runs when the DB
    has no settings yet, so redeploying never overwrites what the admin changed
    in the panel.
    """
    path = Path(path or settings.CONFIG_INI_PATH)
    if ConfigEntry.objects.exists() and not force:
        return False, f'Nastavenia už sú v databáze ({ConfigEntry.objects.count()} hodnôt) – import preskočený.'
    data = _read_ini(path)
    if not data:
        if ConfigEntry.objects.exists():
            return False, f'Súbor {path} neexistuje alebo je prázdny – nič sa nezmenilo.'
        data = DEFAULT_CONFIG
        source = 'predvolené hodnoty (config.ini sa nenašiel)'
    else:
        source = str(path)
    parser = configparser.ConfigParser()
    parser.read_dict({section: dict(values) for section, values in DEFAULT_CONFIG.items()})
    parser.read_dict(data)
    with transaction.atomic():
        if force:
            ConfigEntry.objects.all().delete()
        save_config(parser)
    from Roman.backend_funcs.audit import log_change
    log_change(None, 'import', 'schedule', f'Import nastavení rozvrhu z {source} ({ConfigEntry.objects.count()} hodnôt)', object_type='Config')
    return True, f'Importované z: {source} ({ConfigEntry.objects.count()} hodnôt).'
