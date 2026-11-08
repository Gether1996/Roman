"""Audit log – full history of changes shown in the admin panel (História zmien).

Usage:
    from Roman.backend_funcs.audit import log_change, reservation_snapshot, diff_dicts
    log_change(request, 'update', 'reservation', 'Upravená rezervácia …', obj=reservation, changes=[...])

Logging must never break the actual request, so every error is swallowed.
"""
import json
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

RETENTION_DAYS = 730          # keep 2 years of history
MAX_CHANGES = 80
MAX_VALUE = 400

AREA_LABELS = {
    'reservation': 'Rezervácie',
    'content': 'Obsah webu',
    'schedule': 'Rozvrh',
    'days_off': 'Voľno',
    'media': 'Galéria a poukážky',
    'review': 'Hodnotenia',
    'client': 'Klienti',
    'account': 'Účty',
    'settings': 'Nastavenia',
    'system': 'Systém',
}

SECTION_LABELS = {
    'general': 'Nastavenia webu', 'hero': 'Úvodná stránka – nadpis', 'promo': 'Banner a akcie',
    'sections': 'Úvodná stránka – sekcie', 'contact': 'Kontakt a firma', 'therapists': 'Terapeuti',
    'techniques': 'Techniky', 'services': 'Služby a cenník', 'passes': 'Permanentky',
    'booking': 'Rezervačný formulár', 'legal': 'Podmienky a GDPR', 'texts': 'Texty a preklady',
}

RESERVATION_FIELDS = {
    'name_surname': 'Meno', 'email': 'E-mail', 'phone_number': 'Telefón', 'massage_name': 'Služba',
    'worker': 'Terapeut', 'date': 'Dátum', 'time': 'Čas', 'status': 'Stav',
    'special_request': 'Poznámka klienta', 'personal_note': 'Interná poznámka',
    'cancellation_reason': 'Dôvod zrušenia',
}

CONFIG_LABELS = {
    'days_ahead': 'Dni dopredu', 'working_days': 'Pracovné dni', 'reservations_per_page': 'Rezervácií na stránku',
    'break_minutes': 'Prestávka medzi rezerváciami (min)', 'public_lead_days': 'Online zatvorené dni dopredu',
    'admin_days_ahead': 'Admin vidí dní dopredu',
}
DAY_SK = {
    'monday': 'Pondelok', 'tuesday': 'Utorok', 'wednesday': 'Streda', 'thursday': 'Štvrtok',
    'friday': 'Piatok', 'saturday': 'Sobota', 'sunday': 'Nedeľa',
}


def _short(value):
    if value is None:
        return ''
    if not isinstance(value, str):
        value = json.dumps(value, ensure_ascii=False)
    return value if len(value) <= MAX_VALUE else value[:MAX_VALUE] + '…'


def change(field, label, old, new):
    return {'field': field, 'label': label, 'old': _short(old), 'new': _short(new)}


def actor_of(request, fallback_name=''):
    user = getattr(request, 'user', None) if request is not None else None
    if user is not None and user.is_authenticated:
        name = f"{getattr(user, 'name', '') or ''} {getattr(user, 'surname', '') or ''}".strip()
        label = f'{name} ({user.email})' if name else user.email
        return user, label[:200], ('admin' if user.is_superuser else 'client')
    if request is None:
        return None, 'Systém', 'system'
    return None, (fallback_name or 'Návštevník webu')[:200], 'visitor'


def log_change(request, action, area, summary, obj=None, object_type='', object_id='', changes=None, actor_name=''):
    """Store one history entry. Never raises."""
    try:
        from viewer.models import AuditLog
        user, actor, actor_type = actor_of(request, actor_name)
        if obj is not None:
            object_type = object_type or obj.__class__.__name__
            object_id = object_id or str(getattr(obj, 'pk', '') or '')
        AuditLog.objects.create(
            user=user, actor=actor, actor_type=actor_type, action=action[:30], area=area[:30],
            object_type=object_type[:50], object_id=str(object_id)[:50], summary=summary[:500],
            changes=json.dumps((changes or [])[:MAX_CHANGES], ensure_ascii=False) if changes else '',
        )
        # light housekeeping: drop entries older than the retention period
        if datetime.now().minute == 0:
            AuditLog.objects.filter(created_at__lt=datetime.now() - timedelta(days=RETENTION_DAYS)).delete()
    except Exception as exc:  # pragma: no cover - logging must never break a request
        logger.error('Audit log failed: %s', exc)


# ------------------------------------------------------------------ helpers
def reservation_snapshot(reservation):
    return {
        'name_surname': reservation.name_surname or '',
        'email': reservation.email or '',
        'phone_number': reservation.phone_number or '',
        'massage_name': reservation.massage_name or '',
        'worker': reservation.worker or '',
        'date': reservation.datetime_from.strftime('%d. %m. %Y') if reservation.datetime_from else '',
        'time': (f"{reservation.datetime_from:%H:%M} – {reservation.datetime_to:%H:%M}"
                 if reservation.datetime_from and reservation.datetime_to else ''),
        'status': reservation.status or '',
        'special_request': reservation.special_request or '',
        'personal_note': reservation.personal_note or '',
        'cancellation_reason': reservation.cancellation_reason or '',
    }


def reservation_label(reservation):
    when = reservation.datetime_from.strftime('%d. %m. %Y %H:%M') if reservation.datetime_from else ''
    return f'{reservation.name_surname}, {when} ({reservation.worker})'


def diff_snapshots(before, after, labels):
    return [change(key, labels.get(key, key), before.get(key), after.get(key))
            for key in after if before.get(key) != after.get(key)]


def _flatten(value, prefix=''):
    """{'a': {'b': 1}, 'l': [..]} → {'a.b': 1, 'l[0]…': …}"""
    out = {}
    if isinstance(value, dict):
        for key, item in value.items():
            out.update(_flatten(item, f'{prefix}.{key}' if prefix else str(key)))
    elif isinstance(value, list):
        if all(not isinstance(item, (dict, list)) for item in value):
            out[prefix] = ', '.join(str(item) for item in value)
        else:
            for index, item in enumerate(value):
                label = ''
                if isinstance(item, dict):
                    label = item.get('id') or item.get('key') or item.get('backend_name') or ''
                out.update(_flatten(item, f'{prefix}[{label or index + 1}]'))
    else:
        out[prefix] = value
    return out


FIELD_WORDS = {
    'title': 'Nadpis', 'subtitle': 'Podnadpis', 'text': 'Text', 'button': 'Tlačidlo', 'button_link': 'Odkaz tlačidla',
    'kicker': 'Nadtitulok', 'cta_primary': 'Hlavné tlačidlo', 'cta_secondary': 'Druhé tlačidlo', 'note': 'Poznámka',
    'price': 'Cena', 'name': 'Názov', 'backend_name': 'Názov v rezervácii', 'duration': 'Dĺžka (min)', 'workers': 'Terapeuti',
    'active': 'Aktívna', 'enabled': 'Zapnuté', 'visible': 'Zobrazené', 'body': 'Text', 'short': 'Krátky popis',
    'icon': 'Ikona', 'image': 'Obrázok', 'photo': 'Fotka', 'photo_small': 'Malá fotka', 'style': 'Vzhľad',
    'target': 'Cieľ tlačidla', 'date_from': 'Od', 'date_to': 'Do', 'campaigns': 'Akcie', 'rows': 'Riadky', 'notes': 'Poznámky',
    'label': 'Popis', 'number': 'Číslo', 'phones': 'Telefóny', 'address': 'Adresa', 'city': 'Mesto', 'email': 'E-mail',
    'maps_url': 'Odkaz na mapu', 'instagram': 'Instagram', 'facebook': 'Facebook', 'company_name': 'Názov firmy',
    'company_address': 'Sídlo firmy', 'company_ico': 'IČO', 'company_dic': 'DIČ', 'company_register': 'Zápis v registri',
    'bio': 'Popis', 'techniques': 'Techniky', 'color': 'Farba', 'booking_enabled': 'Online rezervácie',
    'booking_note': 'Poznámka pri rezervácii', 'pass_id': 'Informačné okno', 'show_on_home': 'Na úvodnej stránke',
    'download_label': 'Text tlačidla stiahnuť', 'allow_new': 'Povoliť nové hodnotenia', 'updated': 'Platné od',
    'require_consent': 'Vyžadovať súhlas', 'success_message': 'Správa po odoslaní', 'notice': 'Oznam',
    'site_name': 'Názov webu', 'notification_email': 'E-mail pre notifikácie', 'footer_text': 'Text v pätičke',
    'seo_title': 'Titulok pre Google', 'seo_description': 'Popis pre Google', 'maintenance_notice': 'Oznam na webe',
    'therapists': 'Terapeuti', 'pricing': 'Cenník', 'gallery': 'Galéria', 'vouchers': 'Poukážky', 'reviews': 'Hodnotenia',
    'business': 'Pre firmy', 'contact': 'Kontakt', 'terms': 'Obchodné podmienky', 'privacy': 'Ochrana údajov',
    'cookies': 'Cookies', 'cookie_banner': 'Cookie lišta', 'id': 'Identifikátor', 'key': 'Kľúč',
}


def humanize_path(path):
    """'sections.reviews.title.sk' → 'Hodnotenia › Nadpis (SK)'"""
    parts = [p for p in path.replace('[', '.[').split('.') if p]
    lang = ''
    if parts and parts[-1] in ('sk', 'en'):
        lang = f' ({parts.pop().upper()})'
    words = []
    for part in parts:
        if part.startswith('[') and part.endswith(']'):
            words.append(part[1:-1])
        else:
            words.append(FIELD_WORDS.get(part, part))
    return (' › '.join(words) or path) + lang


def diff_dicts(before, after):
    """Field-level diff of two JSON-like structures (content sections)."""
    old, new = _flatten(before or {}), _flatten(after or {})
    result = []
    for key in list(old.keys()) + [k for k in new.keys() if k not in old]:
        if old.get(key) != new.get(key):
            result.append(change(key, humanize_path(key), old.get(key, ''), new.get(key, '')))
    return result


def config_label(section, key):
    who = {'settings-roman': 'Roman', 'settings-evka': 'Evka', 'settings': 'Pravidlá'}.get(section, section)
    if key.endswith('_starting_hour') or key.endswith('_ending_hour'):
        day = DAY_SK.get(key.split('_')[0], key)
        return f"{who}: {day} {'od' if 'starting' in key else 'do'}"
    return f'{who}: {CONFIG_LABELS.get(key, key)}'
