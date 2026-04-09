# PROJECT RULES — Masáže Vlčince (Vue 3 SPA)

## 1. What This Project Is

A **massage booking web application** for a massage salon called "Masáže Vlčince" (masazevlcince.sk). It serves two masseurs — **Roman** and **Evka** — and allows clients to browse services, book appointments, leave reviews, and manage their profile. Admins manage reservations, schedules, and availability through a protected admin UI.

**Architecture:** Full Vue 3 SPA with Django backend API.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Backend | Django 4.2, Python 3.10 |
| Database | MySQL (via `mysql-connector-django`), hosted at `mail.314.sk` |
| Frontend | Vue 3 (Global Build), Vue Router 4, Vue I18n 9 |
| UI Framework | Custom CSS (modern design system), Bootstrap 5 utilities |
| Calendar | FullCalendar 6.1.9 Core |
| Dialogs | SweetAlert2 (for confirmations and alerts) |
| Static files | WhiteNoise (`CompressedManifestStaticFilesStorage`) |
| Email | SMTP via `mail.314.sk`, port 587 (TLS) |
| Deployment | Docker + Docker Compose, Nginx in front (port 9000 → 8000) |
| i18n | Vue I18n 9 with separate SK/EN message objects |
| Config | `config.ini` (runtime worker schedule config, NOT in settings.py) |

---

## 3. Project Structure

```
Roman/                   ← Django project package (settings, urls, wsgi, asgi)
  backend_funcs/         ← All API logic split by concern:
    general.py           ← Bootstrap, language switching, reviews, homepage/calendar data
    reservation.py       ← Slot checking, booking, approval, cancellation
    settings_view.py     ← Admin schedule config, turned-off days
    users.py             ← Login, logout, registration, delete saved person
viewer/                  ← Main app: models, legacy views (only vue_app + approve_mail), templates
  templates/
    vue_app.html         ← Single SPA shell template
    error.html           ← Server-side error page (rarely used)
    email_template.html  ← Email notification template
  models.py              ← All data models
  views.py               ← Contains vue_app() view + get_all_reservations_data() + approve_reservation_mail()
  context_processors.py  ← Not used in Vue mode
accounts/                ← Custom user model
locale/en/               ← English translations (.po/.mo) — for email templates only
static/
  vue/                   ← Vue 3 application source
    main.js              ← App entry point, router setup, i18n config
    store.js             ← Reactive global store (auth state)
    messages.js          ← Bilingual SK/EN translation objects
    components/          ← Shared components (AppNavbar, AuthModal)
    views/               ← Page-level components (HomeView, ReservationView, etc.)
    utils/               ← Helpers (api.js, formatters.js)
  css/
    vue-app.css          ← Modern design system for Vue SPA
    bootstrap.min.css    ← Bootstrap 5 utilities only
  scripts/
    sweetalert2@11.js    ← Alert library
    fullcalendar-6.1.9/  ← Calendar library
  images/                ← Logos, photos, icons
  fontawesome/           ← Font Awesome 6 (self-hosted)
```

**All routes** are in `Roman/urls.py` — there is only one urls.py for the whole project.

---

## 4. Apps

### `viewer` — core app
- Contains all models, the Vue SPA shell view (`vue_app`), email template.
- Template directory: `viewer/templates/` (registered via `APP_DIRS = True`).
- **Legacy page views removed** — all UI is now Vue 3 components.

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

### Backend (Django)
- **Default language: Slovak (`sk`)**.
- Language is stored in the session: `request.session['django_language']`.
- Language activation: `from django.utils.translation import activate; activate(language_code)`.
- Translations are in `locale/en/LC_MESSAGES/django.po` (compile with `makemessages` / `compilemessages`).
- **Backend i18n is only used for email templates** — all user-facing UI is in Vue I18n.
- Language switch endpoint: `POST /switch_language/<language_code>/`.

### Frontend (Vue I18n)
- All UI strings live in `static/vue/messages.js` as a JavaScript object with `sk` and `en` keys.
- Language is managed by the global `store.language` reactive property.
- Vue I18n config:
  ```javascript
  const i18n = VueI18n.createI18n({
    legacy: false,
    locale: 'sk',
    fallbackLocale: 'sk',
    messages,
  });
  ```
- Components use `const { t, locale } = useI18n()` to access translations.
- `t('nav.home')` → `"Domov"` (SK) or `"Home"` (EN).
- Language switch triggers:
  1. POST to `/switch_language/<language_code>/`
  2. Update `store.language`
  3. Update `locale.value`
  4. Update `document.documentElement.lang`

**Rule:** Every user-facing string must be in `messages.js` under both `sk` and `en` keys.

---

## 8. Authentication & Roles

- Login is by **email + password** (not username).
- Login endpoint: `POST /login_api/` → JSON response.
- Logout: `GET /logout/` → redirects to homepage (server-side logout).
- `LOGIN_URL = '/admin/login/'` (Django default admin login).
- Two roles:
  - **Regular user** — can view their profile and cancel their own reservations.
  - **Superuser (admin)** — can access all admin views; can create reservations directly (auto-approved); can approve/reject/delete reservations; can manage turned-off days and schedule.
- Auth state is loaded via `GET /api/bootstrap/` on app mount, stored in `store.isAuthenticated` and `store.isSuperuser`.
- Vue Router guards are **not used** — each view checks `store.isSuperuser` and renders an error message if unauthorized.

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

## 12. Vue 3 Frontend Architecture

### 12.1 SPA Shell
- Django serves a single template: `viewer/templates/vue_app.html`.
- All 6 routes render the same HTML shell with `<div id="app"></div>`.
- Vue mounts to `#app` and Vue Router handles all navigation client-side.
- The `vue_app()` view in `viewer/views.py`:
  ```python
  def vue_app(request):
      language_code = request.session.get('django_language', 'sk')
      activate(language_code)
      return render(request, 'vue_app.html')
  ```

### 12.2 Vue Router Setup
Routes defined in `static/vue/main.js`:
| Path | Component | Public/Protected |
|---|---|---|
| `/` | `HomeView` | Public |
| `/reservation/` | `ReservationView` | Public |
| `/profile/` | `ProfileView` | Auth required |
| `/all_reservations/` | `AllReservationsView` | Superuser only |
| `/settings_view/` | `SettingsView` | Superuser only |
| `/calendar_view_admin/` | `CalendarAdminView` | Superuser only |

Routing mode: `createWebHistory()` (no hash `#` in URLs).

### 12.3 Global State (store.js)
A reactive object managing shared state:
```javascript
export const store = reactive({
  isBootstrapped: false,
  isAuthenticated: false,
  isSuperuser: false,
  language: 'sk',
  user: { email: '', name: '', surname: '', phone_number: '' },
  authModalMode: null, // 'login' | 'register' | null
  async bootstrap() { /* Fetch /api/bootstrap/ */ },
  openAuth(mode) { this.authModalMode = mode; },
  closeAuth() { this.authModalMode = null; },
});
```

On app load, `store.bootstrap()` fetches `/api/bootstrap/` to populate auth state.

### 12.4 Component Structure
```
static/vue/
  main.js               ← App setup, router config, i18n config
  store.js              ← Global reactive store
  messages.js           ← SK/EN translations
  components/
    AppNavbar.js        ← Global navigation bar
    AuthModal.js        ← Login/register modal dialog
  views/
    HomeView.js         ← Homepage (gallery, reviews, techniques)
    ReservationView.js  ← Multi-step booking wizard
    ProfileView.js      ← User's reservations
    AllReservationsView.js ← Admin reservation table
    SettingsView.js     ← Admin schedule config
    CalendarAdminView.js   ← Admin calendar view
  utils/
    api.js              ← fetchJSON helper with CSRF token
    formatters.js       ← Date formatting, text normalization
```

All components use the **Options API with defineComponent** (not `<script setup>`), because this is a **global build** setup without a bundler.

### 12.5 Component Conventions
- Each component is defined as:
  ```javascript
  const { defineComponent, ref, reactive, computed } = Vue;
  const { useI18n } = VueI18n;

  export const MyComponent = defineComponent({
    name: 'MyComponent',
    setup() {
      const { t, locale } = useI18n();
      // ... logic
      return { /* exposed data */ };
    },
    template: `...`,
  });
  ```
- **No `.vue` single-file components** — everything is plain `.js` files with inline template strings.
- Import paths are relative: `import { store } from '../store.js'`.
- All `.js` files must use `export` for components/utilities.

### 12.6 CSS Architecture
- Modern custom design system in `static/css/vue-app.css`.
- CSS custom properties (variables):
  ```css
  :root {
    --bg: #f5f1ea;
    --surface: rgba(255, 252, 247, 0.84);
    --brand: #0f7e7a;
    --accent: #d57a40;
    --danger: #b83b5e;
    --radius-xl: 32px;
    /* ... */
  }
  ```
- **No Bootstrap components** — only Bootstrap utility classes (`.container`, `.row`, `.col-*`, etc.).
- Glass-morphism cards: `.glass-panel` with `backdrop-filter: blur(18px)`.
- Responsive breakpoints handled via CSS media queries.
- **Font:** Google Fonts — "Plus Jakarta Sans" (body) + "Cormorant Garamond" (headings).

### 12.7 No Build Step
- Vue, Vue Router, Vue I18n loaded from CDN (unpkg) in production mode:
  ```html
  <script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"></script>
  <script src="https://unpkg.com/vue-router@4/dist/vue-router.global.prod.js"></script>
  <script src="https://unpkg.com/vue-i18n@9/dist/vue-i18n.global.prod.js"></script>
  ```
- `main.js` is loaded as `type="module"`.
- **No Vite, no Webpack, no npm build command.**
- Static files served by WhiteNoise in production.

---

## 13. API Design Conventions

### 13.1 Bootstrap Endpoints (New)
Three new read-only endpoints provide initial data to Vue components:

| Endpoint | Purpose | Response Shape |
|---|---|---|
| `GET /api/bootstrap/` | Auth state + user info + language | `{ is_authenticated, is_superuser, language, user: {...} }` |
| `GET /api/homepage/` | Gallery photos, vouchers, reviews, worker ratings | `{ photos: [...], vouchers: [...], reviews: [...], roman_avg, evka_avg }` |
| `GET /api/reservation-bootstrap/` | Autocomplete user list + prefill data | `{ user_options: [...], prefill: {...} }` |
| `GET /api/my-reservations/` | Current user's reservations | `{ reservations: [...] }` |
| `GET /api/settings-bootstrap/` | Worker schedules + turned-off days | `{ settings: {...}, turned_off_days: [...] }` |
| `GET /api/admin-calendar/` | All reservations for admin calendar view | `{ events: [...] }` |

### 13.2 Standard Response Format
- All API endpoints return `JsonResponse`.
- Standard success response: `{'status': 'success', ...}`
- Standard error response: `{'status': 'error', 'error_code': '...', 'message_sk': '...', 'message_en': '...'}`
- Error codes are SCREAMING_SNAKE_CASE strings (e.g., `MISSING_FIELD`, `TIME_SLOT_TAKEN`, `INVALID_DATE`).
- HTTP status codes are used properly: 200 success, 400 bad request, 405 method not allowed, 409 conflict, 500 server error.
- Every endpoint validates the HTTP method and returns 405 if wrong.
- Request bodies are JSON (parsed with `json.loads(request.body)`).
- **CSRF protection is active** — all POST/DELETE requests must include the CSRF token.

### 13.3 Bilingual Error Messages
- API responses that return user-facing messages must provide **both** `message_sk` and `message_en` keys.
- Frontend picks the correct message based on `locale.value`:
  ```javascript
  import { localizedBackendMessage } from '../utils/api.js';
  const message = localizedBackendMessage(response, locale.value, 'Fallback text');
  ```

---

## 14. Workers

There are exactly **two workers**:
- `"Roman"` — Capitalized exactly. Masseur (male).
- `"Evka"` — Capitalized exactly. Masseuse (female).

Worker name is validated server-side on reservation creation (`valid_workers = ['Roman', 'Evka']`). Reviews store worker as lowercase (`"roman"` / `"evka"`).

---

## 15. Pages / Views (Vue Components)

### `HomeView` (`/`)
- Photo gallery (lightbox with `selectedPhoto` state).
- Massage technique descriptions (modal with `selectedTechnique` state).
- Reviews section (with add review modal for logged-in users).
- Voucher download section.
- Contact info.
- Data loaded from `GET /api/homepage/`.

### `ReservationView` (`/reservation/`)
- Multi-step wizard:
  1. Pick worker (Roman / Evka)
  2. Pick date (FullCalendar)
  3. Pick time slot (grid of 15-min increments)
  4. Pick service duration (30/45/60/90/120 min)
  5. Fill contact form + confirmation
- Autocomplete past clients from `AlreadyMadeReservation`.
- Service catalog with prices is **hardcoded in the component** (not from backend).
- Data loaded from `GET /api/reservation-bootstrap/`.

### `ProfileView` (`/profile/`)
- Shows list of user's reservations (filtered by email).
- Cancel reservation button (with reason prompt).
- Data loaded from `GET /api/my-reservations/`.

### `AllReservationsView` (`/all_reservations/`)
- Admin table of all reservations.
- Sortable columns, filterable by all fields.
- Pagination (10 per page, configurable in `config.ini`).
- Quick date filters: "Today", "Tomorrow", "Clear filters".
- Actions: Approve, Deactivate, Add Note, Delete.
- Data loaded from `GET /get_all_reservations_data/` (legacy endpoint, not in `/api/` namespace).

### `SettingsView` (`/settings_view/`)
- Admin schedule config per worker (working days, hours).
- Turned-off days management (add/delete restrictions).
- Data loaded from `GET /api/settings-bootstrap/`.

### `CalendarAdminView` (`/calendar_view_admin/`)
- FullCalendar view of all reservations.
- Color-coded by worker (Roman = blue, Evka = pink, cancelled = dark red).
- Data loaded from `GET /api/admin-calendar/`.

---

## 16. Frontend Utilities

### `utils/api.js`
```javascript
export function getCookie(name) { /* Read cookie by name */ }

export async function fetchJSON(url, options = {}) {
  // Wrapper around fetch() that:
  // - Adds CSRF token to non-GET requests
  // - Parses JSON responses
  // - Throws error with .status and .data properties on HTTP errors
}

export function localizedBackendMessage(data, locale, fallback) {
  // Returns message_en or message_sk based on locale
}
```

### `utils/formatters.js`
```javascript
export function formatDateInput(date) {
  // Formats date as DD.MM.YYYY
}

export function normalizeText(value) {
  // Removes diacritics and lowercases for search matching
}

export function workerAccent(worker) {
  // Returns 'accent-rose' or 'accent-sky' CSS class
}
```

---

## 17. Deployment

- **Docker**: `python:3.10` base image, Django runs via `manage.py runserver 0.0.0.0:8000`.
- **Docker Compose**: single `web` service, binds `127.0.0.1:9000:8000`, `restart: unless-stopped`.
- **Static files**: collected to `/app/staticfiles` during Docker build via `collectstatic --clear --noinput`.
- **WhiteNoise**: serves static files, uses `CompressedManifestStaticFilesStorage` for hashed filenames.
- **DEBUG = False** in production. `ALLOWED_HOSTS` includes `masazevlcince.sk`, `www.masazevlcince.sk`, `localhost`, `127.0.0.1`.
- **CSRF trusted origins** include both `https://masazevlcince.sk` and local dev URLs.
- Database is external MySQL (not containerized) — no local SQLite in production (`db.sqlite3` is dev artifact).

---

## 18. Security Rules

- `SECRET_KEY` is hardcoded in `settings.py` — **must be moved to an env variable before any public exposure**.
- Database password and email password are hardcoded — **same: move to environment variables**.
- `DEBUG = False` in production — correct.
- CSRF protection is enabled and enforced on all state-changing endpoints.
- Authentication is checked at the view level (not middleware-level decorators) — the pattern is `if not request.user.is_authenticated: return render(request, 'error.html', ...)` **for backend views only**. Vue components check `store.isAuthenticated` and render error UI.
- Email validation uses a regex pattern on the server side for non-admin users.
- All model field lengths are validated against `max_length` constraints before database write.
- Reservation conflict check happens server-side (last-write-wins protection via 409 response).

---

## 19. Coding Conventions

### Backend
- Backend modules are split by concern into `Roman/backend_funcs/` — keep this separation.
- Views in `viewer/views.py` now only contain:
  - `vue_app()` — serves the SPA shell
  - `get_all_reservations_data()` — legacy admin table endpoint
  - `approve_reservation_mail()` — email link handler
- Use `datetime.now()` everywhere — never `timezone.now()` (USE_TZ is False).
- Dates in Python: `date.strftime('%d.%m.%Y')` for display, `'%Y-%m-%d'` for API exchange, `'%H:%M'` for times.
- All string literals shown to users in **emails** must go through `_()` (Python) or `{% trans %}` (templates).
- API error messages always have both `message_sk` and `message_en`.
- Config values always read from `config.ini` — never cached at module load time; always `config.read('config.ini')` at the start of the function.
- `AlreadyMadeReservation` is always updated via `update_or_create` (keyed by `name_surname`).
- Reviews: `worker` field is stored **lowercase** (`"roman"` / `"evka"`); `Reservation.worker` is **capitalized** (`"Roman"` / `"Evka"`).

### Frontend
- All UI strings in `static/vue/messages.js` under `sk` and `en`.
- All user-visible Slovak strings (both in `messages.js` and inline `locale === 'en' ? '...' : '...'` ternaries) must use correct Slovak diacritics: á, é, í, ó, ú, ý, ä, ô, ž, š, č, ť, ď, ľ, ĺ, ŕ. Never write Slovak without diacritics (e.g. `"Vymazat"` must be `"Vymazať"`, `"Prosim"` must be `"Prosím"`).
- Use `t('key.path')` to access translations in components.
- All API calls via `fetchJSON()` from `utils/api.js`.
- Dates formatted as `DD.MM.YYYY` in the UI. API sends/receives dates as `YYYY-MM-DD`.
- Time formatted as `HH:MM` throughout.
- Component naming: PascalCase for component names, kebab-case in templates.
- Use `ref()` for primitive reactive state, `reactive()` for objects.
- Always destructure Vue Composition API utilities: `const { ref, computed } = Vue;`
- **Do not use `<script setup>`** — this is a global build, not SFC.

---

## 20. What NOT To Do

### Backend
- Do **not** use `timezone.now()` or aware datetimes anywhere.
- Do **not** add a new `urls.py` in an app — all routes are in `Roman/urls.py`.
- Do **not** put API logic inside Django templates — that layer no longer renders HTML.
- Do **not** store worker schedules in the database — use `config.ini`.
- Do **not** skip bilingual error messages on API endpoints.
- Do **not** make reservations outside the validated duration list `[30, 45, 60, 90, 120]`.
- Do **not** ignore the 15-minute buffer between reservations in slot calculations.
- Do **not** approve reservations without sending a confirmation email to the client.

### Frontend
- Do **not** create `.vue` single-file components — this is a global build setup.
- Do **not** introduce a bundler (Vite, Webpack, Rollup) — the architecture is intentionally build-free.
- Do **not** use Vue Router navigation guards — auth checks happen inside components.
- Do **not** hardcode strings in component templates — use `t('message.key')`.
- Do **not** use jQuery or direct DOM manipulation — use Vue reactivity.
- Do **not** use Bootstrap JS components — use SweetAlert2 for dialogs, native Vue for everything else.
- Do **not** use `hash` router mode — use `createWebHistory()`.

---

## 21. Backend Stability Rule

**The backend is complete and working. Do not refactor it.**

- Do **not** restructure `Roman/backend_funcs/` modules.
- Do **not** rewrite existing API endpoints unless a genuine bug is found.
- Do **not** change existing model fields or add migrations unless a genuine new feature requires it.
- Do **not** add `djangorestframework` or replace `JsonResponse` with DRF serializers.
- Do **not** change slot calculation logic, buffer logic, or the duration validation list.
- Do **not** modify the email system or `email_template.html` structure.
- New backend work is limited to **additive** changes only (new endpoints, new fields if a feature demands it).

---

## 22. Frontend Migration Completion

### What Was Migrated
- ✅ All 6 pages converted to Vue 3 components.
- ✅ Bilingual content moved from inline JS to `messages.js`.
- ✅ SweetAlert2 login/register modals replaced with Vue `AuthModal.js` component.
- ✅ Django template variables (`csrfToken`, `isEnglish`, `superUser`) replaced with `/api/bootstrap/` endpoint.
- ✅ Multi-step reservation wizard state moved to Vue reactive refs.
- ✅ FullCalendar integrated with `@fullcalendar/core` (global build).
- ✅ All jQuery/Bootstrap JS removed.
- ✅ Custom modern design system in `vue-app.css`.

### Legacy Files (Not Used in Vue Mode)
These files remain in `static/scripts/` but are **not loaded** in `vue_app.html`:
- `scripts.js`, `users.js`, `homepage.js`, `reservation.js`, `profile.js`, `all_reservations.js`, `settings_view.js`, `calendar_view_admin.js`
- `jquery-3.6.0.min.js`, `bootstrap.bundle.min.js`

These legacy Django templates are **not used** in Vue mode:
- `homepage.html`, `reservation.html`, `profile.html`, `all_reservations.html`, `settings_view.html`, `calendar_view_admin.html`, `base.html`

**Only `vue_app.html` is used** for the SPA shell.

---

## 23. URL Routing Architecture

### Django Routes (server-side)
All 6 main routes point to the same view:
```python
path('', vue_app, name='homepage'),
path('reservation/', vue_app, name='reservation'),
path('profile/', vue_app, name='profile'),
path('all_reservations/', vue_app, name='all_reservations'),
path('settings_view/', vue_app, name='settings_view'),
path('calendar_view_admin/', vue_app, name='calendar_view_admin'),
```

### Vue Router (client-side)
Vue Router intercepts all clicks and handles navigation without full page reload. Routes map 1:1 to Django paths for seamless SSR fallback.

---

## 24. Performance & Optimization

- **No bundle step** = instant deployment, no build time.
- **WhiteNoise** serves static files with compression and caching headers.
- **Vue production build** loaded from CDN (gzipped ~70KB).
- Reactive store prevents unnecessary API calls (bootstrap only on mount).
- FullCalendar events are cached and only refetched when worker changes.
- Debounced search/filter inputs (250ms delay) in admin reservation table.
- Images served from `static/images/` with browser caching.
- Font Awesome self-hosted (no external font loading).

---

## 25. Future Enhancements (Optional)

If the project grows beyond 10+ pages or requires better DX:
- Migrate to Vite + SFC (`.vue` files) for better editor support, hot reload, scoped styles.
- Add TypeScript for type safety in complex components.
- Move service catalog and massage technique descriptions to the database.
- Add Pinia for more structured state management (currently using plain reactive object).
- Implement Vue Router navigation guards for auth protection.
- Add unit tests with Vitest.

---

## 26. Development Workflow

### Running Locally
```bash
cd Roman
python manage.py runserver
```
Open `http://localhost:8000/` in browser. Hot reload is not available (no build step) — refresh browser to see changes.

### Making Frontend Changes
1. Edit `.js` files in `static/vue/`.
2. Refresh browser.
3. No build step required.

### Making Backend Changes
1. Edit Python files.
2. Django dev server auto-reloads.
3. If models change, run `makemigrations` + `migrate`.

### Updating Translations
**Backend (email templates):**
```bash
python manage.py makemessages -l en
# Edit locale/en/LC_MESSAGES/django.po
python manage.py compilemessages
```

**Frontend (Vue UI):**
Edit `static/vue/messages.js` directly — no compilation needed.

### Collecting Static Files (Production)
```bash
python manage.py collectstatic --clear --noinput
```

---

## 27. Testing Checklist

Before deployment, verify:
- ✅ Both languages (SK/EN) render correctly in all views.
- ✅ Login/logout flow works.
- ✅ Guest booking creates reservation with `active=False`.
- ✅ Admin booking creates reservation with `active=True`.
- ✅ Email notifications are sent (check spam folder).
- ✅ Slot conflict detection prevents double-booking.
- ✅ 15-minute buffer is enforced.
- ✅ Calendar displays all reservations with correct colors.
- ✅ Turned-off days block slot availability.
- ✅ Admin can approve/cancel/delete reservations.
- ✅ Profile page shows only user's own reservations.
- ✅ Reviews can be added/deleted (superuser can delete any).
- ✅ Language switch persists across page navigation.
- ✅ Mobile responsive layout works on all views.
- ✅ SweetAlert2 confirmations appear before destructive actions.

---

## 28. Key Files Reference

| File | Purpose |
|---|---|
| `Roman/urls.py` | All URL routing (Django + API endpoints) |
| `Roman/settings.py` | Django configuration |
| `Roman/backend_funcs/general.py` | Bootstrap, homepage, reviews, language switch |
| `Roman/backend_funcs/reservation.py` | All reservation business logic |
| `Roman/backend_funcs/settings_view.py` | Admin schedule config |
| `Roman/backend_funcs/users.py` | Login, logout, registration |
| `viewer/models.py` | All database models |
| `viewer/views.py` | `vue_app()` + legacy admin endpoint |
| `viewer/templates/vue_app.html` | SPA shell template |
| `static/vue/main.js` | Vue app entry point |
| `static/vue/store.js` | Global reactive store |
| `static/vue/messages.js` | Bilingual translations |
| `static/css/vue-app.css` | Modern design system |
| `config.ini` | Worker schedules (runtime config) |

---

**End of PROJECT_RULES_WITH_VUE.md**
