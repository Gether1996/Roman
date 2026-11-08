"""JSON API for the superadmin panel (/sprava/).

All endpoints require a logged-in superuser. Dates are exchanged as ISO
(YYYY-MM-DD / HH:MM); the panel formats them as DD. MM. YYYY. All datetimes are
naive local time (Europe/Bratislava), see PROJECT_RULES.md § 6.
"""
import csv
import json
import logging
import os
import re
from datetime import date, datetime, timedelta
from functools import wraps
from io import BytesIO

from django.core.files.base import ContentFile
from django.core.paginator import EmptyPage, Paginator
from django.db.models import Count, Max, Q
from django.http import HttpResponse, JsonResponse
from django.template.loader import render_to_string

from accounts.models import CustomUser
from Roman.backend_funcs import content as content_store
from Roman.backend_funcs.content_defaults import VALID_DURATIONS, WORKERS
from Roman.backend_funcs.reservation import (
    CANCELLED_STATUSES,
    booking_break,
    build_google_calendar_link,
    build_ics,
    prepare_reservation_data,
    send_email,
    slot_blocking_reservations,
)
from viewer.models import (
    AlreadyMadeReservation,
    GalleryPhoto,
    MediaAsset,
    Reservation,
    Review,
    SiteContentRevision,
    TurnedOffDay,
    VoucherPhoto,
)

logger = logging.getLogger(__name__)

STATUS_PENDING = 'Čaká sa schválenie'
STATUS_APPROVED = 'Schválená'
ALLOWED_IMAGE_EXT = {'.jpg', '.jpeg', '.png', '.webp', '.gif'}
MAX_IMAGE_BYTES = 10 * 1024 * 1024
MAX_IMAGE_SIDE = 2400


# ---------------------------------------------------------------- utilities
def superuser_required(view):
    @wraps(view)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated or not request.user.is_superuser:
            return JsonResponse({'status': 'error', 'message_sk': 'Prístup zamietnutý.', 'message_en': 'Access denied.'}, status=403)
        return view(request, *args, **kwargs)
    return wrapper


def error(message, status=400, **extra):
    return JsonResponse({'status': 'error', 'message': message, 'message_sk': message, **extra}, status=status)


def read_json(request):
    try:
        return json.loads(request.body or b'{}')
    except (json.JSONDecodeError, ValueError):
        return None


def parse_date(value):
    try:
        return datetime.strptime(str(value), '%Y-%m-%d').date()
    except (TypeError, ValueError):
        return None


def is_cancelled(reservation):
    return reservation.status in CANCELLED_STATUSES or (reservation.status or '').startswith('Zrušená')


def status_key(reservation):
    if is_cancelled(reservation):
        return 'cancelled'
    if reservation.active or reservation.status == STATUS_APPROVED:
        return 'approved'
    return 'pending'


def parse_price(value):
    match = re.search(r'\d+(?:[.,]\d+)?', str(value or ''))
    return float(match.group(0).replace(',', '.')) if match else 0.0


def service_price_map():
    prices = {}
    for service in content_store.get_section('services'):
        prices[(service.get('backend_name') or '').strip().lower()] = parse_price(service.get('price'))
    return prices


def serialize_reservation(reservation, prices=None):
    return {
        'id': reservation.id,
        'name_surname': reservation.name_surname,
        'email': reservation.email or '',
        'phone_number': reservation.phone_number or '',
        'massage_name': reservation.massage_name or '',
        'worker': reservation.worker,
        'date': reservation.datetime_from.strftime('%Y-%m-%d'),
        'time_from': reservation.datetime_from.strftime('%H:%M'),
        'time_to': reservation.datetime_to.strftime('%H:%M'),
        'duration': int((reservation.datetime_to - reservation.datetime_from).total_seconds() // 60),
        'start': reservation.datetime_from.strftime('%Y-%m-%dT%H:%M:%S'),
        'end': reservation.datetime_to.strftime('%Y-%m-%dT%H:%M:%S'),
        'status': reservation.status or '',
        'status_key': status_key(reservation),
        'active': reservation.active,
        'special_request': reservation.special_request or '',
        'personal_note': reservation.personal_note or '',
        'cancellation_reason': reservation.cancellation_reason or '',
        'created_at': reservation.created_at.strftime('%Y-%m-%dT%H:%M:%S') if reservation.created_at else '',
        'updated_at': reservation.updated_at.strftime('%Y-%m-%dT%H:%M:%S') if reservation.updated_at else '',
        'consent_at': reservation.consent_at.strftime('%Y-%m-%dT%H:%M:%S') if reservation.consent_at else '',
        'is_past': reservation.datetime_to < datetime.now(),
        'has_account': bool(reservation.user_id),
    }


def media_url(file_field):
    value = str(file_field or '')
    if not value:
        return ''
    if value.startswith('static/'):
        return f'/{value}'
    try:
        return file_field.url
    except ValueError:
        return value if value.startswith('/') else f'/{value}'


def process_image(upload):
    """Validate an uploaded image and downscale very large photos.

    Returns (ContentFile, filename) or raises ValueError with a Slovak message.
    """
    from PIL import Image, ImageOps

    name = os.path.basename(upload.name or 'obrazok.jpg')
    ext = os.path.splitext(name)[1].lower()
    if ext not in ALLOWED_IMAGE_EXT:
        raise ValueError('Povolené sú iba obrázky JPG, PNG, WEBP alebo GIF.')
    if upload.size > MAX_IMAGE_BYTES:
        raise ValueError('Obrázok je príliš veľký (max. 10 MB).')
    raw = upload.read()
    try:
        Image.open(BytesIO(raw)).verify()
        image = Image.open(BytesIO(raw))
    except Exception:
        raise ValueError('Súbor nie je platný obrázok.')

    safe_stem = re.sub(r'[^A-Za-z0-9_-]+', '-', os.path.splitext(name)[0]).strip('-')[:50] or 'obrazok'
    if ext != '.gif' and max(image.size) > MAX_IMAGE_SIDE:
        image = ImageOps.exif_transpose(image)
        image.thumbnail((MAX_IMAGE_SIDE, MAX_IMAGE_SIDE))
        buffer = BytesIO()
        if ext in ('.jpg', '.jpeg'):
            image.convert('RGB').save(buffer, format='JPEG', quality=86, optimize=True)
        elif ext == '.png':
            image.save(buffer, format='PNG', optimize=True)
        else:
            image.save(buffer, format='WEBP', quality=86)
        raw = buffer.getvalue()
    return ContentFile(raw), f'{safe_stem}{ext}'


def admin_email_text(reservation, text):
    return render_to_string('email_template.html', {
        'reservation': prepare_reservation_data(reservation),
        'button': None,
        'accept_link': None,
        'calendar_link': build_google_calendar_link(reservation) if not is_cancelled(reservation) else None,
        'text': text,
    })


# ---------------------------------------------------------------- dashboard
@superuser_required
def dashboard(request):
    now = datetime.now()
    today = now.date()
    tomorrow = today + timedelta(days=1)
    week_start = today - timedelta(days=today.weekday())
    month_start = today.replace(day=1)
    next_month = (month_start + timedelta(days=32)).replace(day=1)
    prices = service_price_map()

    active_qs = Reservation.objects.exclude(status__in=CANCELLED_STATUSES)

    def day_list(day):
        return [serialize_reservation(r, prices) for r in active_qs.filter(datetime_from__date=day).order_by('datetime_from')]

    pending = Reservation.objects.filter(active=False, datetime_to__gte=now).exclude(status__in=CANCELLED_STATUSES).order_by('datetime_from')
    month_qs = active_qs.filter(datetime_from__date__gte=month_start, datetime_from__date__lt=next_month)

    # last 6 months trend
    trend = []
    cursor = month_start
    for _ in range(6):
        nxt = (cursor + timedelta(days=32)).replace(day=1)
        qs = active_qs.filter(datetime_from__date__gte=cursor, datetime_from__date__lt=nxt)
        trend.append({'month': cursor.strftime('%Y-%m'), 'count': qs.count()})
        cursor = (cursor - timedelta(days=1)).replace(day=1)
    trend.reverse()

    upcoming_off = [
        {'id': d.id, 'worker': d.worker, 'date': d.date.strftime('%Y-%m-%d'), 'whole_day': d.whole_day,
         'time_from': d.time_from.strftime('%H:%M') if d.time_from else '', 'time_to': d.time_to.strftime('%H:%M') if d.time_to else ''}
        for d in TurnedOffDay.objects.filter(date__gte=today, date__lte=today + timedelta(days=14)).order_by('date', 'time_from')[:12]
    ]

    reviews = Review.objects.all()
    latest_reviews = [
        {'id': r.id, 'name_surname': r.name_surname, 'worker': r.worker, 'stars': r.stars,
         'message': r.message[:160], 'created_at': r.created_at.strftime('%Y-%m-%dT%H:%M:%S'), 'is_visible': r.is_visible}
        for r in reviews.order_by('-created_at')[:4]
    ]
    stars = [r.stars for r in reviews.filter(is_visible=True)]

    return JsonResponse({
        'now': now.strftime('%Y-%m-%dT%H:%M:%S'),
        'today': day_list(today),
        'tomorrow': day_list(tomorrow),
        'pending': [serialize_reservation(r, prices) for r in pending[:20]],
        'pending_count': pending.count(),
        'stats': {
            'week': active_qs.filter(datetime_from__date__gte=week_start, datetime_from__date__lt=week_start + timedelta(days=7)).count(),
            'month': month_qs.count(),
            'month_cancelled': Reservation.objects.filter(status__in=CANCELLED_STATUSES, datetime_from__date__gte=month_start,
                                                          datetime_from__date__lt=next_month).count(),
            'next7': active_qs.filter(datetime_from__gte=now, datetime_from__date__lte=today + timedelta(days=7)).count(),
            'clients': AlreadyMadeReservation.objects.count(),
            'users': CustomUser.objects.filter(is_superuser=False).count(),
            'reviews': len(stars),
            'reviews_avg': round(sum(stars) / len(stars), 2) if stars else 0,
        },
        'trend': trend,
        'upcoming_off': upcoming_off,
        'latest_reviews': latest_reviews,
    })


# ------------------------------------------------------------- reservations
def _filtered_reservations(params):
    qs = Reservation.objects.all()
    q = (params.get('q') or '').strip()
    if q:
        qs = qs.filter(Q(name_surname__icontains=q) | Q(email__icontains=q) | Q(phone_number__icontains=q.replace(' ', ''))
                       | Q(phone_number__icontains=q) | Q(massage_name__icontains=q) | Q(special_request__icontains=q)
                       | Q(personal_note__icontains=q))
    worker = params.get('worker')
    if worker in WORKERS:
        qs = qs.filter(worker=worker)
    status = params.get('status')
    if status == 'pending':
        qs = qs.filter(active=False).exclude(status__in=CANCELLED_STATUSES)
    elif status == 'approved':
        qs = qs.filter(active=True).exclude(status__in=CANCELLED_STATUSES)
    elif status == 'cancelled':
        qs = qs.filter(status__in=CANCELLED_STATUSES)
    elif status == 'active':
        qs = qs.exclude(status__in=CANCELLED_STATUSES)
    date_from = parse_date(params.get('date_from'))
    date_to = parse_date(params.get('date_to'))
    if date_from:
        qs = qs.filter(datetime_from__date__gte=date_from)
    if date_to:
        qs = qs.filter(datetime_from__date__lte=date_to)
    when = params.get('when')
    now = datetime.now()
    if when == 'upcoming':
        qs = qs.filter(datetime_to__gte=now)
    elif when == 'past':
        qs = qs.filter(datetime_to__lt=now)
    sort = params.get('sort') if params.get('sort') in ('datetime_from', 'created_at', 'name_surname', 'worker') else 'datetime_from'
    order = '-' if params.get('order', 'desc' if when != 'upcoming' else 'asc') == 'desc' else ''
    return qs.order_by(f'{order}{sort}', 'id')


@superuser_required
def reservations(request):
    qs = _filtered_reservations(request.GET)
    try:
        per_page = max(5, min(200, int(request.GET.get('per_page', 25))))
    except ValueError:
        per_page = 25
    paginator = Paginator(qs, per_page)
    try:
        page = paginator.page(int(request.GET.get('page', 1)))
    except (EmptyPage, ValueError):
        page = paginator.page(paginator.num_pages or 1)
    prices = service_price_map()
    counts = Reservation.objects.aggregate(
        pending=Count('id', filter=Q(active=False, datetime_to__gte=datetime.now()) & ~Q(status__in=CANCELLED_STATUSES)),
    )
    return JsonResponse({
        'reservations': [serialize_reservation(r, prices) for r in page.object_list],
        'page': page.number,
        'pages': paginator.num_pages,
        'total': paginator.count,
        'per_page': per_page,
        'pending_count': counts['pending'],
    })


@superuser_required
def reservations_export(request):
    qs = _filtered_reservations(request.GET)
    response = HttpResponse(content_type='text/csv; charset=utf-8')
    response['Content-Disposition'] = f'attachment; filename="rezervacie-{datetime.now().strftime("%Y-%m-%d")}.csv"'
    response.write('﻿')  # Excel-friendly UTF-8 BOM
    writer = csv.writer(response, delimiter=';')
    writer.writerow(['Dátum', 'Od', 'Do', 'Terapeut', 'Klient', 'E-mail', 'Telefón', 'Služba', 'Stav',
                     'Poznámka klienta', 'Interná poznámka', 'Dôvod zrušenia', 'Vytvorené'])
    for r in qs[:5000]:
        writer.writerow([
            r.datetime_from.strftime('%d. %m. %Y'), r.datetime_from.strftime('%H:%M'), r.datetime_to.strftime('%H:%M'),
            r.worker, r.name_surname, r.email or '', r.phone_number or '', r.massage_name or '', r.status or '',
            r.special_request or '', r.personal_note or '', r.cancellation_reason or '',
            r.created_at.strftime('%d. %m. %Y %H:%M') if r.created_at else '',
        ])
    return response


@superuser_required
def reservation_detail(request, reservation_id):
    try:
        reservation = Reservation.objects.get(id=reservation_id)
    except Reservation.DoesNotExist:
        return error('Rezervácia sa nenašla.', 404)
    history = []
    if reservation.email or reservation.phone_number:
        filters = Q()
        if reservation.email:
            filters |= Q(email__iexact=reservation.email)
        if reservation.phone_number:
            filters |= Q(phone_number=reservation.phone_number)
        history = [serialize_reservation(r) for r in Reservation.objects.filter(filters).exclude(id=reservation.id).order_by('-datetime_from')[:15]]
    return JsonResponse({'reservation': serialize_reservation(reservation, service_price_map()), 'history': history})


@superuser_required
def reservation_update(request, reservation_id):
    if request.method != 'POST':
        return error('Nesprávna metóda.', 405)
    data = read_json(request)
    if data is None:
        return error('Neplatné dáta.')
    try:
        reservation = Reservation.objects.get(id=reservation_id)
    except Reservation.DoesNotExist:
        return error('Rezervácia sa nenašla.', 404)

    old_start, old_end, old_worker = reservation.datetime_from, reservation.datetime_to, reservation.worker

    date_value = parse_date(data.get('date')) or reservation.datetime_from.date()
    try:
        time_value = datetime.strptime(data.get('time_from') or reservation.datetime_from.strftime('%H:%M'), '%H:%M').time()
    except ValueError:
        return error('Neplatný čas.')
    try:
        duration = int(data.get('duration') or (reservation.datetime_to - reservation.datetime_from).total_seconds() // 60)
    except (TypeError, ValueError):
        return error('Neplatná dĺžka.')
    if duration < 15 or duration > 300:
        return error('Dĺžka musí byť medzi 15 a 300 minútami.')
    worker = data.get('worker') or reservation.worker
    if worker not in WORKERS:
        return error('Neplatný terapeut.')

    new_start = datetime.combine(date_value, time_value)
    new_end = new_start + timedelta(minutes=duration)

    if not is_cancelled(reservation) and (new_start != old_start or new_end != old_end) and not data.get('force'):
        brk = booking_break()
        conflicts = slot_blocking_reservations(datetime_from__date=date_value).exclude(id=reservation.id).exclude(
            datetime_to__lte=new_start - brk).exclude(datetime_from__gte=new_end + brk)
        if conflicts.exists():
            return error('V tomto čase už je iná rezervácia (vrátane prestávky medzi masážami).', 409,
                         conflicts=[serialize_reservation(r) for r in conflicts[:5]])

    fields = {
        'name_surname': 150, 'email': 254, 'phone_number': 20, 'massage_name': 250,
        'special_request': 200, 'personal_note': 200,
    }
    for field, max_len in fields.items():
        if field in data:
            value = (data.get(field) or '').strip()
            if len(value) > max_len:
                return error(f'Pole je príliš dlhé (max {max_len} znakov).')
            if field == 'name_surname' and not value:
                return error('Meno nesmie byť prázdne.')
            if field == 'email' and value and not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', value):
                return error('Neplatný e-mail.')
            setattr(reservation, field, value or (None if field in ('email', 'phone_number') else ''))

    reservation.datetime_from = new_start
    reservation.datetime_to = new_end
    reservation.worker = worker
    reservation.updated_at = datetime.now()
    reservation.save()

    moved = new_start != old_start or new_end != old_end or worker != old_worker
    mail_sent = False
    if moved and data.get('notify') and reservation.email and not is_cancelled(reservation):
        try:
            send_email('Zmena rezervácie / Reservation changed',
                       admin_email_text(reservation, 'Vaša rezervácia bola zmenená / Your reservation was changed'),
                       reservation.email, ics_content=build_ics(reservation))
            mail_sent = True
        except Exception as exc:  # pragma: no cover - SMTP failures
            logger.error('Reservation change e-mail failed: %s', exc)

    return JsonResponse({'status': 'success', 'reservation': serialize_reservation(reservation, service_price_map()), 'mail_sent': mail_sent})


@superuser_required
def calendar_events(request):
    start = parse_date((request.GET.get('start') or '')[:10]) or (date.today() - timedelta(days=7))
    end = parse_date((request.GET.get('end') or '')[:10]) or (date.today() + timedelta(days=60))
    show_cancelled = request.GET.get('cancelled') == '1'
    qs = Reservation.objects.filter(datetime_from__date__gte=start, datetime_from__date__lte=end)
    if not show_cancelled:
        qs = qs.exclude(status__in=CANCELLED_STATUSES)
    worker = request.GET.get('worker')
    if worker in WORKERS:
        qs = qs.filter(worker=worker)
    colors = {t['key']: t.get('color') or '#0f7e7a' for t in content_store.get_section('therapists')}
    events = []
    for r in qs:
        key = status_key(r)
        color = '#9ca3af' if key == 'cancelled' else ('#d97706' if key == 'pending' else colors.get(r.worker, '#0f7e7a'))
        events.append({
            'id': str(r.id),
            'title': r.name_surname,
            'start': r.datetime_from.strftime('%Y-%m-%dT%H:%M:%S'),
            'end': r.datetime_to.strftime('%Y-%m-%dT%H:%M:%S'),
            'backgroundColor': color,
            'borderColor': color,
            'textColor': '#ffffff',
            'extendedProps': {'type': 'reservation', 'worker': r.worker, 'status_key': key,
                              'massage_name': r.massage_name or '', 'phone': r.phone_number or ''},
        })
    off_qs = TurnedOffDay.objects.filter(date__gte=start, date__lte=end)
    if worker in WORKERS:
        off_qs = off_qs.filter(worker=worker)
    for off in off_qs:
        base = {'display': 'background', 'backgroundColor': '#94a3b8',
                'extendedProps': {'type': 'off', 'worker': off.worker, 'id': off.id}, 'title': f'Voľno – {off.worker}'}
        if off.whole_day or not off.time_from or not off.time_to:
            events.append({**base, 'start': off.date.strftime('%Y-%m-%d'), 'allDay': True})
        else:
            events.append({**base, 'start': f'{off.date:%Y-%m-%d}T{off.time_from:%H:%M}:00', 'end': f'{off.date:%Y-%m-%d}T{off.time_to:%H:%M}:00'})
    return JsonResponse({'events': events})


# ------------------------------------------------------------------ content
@superuser_required
def content_all(request):
    from Roman.backend_funcs.content_defaults import DEFAULT_CONTENT, TECHNIQUE_ICONS
    return JsonResponse({'content': content_store.get_content(), 'defaults': DEFAULT_CONTENT,
                         'icons': TECHNIQUE_ICONS, 'durations': list(VALID_DURATIONS), 'workers': list(WORKERS)})


@superuser_required
def content_save(request, section):
    if request.method != 'POST':
        return error('Nesprávna metóda.', 405)
    data = read_json(request)
    if data is None or 'data' not in data:
        return error('Neplatné dáta.')
    try:
        saved = content_store.save_section(section, data['data'], request.user.email)
    except content_store.ContentError as exc:
        return error(str(exc))
    return JsonResponse({'status': 'success', 'data': saved})


@superuser_required
def content_reset(request, section):
    if request.method != 'POST':
        return error('Nesprávna metóda.', 405)
    try:
        saved = content_store.reset_section(section, request.user.email)
    except content_store.ContentError as exc:
        return error(str(exc))
    return JsonResponse({'status': 'success', 'data': saved})


@superuser_required
def content_revisions(request, section):
    revisions = SiteContentRevision.objects.filter(section=section).order_by('-created_at', '-id')[:30]
    return JsonResponse({'revisions': [
        {'id': r.id, 'created_at': r.created_at.strftime('%Y-%m-%dT%H:%M:%S'), 'created_by': r.created_by} for r in revisions
    ]})


@superuser_required
def content_restore(request, revision_id):
    if request.method != 'POST':
        return error('Nesprávna metóda.', 405)
    try:
        section, saved = content_store.restore_revision(revision_id, request.user.email)
    except SiteContentRevision.DoesNotExist:
        return error('Verzia sa nenašla.', 404)
    except content_store.ContentError as exc:
        return error(str(exc))
    return JsonResponse({'status': 'success', 'section': section, 'data': saved})


@superuser_required
def upload_image(request):
    if request.method != 'POST' or 'file' not in request.FILES:
        return error('Chýba súbor.')
    try:
        file_content, filename = process_image(request.FILES['file'])
    except ValueError as exc:
        return error(str(exc))
    asset = MediaAsset(name=filename)
    asset.file.save(filename, file_content, save=True)
    return JsonResponse({'status': 'success', 'url': media_url(asset.file), 'id': asset.id})


# ---------------------------------------------------- gallery & vouchers
MEDIA_MODELS = {'gallery': GalleryPhoto, 'vouchers': VoucherPhoto}


def _media_item(obj):
    return {'id': obj.id, 'src': media_url(obj.photo), 'caption': obj.caption, 'is_visible': obj.is_visible, 'order': obj.order}


@superuser_required
def media_list(request, kind):
    model = MEDIA_MODELS.get(kind)
    if not model:
        return error('Neznámy typ.', 404)
    return JsonResponse({'items': [_media_item(o) for o in model.objects.all().order_by('order', 'id')]})


@superuser_required
def media_upload(request, kind):
    model = MEDIA_MODELS.get(kind)
    if not model or request.method != 'POST':
        return error('Neplatná požiadavka.')
    files = request.FILES.getlist('files') or request.FILES.getlist('file')
    if not files:
        return error('Chýba súbor.')
    next_order = (model.objects.aggregate(m=Max('order'))['m'] or 0) + 1
    created, errors = [], []
    for upload in files[:30]:
        try:
            file_content, filename = process_image(upload)
        except ValueError as exc:
            errors.append(f'{upload.name}: {exc}')
            continue
        obj = model(order=next_order, caption='')
        obj.photo.save(filename, file_content, save=True)
        next_order += 1
        created.append(_media_item(obj))
    return JsonResponse({'status': 'success' if created else 'error', 'items': created, 'errors': errors,
                         'message': '; '.join(errors)}, status=200 if created else 400)


@superuser_required
def media_item(request, kind, item_id):
    model = MEDIA_MODELS.get(kind)
    if not model:
        return error('Neznámy typ.', 404)
    try:
        obj = model.objects.get(id=item_id)
    except model.DoesNotExist:
        return error('Položka sa nenašla.', 404)
    if request.method == 'DELETE':
        obj.delete()
        return JsonResponse({'status': 'success'})
    if request.method == 'POST':
        data = read_json(request) or {}
        if 'caption' in data:
            obj.caption = str(data.get('caption') or '')[:200]
        if 'is_visible' in data:
            obj.is_visible = bool(data.get('is_visible'))
        obj.save()
        return JsonResponse({'status': 'success', 'item': _media_item(obj)})
    return error('Nesprávna metóda.', 405)


@superuser_required
def media_reorder(request, kind):
    model = MEDIA_MODELS.get(kind)
    data = read_json(request) or {}
    if not model or request.method != 'POST' or not isinstance(data.get('ids'), list):
        return error('Neplatná požiadavka.')
    for index, item_id in enumerate(data['ids']):
        model.objects.filter(id=item_id).update(order=index)
    return JsonResponse({'status': 'success'})


# ------------------------------------------------------------------ reviews
@superuser_required
def reviews(request):
    qs = Review.objects.all().order_by('-created_at')
    worker = request.GET.get('worker')
    if worker in ('roman', 'evka'):
        qs = qs.filter(worker=worker)
    if request.GET.get('visibility') == 'hidden':
        qs = qs.filter(is_visible=False)
    q = (request.GET.get('q') or '').strip()
    if q:
        qs = qs.filter(Q(name_surname__icontains=q) | Q(message__icontains=q))
    return JsonResponse({'reviews': [
        {'id': r.id, 'name_surname': r.name_surname, 'worker': r.worker, 'stars': r.stars, 'message': r.message,
         'created_at': r.created_at.strftime('%Y-%m-%dT%H:%M:%S'), 'is_visible': r.is_visible}
        for r in qs[:500]
    ]})


@superuser_required
def review_item(request, review_id):
    try:
        review = Review.objects.get(id=review_id)
    except Review.DoesNotExist:
        return error('Hodnotenie sa nenašlo.', 404)
    if request.method == 'DELETE':
        review.delete()
        return JsonResponse({'status': 'success'})
    if request.method != 'POST':
        return error('Nesprávna metóda.', 405)
    data = read_json(request) or {}
    if 'is_visible' in data:
        review.is_visible = bool(data['is_visible'])
    if 'name_surname' in data:
        review.name_surname = str(data['name_surname'] or '').strip()[:150] or review.name_surname
    if 'message' in data:
        review.message = str(data['message'] or '').strip()[:1000] or review.message
    if 'stars' in data:
        try:
            review.stars = max(1, min(5, int(data['stars'])))
        except (TypeError, ValueError):
            pass
    review.save()
    return JsonResponse({'status': 'success'})


# ------------------------------------------------------------------ clients
@superuser_required
def clients(request):
    q = (request.GET.get('q') or '').strip()
    people = AlreadyMadeReservation.objects.all().order_by('name_surname')
    if q:
        people = people.filter(Q(name_surname__icontains=q) | Q(email__icontains=q) | Q(phone_number__icontains=q))
    stats = {}
    for row in (Reservation.objects.exclude(status__in=CANCELLED_STATUSES).values('name_surname')
                .annotate(count=Count('id'), last=Max('datetime_from'))):
        stats[row['name_surname']] = row
    result = []
    for person in people[:1000]:
        s = stats.get(person.name_surname, {})
        result.append({'id': person.id, 'name_surname': person.name_surname, 'email': person.email or '',
                       'phone_number': person.phone_number or '', 'count': s.get('count', 0),
                       'last_visit': s['last'].strftime('%Y-%m-%dT%H:%M:%S') if s.get('last') else ''})

    users = CustomUser.objects.filter(is_superuser=False).order_by('-date_joined')
    if q:
        users = users.filter(Q(name__icontains=q) | Q(surname__icontains=q) | Q(email__icontains=q) | Q(phone_number__icontains=q))
    return JsonResponse({
        'clients': result,
        'users': [{'id': u.id, 'name': f'{u.name} {u.surname}'.strip(), 'email': u.email, 'phone_number': u.phone_number or '',
                   'date_joined': u.date_joined.strftime('%Y-%m-%dT%H:%M:%S') if u.date_joined else '',
                   'last_login': u.last_login.strftime('%Y-%m-%dT%H:%M:%S') if u.last_login else '',
                   'is_active': u.is_active} for u in users[:1000]],
    })


@superuser_required
def client_save(request, client_id=None):
    if request.method == 'DELETE' and client_id:
        AlreadyMadeReservation.objects.filter(id=client_id).delete()
        return JsonResponse({'status': 'success'})
    if request.method != 'POST':
        return error('Nesprávna metóda.', 405)
    data = read_json(request) or {}
    name = (data.get('name_surname') or '').strip()[:150]
    email = (data.get('email') or '').strip()[:254]
    phone = (data.get('phone_number') or '').strip()[:20]
    if not name:
        return error('Meno je povinné.')
    if email and not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
        return error('Neplatný e-mail.')
    duplicate = AlreadyMadeReservation.objects.filter(name_surname=name)
    if client_id:
        duplicate = duplicate.exclude(id=client_id)
    if duplicate.exists():
        return error('Klient s týmto menom už existuje.')
    if client_id:
        person = AlreadyMadeReservation.objects.filter(id=client_id).first()
        if not person:
            return error('Klient sa nenašiel.', 404)
    else:
        person = AlreadyMadeReservation()
    person.name_surname, person.email, person.phone_number = name, email or None, phone or None
    person.save()
    return JsonResponse({'status': 'success', 'id': person.id})


@superuser_required
def user_item(request, user_id):
    try:
        user = CustomUser.objects.get(id=user_id, is_superuser=False)
    except CustomUser.DoesNotExist:
        return error('Používateľ sa nenašiel.', 404)
    if request.method == 'DELETE':
        # keep the reservation history – just detach it from the account
        Reservation.objects.filter(user=user).update(user=None)
        user.delete()
        return JsonResponse({'status': 'success'})
    if request.method == 'POST':
        data = read_json(request) or {}
        if 'is_active' in data:
            user.is_active = bool(data['is_active'])
            user.save()
        return JsonResponse({'status': 'success'})
    return error('Nesprávna metóda.', 405)
