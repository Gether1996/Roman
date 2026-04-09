# PROJECT RULES — Masáže Vlčince

## 1. What This Project Is

A **massage booking web application** for a massage salon called "Masáže Vlčince" (masazevlcince.sk). It serves two masseurs — **Roman** and **Evka** — and allows clients to browse services, book appointments, leave reviews, and manage their profile. Admins manage reservations, schedules, and availability through a protected admin UI.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Backend | Django 4.2, Python 3.10 |
| Database | MySQL (via `mysql-connector-django`), hosted at `mail.314.sk` |
| Frontend | Django templates, Bootstrap 5, jQuery 3.6, FullCalendar 6.1.9, SweetAlert2 |
| Static files | WhiteNoise (`CompressedManifestStaticFilesStorage`) |
| Email | SMTP via `mail.314.sk`, port 587 (TLS) |
| Deployment | Docker + Docker Compose, Nginx in front (port 9000 → 8000) |
| i18n | Django `gettext`, `.po`/`.mo` files in `locale/en/LC_MESSAGES/` |
| Config | `config.ini` (runtime worker schedule config, NOT in settings.py) |

---

## 3. Project Structure

```
Roman/                   ← Django project package (settings, urls, wsgi, asgi)
  backend_funcs/         ← All API logic split by concern:
    general.py           ← Language switching, reviews (add/delete)
    reservation.py       ← Slot checking, booking, approval, cancellation
    settings_view.py     ← Admin schedule config, turned-off days
    users.py             ← Login, logout, registration, delete saved person
viewer/                  ← Main app: models, views (page renders), templates, context processors
accounts/                ← Custom user model
locale/en/               ← English translations (.po/.mo)
static/                  ← CSS, JS, FontAwesome, images
```

**Views** (page rendering) live in `viewer/views.py`.  
**API endpoints** (JSON) live in `Roman/backend_funcs/`.  
**URL routing** is all in `Roman/urls.py` — there is only one urls.py for the whole project.

---

## 4. Apps

### `viewer` — core app
- Contains all models, page views, templates, context processors.
- Template directory: `viewer/templates/` (registered via `APP_DIRS = True`).
- Custom template tag: `viewer/templatetags/language_switch.py` — provides `switch_language_url`.

### `accounts` — authentication app
- Custom user model: `accounts.CustomUser` (extends `AbstractUser`).
- Login field is **email** (not username). Username field exists but is not unique.
- `AUTH_USER_MODEL = 'accounts.CustomUser'`
- Fields: `email` (unique), `name`, `surname`, `phone_number`, `username` (not unique).

---

## 5. Models

### `Reservation`
The core model. Key fields:
- `massage_name` — type of massage (e.g., "Klasická masáž")
- `user` — FK to CustomUser (nullable; guest bookings allowed)
- `name_surname`, `email`, `phone_number` — contact info
- `datetime_from`, `datetime_to` — naive datetimes (**NO timezone**)
- `active` — `True` = confirmed/approved; `False` = cancelled
- `worker` — `"Roman"` or `"Evka"` (exact casing)
- `status` — text: `"Čaká sa schválenie"`, `"Schválená"`, `"Zrušená zákazníkom"`, etc.
- `created_at`, `updated_at` — naive datetimes set via `datetime.now()`
- `special_request` — note from client
- `personal_note` — internal admin note
- `cancellation_reason`

Color coding: `get_color()` — cancelled = `#8B0000`; Evka = `#ff1493`; Roman = `#007bff`.

### `TurnedOffDay`
Represents a day or time range when a worker is unavailable.
- `worker`, `date`, `whole_day` (bool), `time_from`, `time_to`
- Can be a partial block (specific hours) or full-day block.
- Range creation: admin passes `date_from`/`date_to` → a row per day is created.

### `AlreadyMadeReservation`
Stores past client contact details for autocomplete on the reservations page.
- `name_surname` (unique), `email`, `phone_number`
- Auto-created/updated on each booking via `update_or_create`.

### `Review`
Client reviews per worker.
- `name_surname`, `worker` (stored lowercase: `"roman"` / `"evka"`), `message`, `stars` (1–5 int), `created_at`

### `GalleryPhoto` / `VoucherPhoto`
Photos stored via `ImageField(upload_to='static/images/')`.

---

## 6. No Timezone — Critical Rule

```python
USE_TZ = False
TIME_ZONE = 'UTC'
```

**All datetimes are naive.** Never use `timezone.now()` — always use `datetime.now()`. Never introduce `aware` datetimes. All `DateTimeField` comparisons, slot checking, and reservation creation use naive `datetime` objects.

---

## 7. Internationalization (i18n) — SK / EN

- **Default language: Slovak (`sk`)**.
- **English** is the only additional language.
- Language is stored in the session: `request.session['django_language']`.
- Language activation: `from django.utils.translation import activate; activate(language_code)`.
- Every view that renders a page calls `activate(language_code)` from the session before rendering.
- Translations are in `locale/en/LC_MESSAGES/django.po` (compile with `makemessages` / `compilemessages`).
- Templates use `{% load i18n %}` and `{% trans '...' %}` / `{% blocktrans %}`.
- The `language_code` context variable is injected by `viewer/context_processors.py` into every template.
- JavaScript receives `language_code` and `isEnglish` via inline `<script>` in `base.html`.
- API responses that include messages must provide **both** `message_sk` and `message_en` keys so JS can display the correct language.
- The language switch endpoint is `POST /switch_language/<language_code>/`.

**Rule:** Every user-facing string must be wrapped in `{% trans %}` in templates and `_()` / `gettext_lazy` in Python code.

---

## 8. Authentication & Roles

- Login is by **email + password** (not username).
- Login endpoint: `POST /login_api/` → JSON response.
- Logout: `GET /logout/` → redirects to homepage.
- `LOGIN_URL = '/admin/login/'` (Django default admin login).
- Two roles:
  - **Regular user** — can view their profile and cancel their own reservations.
  - **Superuser (admin)** — can access `settings_view`, `all_reservations`, `calendar_view_admin`; can create reservations directly (auto-approved); can approve/reject/delete reservations; can manage turned-off days and schedule.
- Pages that require auth check `request.user.is_authenticated` then `request.user.is_superuser`, rendering `error.html` with a translated message on failure.

---

## 9. Reservation Workflow

### Guest/User booking flow:
1. User picks worker (Roman or Evka) on the reservation page.
2. FullCalendar shows available dates via `GET /check_available_slots_ahead/<worker>/`.
3. User picks a date → available 15-minute-increment start slots fetched via `POST /check_available_slots/`.
4. User picks a time slot → available durations (30/45/60/90/120 min) fetched via `POST /check_available_durations/<worker>/`.
5. User fills in name, email, phone, massage type, optional note.
6. `POST /create_reservation/` creates the reservation with `active=False`, `status="Čaká sa schválenie"`.
7. Email notification is sent to the salon (`MAIN_EMAIL = 'salonaminask@gmail.com'`) with an approve link.

### Admin booking flow:
1. Admin fills the same form. Reservation is created with `active=True`, `status="Schválená"`.
2. Confirmation email is sent directly to the client.

### Approval:
- Via email link: `GET /approve_reservation_mail/<id>/` (no auth required — link-based).
- Via admin UI: `POST /approve_reservation/` (superuser only).
- On approval: `active=True`, `status="Schválená"`, confirmation email sent to client.

### Cancellation:
- Client cancels: `DELETE /deactivate_reservation/` — `active=False`, `status="Zrušená zákazníkom"`, notification email to salon.
- Admin cancels: `DELETE /deactivate_reservation_by_admin/` — includes cancellation reason, email to client.
- Admin deletes entirely: `DELETE /delete_reservation/`.

### Slot logic:
- Time slots are in 15-minute increments.
- Minimum reservation: 30 minutes.
- A 15-minute buffer is enforced before and after each existing reservation.
- Available slots are filtered by: worker schedule (from `config.ini`), `TurnedOffDay` entries, and existing active reservations.
- Admin sees 180 days ahead; regular users see only `days_ahead` from config.

---

## 10. Schedule Configuration (`config.ini`)

Worker schedules are **not** stored in the database. They live in `config.ini` at the project root (read at request time via `configparser`).

Config sections:
- `[settings]` — `reservations_per_page`
- `[settings-roman]` — `days_ahead`, `working_days`, `monday_starting_hour` … `sunday_ending_hour`
- `[settings-evka]` — same structure

Working days stored as a string list, e.g. `['Monday', 'Tuesday', 'Friday']`.  
Hours stored as `HH:MM` strings.

**Rule:** Never hardcode schedule times. Always read from `config.ini`. The admin can change them via `POST /save_settings/`.

---

## 11. Email System

- SMTP via `mail.314.sk:587` (TLS), sender: `masazevlcince@masazevlcince.sk`.
- HTML emails rendered from `viewer/templates/email_template.html`.
- All emails use bilingual labels (SK/EN side-by-side in the template).
- Email sending never fails silently on reservation creation — errors are caught and logged, but the reservation is still created.
- Emails sent in these situations:
  - **New user reservation** → to salon admin.
  - **Admin creates reservation** → to client (if email provided).
  - **Reservation approved** → to client.
  - **Admin cancels** → to client (with reason).
  - **Client cancels** → to salon admin.

---

## 12. Frontend Rules

- **Bootstrap 5** for layout and components.
- **jQuery 3.6** for DOM manipulation and AJAX.
- **SweetAlert2** for all user-facing alerts, confirmations, and notifications.
- **FullCalendar 6.1.9** for the reservation calendar and admin calendar view.
- **FontAwesome** (self-hosted) for icons.
- All API calls from JS use `fetch()` or jQuery AJAX with CSRF token (`csrfToken` injected via `base.html`).
- JS files are in `static/scripts/`. Each page has its own JS file (e.g., `reservation.js`, `homepage.js`, `users.js`).
- `scripts.js` contains shared utilities (including `switchLanguage()`).
- Language switching in JS: JS reads `isEnglish` (bool) injected from `base.html` and uses it to pick between `message_sk` and `message_en` from API responses.
- Dates formatted as `DD.MM.YYYY` in the UI. API sends/receives dates as `YYYY-MM-DD`.
- Time formatted as `HH:MM` throughout.

---

## 13. API Design Conventions

- All API endpoints return `JsonResponse`.
- Standard success response: `{'status': 'success', ...}`
- Standard error response: `{'status': 'error', 'error_code': '...', 'message_sk': '...', 'message_en': '...'}`
- Error codes are SCREAMING_SNAKE_CASE strings (e.g., `MISSING_FIELD`, `TIME_SLOT_TAKEN`, `INVALID_DATE`).
- HTTP status codes are used properly: 200 success, 400 bad request, 405 method not allowed, 409 conflict, 500 server error.
- Every endpoint validates the HTTP method and returns 405 if wrong.
- Request bodies are JSON (parsed with `json.loads(request.body)`).
- **CSRF protection is active** — all POST/DELETE requests must include the CSRF token.

---

## 14. Workers

There are exactly **two workers**:
- `"Roman"` — Kapitalized exactly. Masseur (male).
- `"Evka"` — Kapitalized exactly. Masseuse (female).

Worker name is validated server-side on reservation creation (`valid_workers = ['Roman', 'Evka']`). Reviews store worker as lowercase (`"roman"` / `"evka"`).

---

## 15. Pages / Views

| URL | View | Auth |
|---|---|---|
| `/` | `homepage` | Public |
| `/reservation/` | `reservation` | Public |
| `/profile/` | `profile` | Authenticated |
| `/all_reservations/` | `all_reservations` | Superuser |
| `/settings_view/` | `settings` | Superuser |
| `/calendar_view_admin/` | `calendar_view_admin` | Superuser |

`all_reservations` defaults to sorting by `datetime_from` descending with pagination. Reservation data itself is loaded via `GET /get_all_reservations_data/` (AJAX) with filter and sort params.

---

## 16. Deployment

- **Docker**: `python:3.10` base image, Django runs via `manage.py runserver 0.0.0.0:8000`.
- **Docker Compose**: single `web` service, binds `127.0.0.1:9000:8000`, `restart: unless-stopped`.
- **Static files**: collected to `/app/staticfiles` during Docker build via `collectstatic --clear --noinput`.
- **WhiteNoise**: serves static files, uses `CompressedManifestStaticFilesStorage` for hashed filenames.
- **DEBUG = False** in production. `ALLOWED_HOSTS` includes `masazevlcince.sk`, `www.masazevlcince.sk`, `localhost`, `127.0.0.1`.
- **CSRF trusted origins** include both `https://masazevlcince.sk` and local dev URLs.
- Database is external MySQL (not containerized) — no local SQLite in production (`db.sqlite3` is dev artifact).

---

## 17. Security Rules

- `SECRET_KEY` is hardcoded in `settings.py` — **must be moved to an env variable before any public exposure**.
- Database password and email password are hardcoded — **same: move to environment variables**.
- `DEBUG = False` in production — correct.
- CSRF protection is enabled and enforced on all state-changing endpoints.
- Authentication is checked at the view level (not middleware-level decorators) — the pattern is `if not request.user.is_authenticated: return render(request, 'error.html', ...)`.
- Email validation uses a regex pattern on the server side for non-admin users.
- All model field lengths are validated against `max_length` constraints before database write.
- Reservation conflict check happens server-side (last-write-wins protection via 409 response).

---

## 18. Coding Conventions

- Backend modules are split by concern into `Roman/backend_funcs/` — keep this separation.
- Views in `viewer/views.py` only render pages; they do not contain API logic.
- Use `datetime.now()` everywhere — never `timezone.now()` (USE_TZ is False).
- Dates in Python: `date.strftime('%d.%m.%Y')` for display, `'%Y-%m-%d'` for API exchange, `'%H:%M'` for times.
- All string literals shown to users must go through `_()` (Python) or `{% trans %}` (templates).
- API error messages always have both `message_sk` and `message_en`.
- Config values always read from `config.ini` — never cached at module load time; always `config.read('config.ini')` at the start of the function.
- `AlreadyMadeReservation` is always updated via `update_or_create` (keyed by `name_surname`).
- Reviews: `worker` field is stored **lowercase** (`"roman"` / `"evka"`); `Reservation.worker` is **capitalized** (`"Roman"` / `"Evka"`).

---

## 19. What NOT To Do

- Do **not** use `timezone.now()` or aware datetimes anywhere.
- Do **not** add a new `urls.py` in an app — all routes are in `Roman/urls.py`.
- Do **not** put API logic inside `viewer/views.py` — that file is for page views only.
- Do **not** store worker schedules in the database — use `config.ini`.
- Do **not** skip bilingual error messages on API endpoints.
- Do **not** make reservations outside the validated duration list `[30, 45, 60, 90, 120]`.
- Do **not** ignore the 15-minute buffer between reservations in slot calculations.
- Do **not** approve reservations without sending a confirmation email to the client.

---

## 20. Backend Stability Rule

**The backend is complete and working. Do not refactor it.**

- Do **not** restructure `Roman/backend_funcs/` modules.
- Do **not** rewrite existing views or API endpoints.
- Do **not** change existing model fields or add migrations unless a genuine new feature requires it.
- Do **not** add `djangorestframework` or replace `JsonResponse` with DRF serializers.
- Do **not** change slot calculation logic, buffer logic, or the duration validation list.
- Do **not** modify the email system or `email_template.html` for frontend migration purposes.
- New backend work is limited to **additive** changes only (new endpoints, new fields if a feature demands it).
- Any future frontend migration (e.g. Vue 3 — see `VUE_MIGRATION_PLAN.md`) must treat the backend as a stable, complete API layer.
