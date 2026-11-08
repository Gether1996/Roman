"""Editable website content – storage, validation and helpers.

Content is stored per section in viewer.SiteContent (JSON text) and deep-merged
on top of DEFAULT_CONTENT, see content_defaults.py.
"""
import copy
import json
import re
from datetime import datetime

from django.conf import settings

from Roman.backend_funcs.content_defaults import (
    CONTENT_SECTIONS,
    DEFAULT_CONTENT,
    PRIVATE_KEYS,
    VALID_DURATIONS,
    WORKERS,
)
from viewer.models import SiteContent, SiteContentRevision

MAX_STRING = 30000
MAX_REVISIONS = 30

_HEX_RE = re.compile(r'^#[0-9a-fA-F]{6}$')
_MMDD_RE = re.compile(r'^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$')
_ID_RE = re.compile(r'^[a-z0-9][a-z0-9_-]{0,40}$')
_URL_KEYS = {'maps_url', 'instagram', 'facebook', 'photo', 'photo_small', 'image', 'target', 'button_link'}


class ContentError(ValueError):
    pass


# --------------------------------------------------------------------- merging
def deep_merge(default, saved):
    """Merge `saved` over `default`.

    Dicts are merged key by key (unknown saved keys are dropped, so the schema
    stays under our control). Lists from `saved` replace the default list, but
    each dict item is completed with the keys of the default item template.
    """
    if isinstance(default, dict):
        if not isinstance(saved, dict):
            return copy.deepcopy(default)
        # `texts` is a free-form mapping of label overrides
        result = {}
        for key, default_value in default.items():
            if key in saved:
                result[key] = deep_merge(default_value, saved[key])
            else:
                result[key] = copy.deepcopy(default_value)
        return result
    if isinstance(default, list):
        if not isinstance(saved, list):
            return copy.deepcopy(default)
        template = default[0] if default and isinstance(default[0], dict) else None
        if template is None:
            return copy.deepcopy(saved)
        return [deep_merge(_blank_like(template), item) if isinstance(item, dict) else item for item in saved]
    if isinstance(default, bool):
        return bool(saved) if isinstance(saved, (bool, int)) else default
    if isinstance(default, int) and not isinstance(default, bool):
        try:
            return int(saved)
        except (TypeError, ValueError):
            return default
    if isinstance(default, str):
        return saved if isinstance(saved, str) else ('' if saved is None else str(saved))
    return saved


def _blank_like(template):
    """An 'empty' copy of a template dict (strings emptied, lists cleared)."""
    if isinstance(template, dict):
        return {k: _blank_like(v) for k, v in template.items()}
    if isinstance(template, list):
        return []
    if isinstance(template, bool):
        return template
    if isinstance(template, int):
        return template
    return ''


def _load_saved():
    saved = {}
    for row in SiteContent.objects.all():
        try:
            saved[row.section] = json.loads(row.data or '{}')
        except ValueError:
            continue
    return saved


def get_content():
    saved = _load_saved()
    result = {}
    for section in CONTENT_SECTIONS:
        default = DEFAULT_CONTENT[section]
        if section == 'texts':
            value = saved.get('texts') if isinstance(saved.get('texts'), dict) else {}
            result['texts'] = {
                'sk': {k: v for k, v in (value.get('sk') or {}).items() if isinstance(v, str)},
                'en': {k: v for k, v in (value.get('en') or {}).items() if isinstance(v, str)},
            }
            continue
        result[section] = deep_merge(default, saved[section]) if section in saved else copy.deepcopy(default)
    return result


def get_section(name):
    return get_content()[name]


def public_content():
    content = get_content()
    for section, key in PRIVATE_KEYS:
        content.get(section, {}).pop(key, None)
    return content


# ------------------------------------------------------------------ validation
def _check_url(value, path):
    if not value:
        return ''
    value = value.strip()
    lowered = value.lower()
    if lowered.startswith(('https://', 'http://', '/', '#', 'mailto:', 'tel:')):
        return value
    raise ContentError(f'Neplatný odkaz v poli „{path}“: {value}. Odkaz musí začínať https://, / alebo #.')


def _sanitize(value, path=''):
    if isinstance(value, dict):
        return {str(k)[:80]: _sanitize(v, f'{path}.{k}' if path else str(k)) for k, v in value.items()}
    if isinstance(value, list):
        if len(value) > 200:
            raise ContentError(f'Príliš veľa položiek v „{path}“.')
        return [_sanitize(v, path) for v in value]
    if isinstance(value, str):
        value = value.replace('\r\n', '\n')
        if len(value) > MAX_STRING:
            raise ContentError(f'Text v poli „{path}“ je príliš dlhý.')
        last = path.rsplit('.', 1)[-1]
        if last in _URL_KEYS:
            return _check_url(value, path)
        return value
    if isinstance(value, (bool, int, float)) or value is None:
        return value
    raise ContentError(f'Neplatná hodnota v poli „{path}“.')


def _validate_section(section, data):
    if section == 'texts':
        if not isinstance(data, dict):
            raise ContentError('Neplatné texty.')
        return {
            lang: {str(k)[:120]: str(v)[:2000] for k, v in (data.get(lang) or {}).items() if isinstance(v, str) and v.strip()}
            for lang in ('sk', 'en')
        }

    merged = deep_merge(DEFAULT_CONTENT[section], data)

    if section == 'services':
        seen = set()
        for item in merged:
            if not item.get('id'):
                item['id'] = re.sub(r'[^a-z0-9-]', '-', (item.get('backend_name') or 'sluzba').lower())[:30] or 'sluzba'
            if item['id'] in seen:
                item['id'] = f"{item['id']}-{len(seen)}"
            seen.add(item['id'])
            try:
                item['duration'] = int(item.get('duration'))
            except (TypeError, ValueError):
                raise ContentError('Dĺžka služby musí byť číslo.')
            if item['duration'] not in VALID_DURATIONS:
                raise ContentError(f'Dĺžka služby musí byť jedna z: {", ".join(map(str, VALID_DURATIONS))} min.')
            item['workers'] = [w for w in item.get('workers') or [] if w in WORKERS]
            if not item['workers']:
                raise ContentError(f'Služba „{item["name"]["sk"] or item["backend_name"]}“ musí mať aspoň jedného terapeuta.')
            item['backend_name'] = (item.get('backend_name') or item['name'].get('sk') or '').strip()[:250]
            if not item['backend_name']:
                raise ContentError('Každá služba musí mať názov.')
            if not item['name'].get('sk'):
                item['name']['sk'] = item['backend_name']

    if section == 'therapists':
        keys = [item.get('key') for item in merged]
        if sorted(keys) != sorted(WORKERS):
            raise ContentError('Terapeutov nie je možné pridávať ani odoberať – iba upravovať.')
        for item in merged:
            if item.get('color') and not _HEX_RE.match(item['color']):
                raise ContentError('Farba terapeuta musí byť v tvare #RRGGBB.')
            if not item.get('name'):
                raise ContentError('Meno terapeuta nesmie byť prázdne.')

    if section in ('techniques', 'passes'):
        seen = set()
        for item in merged:
            item['id'] = (item.get('id') or '').strip().lower()
            if not _ID_RE.match(item['id']):
                raise ContentError('Identifikátor môže obsahovať len malé písmená, čísla a pomlčky.')
            if item['id'] in seen:
                raise ContentError(f'Identifikátor „{item["id"]}“ je použitý viackrát.')
            seen.add(item['id'])

    if section == 'promo':
        for campaign in merged.get('campaigns', []):
            for key in ('date_from', 'date_to'):
                if not _MMDD_RE.match(campaign.get(key) or ''):
                    raise ContentError(f'Kampaň „{campaign.get("name")}“ má neplatný dátum (formát DD. MM.).')

    if section == 'general':
        email = (merged.get('notification_email') or '').strip()
        if email and not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
            raise ContentError('Neplatný e-mail pre notifikácie.')
        merged['notification_email'] = email

    return merged


def save_section(section, data, user_email=''):
    if section not in CONTENT_SECTIONS:
        raise ContentError('Neznáma sekcia.')
    clean = _validate_section(section, _sanitize(data, section))

    row, created = SiteContent.objects.get_or_create(section=section)
    if not created and row.data:
        SiteContentRevision.objects.create(section=section, data=row.data, created_by=user_email or '')
        stale = SiteContentRevision.objects.filter(section=section).order_by('-created_at', '-id')[MAX_REVISIONS:]
        SiteContentRevision.objects.filter(id__in=[r.id for r in stale]).delete()
    row.data = json.dumps(clean, ensure_ascii=False)
    row.updated_at = datetime.now()
    row.save()
    return get_content()[section]


def reset_section(section, user_email=''):
    if section not in CONTENT_SECTIONS:
        raise ContentError('Neznáma sekcia.')
    row = SiteContent.objects.filter(section=section).first()
    if row:
        SiteContentRevision.objects.create(section=section, data=row.data, created_by=user_email or '')
        row.delete()
    return get_content()[section]


def restore_revision(revision_id, user_email=''):
    revision = SiteContentRevision.objects.get(id=revision_id)
    return revision.section, save_section(revision.section, json.loads(revision.data or '{}'), user_email)


# --------------------------------------------------------------------- helpers
def notification_email():
    email = (get_section('general').get('notification_email') or '').strip()
    return email or getattr(settings, 'MAIN_EMAIL', '')


def salon_location():
    contact = get_section('contact')
    return ', '.join(part for part in (contact.get('address'), contact.get('city')) if part)


def therapist(worker):
    for item in get_section('therapists'):
        if item.get('key') == worker:
            return item
    return None


def booking_enabled(worker):
    item = therapist(worker)
    return bool(item and item.get('booking_enabled', True))


def find_service(worker, backend_name, duration):
    for service in get_section('services'):
        if (service.get('active') and worker in service.get('workers', [])
                and service.get('backend_name') == backend_name and int(service.get('duration') or 0) == int(duration)):
            return service
    return None
