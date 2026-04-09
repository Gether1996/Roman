# Vue 3 Migration Plan — Masáže Vlčince

## 1. Why Vue 3 and Not Angular

Vue 3 is the right fit for this project:

- **6 pages, self-contained** — no deep component tree sharing, no complex cross-component state. Vue's simplicity matches the scale.
- **No boilerplate tax** — no `@NgModule`, no `@Injectable`, no `@Component` decorators, no separate `.html`/`.ts`/`.css` files per component. Everything in one `.vue` file.
- **Same TypeScript support** — Composition API with `<script setup lang="ts">` is fully typed and more ergonomic than Angular's class-based approach.
- **~40% less migration effort** — Angular estimate was 13–16 days; Vue is ~10–12 days.
- **No DRF needed** — Angular pushed toward adding `djangorestframework`. Vue works fine against the existing plain `JsonResponse` endpoints with `axios` — no additional Django dependencies.

**The backend is complete and working.** This is a frontend-only migration. The Django backend logic, all existing API endpoints, models, business rules, email system, authentication, and `config.ini` schedule handling are **not touched**. The only backend additions are 3 small read-only endpoints and one catch-all view to serve the Vue shell.

---

## 2. Current Frontend Inventory

### Pages / Templates (6)
| Template | Complexity | Notes |
|---|---|---|
| `homepage.html` | Medium | Gallery, reviews, technique descriptions |
| `reservation.html` | **High** | Multi-step wizard + FullCalendar |
| `all_reservations.html` | **High** | AJAX table, filters, pagination |
| `profile.html` | Low | Reservation list, cancel button |
| `settings_view.html` | Medium | Per-worker schedule form |
| `calendar_view_admin.html` | Low | Admin FullCalendar view |

### JS Files (8)
| File | Complexity | Notes |
|---|---|---|
| `scripts.js` | Low | Shared navbar, language switch, SweetAlert config |
| `users.js` | **High** | Login + registration built as SweetAlert2 HTML strings |
| `reservation.js` | **High** | Multi-step wizard, slot/duration fetch, autocomplete, FullCalendar |
| `homepage.js` | Medium | ~300 lines of bilingual SK/EN technique description HTML |
| `all_reservations.js` | High | AJAX table, filtering, custom pagination renderer |
| `profile.js` | Low | One deactivation function |
| `settings_view.js` | Medium | Schedule save calls |
| `calendar_view_admin.js` | Low | FullCalendar init |

---

## 3. What Makes Migration Hard

### 3.1 Bilingual content embedded in JS objects
`homepage.js` has ~300 lines of bilingual SK/EN HTML strings for technique descriptions. `users.js` has bilingual strings inside every SweetAlert popup. `reservation.js` generates bilingual labels inline. All of this moves to `sk.json` / `en.json` and `vue-i18n`.

### 3.2 SweetAlert2 modals are de-facto components
Login, registration, user autocomplete, confirmations, price lists — all are manually-built SweetAlert2 popups with inline HTML. In Vue these become real `.vue` components. SweetAlert2 can stay for simple one-line confirmations.

### 3.3 Django template variables injected as JS globals
`base.html` injects `csrfToken`, `isEnglish`, `language_code`, `superUser` as inline `<script>` globals. Vue components can't read these natively — a `/api/bootstrap/` endpoint provides them instead.

### 3.4 Multi-step reservation wizard state in globals
`reservation.js` uses `let worker`, `let duration`, `let timeSlot`, etc. as module-level globals. CSS class toggling (`hidden-element-first/second/third/fourth`) controls step visibility. In Vue this becomes `const currentStep = ref(1)` with `v-if`.

### 3.5 FullCalendar — not a blocker
`@fullcalendar/vue3` is a first-class package. It is a near-direct port of the existing calendar config.

---

## 4. What Makes Migration Easy

- **Backend API is already clean JSON** — every action has a dedicated endpoint. `axios` in Vue works against them without any changes.
- `all_reservations` **already loads everything via AJAX** — it maps almost 1:1 to a Vue component.
- Only **6 pages** — small SPA surface area.
- **Session-based auth** — Django keeps handling it; Vue reads the session state from `/api/bootstrap/`.
- **No complex cross-page state** — Pinia is needed only for auth state shared across all pages (navbar login/logout).

---

## 5. Architecture: Full SPA (Recommended)

Django serves one HTML file (the Vue shell `index.html`). Vue Router handles all 6 "pages". Django continues serving all JSON API endpoints unchanged.

**Why not Hybrid?** A hybrid approach (Django serves each page, Vue takes over interactive parts) mixes two template systems and prevents Vue Router — you pay the migration cost without getting the clean architecture.

---

## 6. Project Setup

```bash
npm create vue@latest masaze-frontend
# Select during setup: TypeScript ✓, Vue Router ✓, Pinia ✓, ESLint ✓

cd masaze-frontend

npm install vue-i18n
npm install axios
npm install @fullcalendar/vue3 @fullcalendar/daygrid @fullcalendar/interaction @fullcalendar/core
npm install sweetalert2
npm install bootstrap
```

### Folder Structure

```
masaze-frontend/
  src/
    main.ts                    ← app entry, installs plugins
    App.vue                    ← root: <RouterView> + <TheNavbar>
    router/
      index.ts                 ← 6 routes + auth guards
    stores/
      auth.ts                  ← Pinia: isAuthenticated, isSuperuser, language
    composables/
      useApi.ts                ← axios instance with CSRF interceptor
      useLanguage.ts           ← language switching helper
    components/
      TheNavbar.vue
      LanguageSwitcher.vue
      TheModal.vue             ← generic modal wrapper (replaces SweetAlert2 for forms)
      UserSearchDropdown.vue   ← replaces the SweetAlert2 autocomplete in reservation
      PaginatorBar.vue
    views/
      HomeView.vue
      ReservationView.vue
      AllReservationsView.vue
      ProfileView.vue
      SettingsView.vue
      CalendarAdminView.vue
    assets/
      i18n/
        sk.json
        en.json
      css/
        style.css              ← imports Bootstrap + custom overrides
```

The built `dist/` output is placed in `masaze-frontend/dist/` — Django's WhiteNoise serves it.

---

## 7. Core Infrastructure

### 7.1 Axios CSRF Interceptor (`composables/useApi.ts`)

```typescript
import axios from 'axios'

function getCookie(name: string): string {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : ''
}

const api = axios.create({ withCredentials: true })

api.interceptors.request.use(config => {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(config.method?.toUpperCase() ?? '')) {
    config.headers['X-CSRFToken'] = getCookie('csrftoken')
  }
  return config
})

export default api
```

All views import `api` from this composable. CSRF is handled automatically — no manual header setting anywhere else.

### 7.2 Auth Store (`stores/auth.ts`)

```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/composables/useApi'

export const useAuthStore = defineStore('auth', () => {
  const isAuthenticated = ref(false)
  const isSuperuser = ref(false)
  const language = ref<'sk' | 'en'>('sk')

  async function bootstrap() {
    const { data } = await api.get('/api/bootstrap/')
    isAuthenticated.value = data.is_authenticated
    isSuperuser.value = data.is_superuser
    language.value = data.language
  }

  return { isAuthenticated, isSuperuser, language, bootstrap }
})
```

Called once in `App.vue` on `onMounted`. All components that need auth state call `useAuthStore()`.

### 7.3 Router with Guards (`router/index.ts`)

```typescript
const routes = [
  { path: '/',                    component: () => import('@/views/HomeView.vue') },
  { path: '/reservation',         component: () => import('@/views/ReservationView.vue') },
  { path: '/profile',             component: () => import('@/views/ProfileView.vue'),
    meta: { requiresAuth: true } },
  { path: '/all_reservations',    component: () => import('@/views/AllReservationsView.vue'),
    meta: { requiresSuperuser: true } },
  { path: '/settings_view',       component: () => import('@/views/SettingsView.vue'),
    meta: { requiresSuperuser: true } },
  { path: '/calendar_view_admin', component: () => import('@/views/CalendarAdminView.vue'),
    meta: { requiresSuperuser: true } },
]

router.beforeEach(to => {
  const auth = useAuthStore()
  if (to.meta.requiresSuperuser && !auth.isSuperuser) return '/error'
  if (to.meta.requiresAuth && !auth.isAuthenticated) return '/error'
})
```

All 6 views are lazy-loaded — only the current page's JS bundle is downloaded.

### 7.4 i18n (`vue-i18n`)

```typescript
// src/main.ts
import { createI18n } from 'vue-i18n'
import sk from './assets/i18n/sk.json'
import en from './assets/i18n/en.json'

const i18n = createI18n({ locale: 'sk', fallbackLocale: 'sk', messages: { sk, en } })
```

In templates: `{{ $t('nav.home') }}`  
In `<script setup>`: `const { t } = useI18n()`

Language switching:
```typescript
async function switchLanguage(lang: 'sk' | 'en') {
  await api.post(`/switch_language/${lang}/`)  // persists in Django session
  i18n.global.locale.value = lang              // updates UI instantly
  auth.language = lang
}
```

The bilingual JS objects from `homepage.js` and `users.js` become entries in `sk.json`/`en.json`. That work is mechanical but thorough.

---

## 8. Component Breakdown

### 8.1 TheNavbar.vue
**Source:** `navbar.html` + `navbar-homepage.html` + navbar section of `scripts.js`

- Reads from `useAuthStore()` — no Django template injection needed
- `v-if="auth.isSuperuser"` for admin-only links
- Login/Register modal → `<LoginModal>` / `<RegisterModal>` Vue components (replaces the SweetAlert HTML string modals in `users.js`)
- Language toggle → calls `switchLanguage()` from `useLanguage.ts`
- Mobile menu → `const menuOpen = ref(false)` with `v-show`

**Estimated effort: 1 day**

### 8.2 HomeView.vue
**Source:** `homepage.html` + `homepage.js`

- Therapist cards, service tags → static template
- Technique modal → `<TechniqueModal :id="selectedTechnique" v-if="selectedTechnique" />`. Content from `$t('techniques.classic.body')` etc., replacing the giant bilingual JS object
- Reviews → `const reviews = ref([])` fetched from `GET /api/reviews/`; `v-for` over results
- Gallery / Voucher photos → `v-for` over fetched data
- SM System modal → `<SmSystemModal />` component

**Estimated effort: 1.5 days**

### 8.3 ReservationView.vue — most complex
**Source:** `reservation.html` + `reservation.js`

```vue
<script setup lang="ts">
const currentStep = ref(1)
const selectedWorker = ref<'Roman' | 'Evka' | null>(null)
const selectedDate = ref<string | null>(null)
const selectedSlot = ref<string | null>(null)
const selectedDuration = ref<number | null>(null)
const availableSlots = ref<string[]>([])
const availableDurations = ref<number[]>([])
</script>

<template>
  <!-- Step 1 -->
  <WorkerSelectStep v-if="currentStep >= 1" @select="onWorkerSelect" />
  <!-- Step 2 — calendar appears after worker selected -->
  <CalendarStep v-if="currentStep >= 2" :worker="selectedWorker" @dateClick="onDatePick" />
  <!-- Step 3 — time slots -->
  <SlotSelectStep v-if="currentStep >= 3" :slots="availableSlots" @select="onSlotSelect" />
  <!-- Step 4 — duration + booking form -->
  <BookingFormStep v-if="currentStep >= 4" :durations="availableDurations" @submit="createReservation" />
</template>
```

Key sub-components:
- `CalendarStep.vue` — wraps `@fullcalendar/vue3`, events from `/check_available_slots_ahead/`
- `SlotSelectStep.vue` — `v-for` button grid over `availableSlots`
- `BookingFormStep.vue` — `v-model` form, `UserSearchDropdown.vue` for admin autocomplete (replaces the SweetAlert2 user-select popup)
- `createReservation()` — calls `api.post('/create_reservation/', payload)`, SweetAlert2 for success/error toast

**Estimated effort: 3 days**

### 8.4 AllReservationsView.vue
**Source:** `all_reservations.html` + `all_reservations.js`

This page already loads all data via AJAX — it maps almost 1:1 to a Vue component.

```vue
<script setup lang="ts">
const reservations = ref<Reservation[]>([])
const filters = reactive({ name_surname: '', email: '', worker: '', status: '', ... })
const sortBy = ref('datetime_from')
const order = ref<'asc' | 'desc'>('desc')
const pagination = reactive({ current: 1, total: 1, perPage: 10 })

// Auto-fetch on filter/sort change with 300ms debounce
watchDebounced([filters, sortBy, order], fetchData, { debounce: 300 })
</script>
```

`watchDebounced` replaces the manual `input` event listeners in `all_reservations.js`. `PaginatorBar.vue` replaces the `updatePaginateElements()` function. Table rows become `v-for` over `reservations` — no manual DOM building.

**Estimated effort: 2 days**

### 8.5 ProfileView.vue
**Source:** `profile.html` + `profile.js`

```vue
<script setup lang="ts">
const reservations = ref<Reservation[]>([])
onMounted(async () => {
  const { data } = await api.get('/api/my-reservations/')
  reservations.value = data.reservations
})
</script>

<template>
  <tr v-for="r in reservations" :key="r.id">
    ...
    <button v-if="!r.is_past && r.active" @click="cancel(r.id)">{{ $t('cancel') }}</button>
  </tr>
</template>
```

**Estimated effort: 0.5 day**

### 8.6 SettingsView.vue
**Source:** `settings_view.html` + `settings_view.js`

- Working hours per day: `v-model` on time inputs, save button calls `api.post('/save_settings/', body)`
- Turned-off days: `v-for` table with add/delete via existing endpoints
- Working days checkboxes: `v-model` on an array of selected day strings

**Estimated effort: 1.5 days**

### 8.7 CalendarAdminView.vue
**Source:** `calendar_view_admin.html` + `calendar_view_admin.js`

```vue
<FullCalendar :options="calendarOptions" />
```

Events from `GET /get_all_reservations_data/`, mapped to FullCalendar event objects. Locale computed from `auth.language`.

**Estimated effort: 0.5 day**

---

## 9. i18n Migration Detail

### From (current)
- Django `{% trans '...' %}` in templates
- `isEnglish ? 'text EN' : 'text SK'` ternaries in every JS function
- Giant bilingual objects in `homepage.js`

### To (Vue)
All strings move to two JSON files. Example structure:

```json
// assets/i18n/sk.json
{
  "nav": { "home": "Domov", "reserve": "Rezervovať", "settings": "Nastavenia" },
  "reservation": {
    "selectWorker": "Vyberte maséra",
    "noSlots": "Na dnes už nie sú voľné sloty"
  },
  "techniques": {
    "classic": { "title": "Klasická masáž", "body1": "Aktivuje krvný a lymfatický obeh..." }
  },
  "auth": { "login": "Prihlásiť", "logout": "Odhlásiť", "register": "Registrovať" }
}
```

This is the most mechanical part of the migration — pure copy-paste from existing JS objects and Django `.po` files into the JSON structure.

**Estimated effort: 1.5 days**

---

## 10. Backend Changes — Strictly Minimal Additions Only

> **Rule: The existing backend is not refactored, restructured, or changed in any way.**  
> All existing views, models, business logic, slot calculations, email sending, `config.ini` handling, authentication, and API endpoints stay exactly as they are. The items below are purely additive — new endpoints and one new view, nothing else.

### 10.1 Three new simple endpoints

```python
# Roman/backend_funcs/general.py (add to existing file)

def bootstrap(request):
    return JsonResponse({
        'is_authenticated': request.user.is_authenticated,
        'is_superuser': request.user.is_superuser if request.user.is_authenticated else False,
        'language': request.session.get('django_language', 'sk'),
    })

def my_reservations(request):
    if not request.user.is_authenticated:
        return JsonResponse({'status': 'error'}, status=401)
    reservations = Reservation.objects.filter(email=request.user.email).order_by('-datetime_from')
    return JsonResponse({'reservations': [
        {
            'id': r.id, 'name_surname': r.name_surname,
            'date': r.get_date_string(), 'time': r.get_time_range_string(),
            'worker': r.worker, 'status': r.status,
            'active': r.active, 'is_past': datetime.now() > r.datetime_to,
            'cancellation_reason': r.cancellation_reason or '',
            'special_request': r.special_request or '',
            'created_at': r.get_created_at_string(),
        }
        for r in reservations
    ]})

def reviews_api(request):
    # Same logic as homepage view — return enriched reviews + averages
    ...
```

Add to `Roman/urls.py`:
```python
path('api/bootstrap/', bootstrap, name='api_bootstrap'),
path('api/my-reservations/', my_reservations, name='api_my_reservations'),
path('api/reviews/', reviews_api, name='api_reviews'),
```

### 10.2 Catch-all view to serve Vue `index.html`

```python
# viewer/views.py
def vue_app(request):
    index_path = os.path.join(settings.BASE_DIR, 'masaze-frontend', 'dist', 'index.html')
    return FileResponse(open(index_path, 'rb'))
```

```python
# Roman/urls.py — at the bottom, after all existing routes
from django.urls import re_path
re_path(r'^(?!static/|admin/|api/).*$', vue_app, name='vue_app'),
```

### 10.3 Static file config

```python
# settings.py
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, 'static'),
    os.path.join(BASE_DIR, 'masaze-frontend', 'dist', 'assets'),  # hashed JS/CSS
]
```

### 10.4 All existing endpoints and logic — absolutely zero changes

Every single existing endpoint stays exactly as written:
- All slot calculation logic in `reservation.py`
- All authentication in `users.py` (`/login_api/`, `/logout/`, `/registration/`)
- All admin operations (`/approve_reservation/`, `/deactivate_reservation_by_admin/`, `/delete_reservation/`, etc.)
- All schedule management in `settings_view.py`
- `/approve_reservation_mail/<id>/` email link view
- `config.ini` reading — unchanged, server-side only
- All models, migrations, `CustomUser`, `Reservation`, `TurnedOffDay`, etc.
- Email system, `email_template.html`, SMTP config

The Vue frontend simply calls these endpoints the same way the current jQuery/fetch code does — with axios instead.

---

## 11. Migration Phases

### Phase 1 — Backend Prep (1–2 days)
1. Add `bootstrap`, `my_reservations`, `reviews_api` endpoints to `Roman/backend_funcs/general.py` and `urls.py`.
2. Add `vue_app` catch-all view.
3. Update `STATICFILES_DIRS`.
4. Smoke test: place a minimal `index.html` in `masaze-frontend/dist/` and verify it loads.

### Phase 2 — Vue Skeleton (1 day)
1. `npm create vue@latest masaze-frontend` — TypeScript, Vue Router, Pinia.
2. Install all dependencies.
3. Configure `useApi.ts` with CSRF interceptor.
4. Configure `auth.ts` Pinia store.
5. Configure router with all 6 routes + guards.
6. Configure `vue-i18n` with placeholder `sk.json`/`en.json`.
7. Build `TheNavbar.vue` — confirm routing and auth state work end-to-end.
8. Configure `vite.config.ts` dev proxy.

### Phase 3 — Pages (6–7 days, easiest first)
1. `ProfileView.vue` (0.5 day)
2. `CalendarAdminView.vue` (0.5 day)
3. `HomeView.vue` (1.5 days)
4. `SettingsView.vue` (1.5 days)
5. `AllReservationsView.vue` (2 days)
6. `ReservationView.vue` (3 days)

### Phase 4 — i18n & Polish (1.5 days)
1. Extract all remaining hardcoded strings to `sk.json` / `en.json`.
2. Verify language switching persists across navigation.
3. Check FullCalendar locale switches with language.

### Phase 5 — Build & Deploy (0.5 day)
1. `npm run build`.
2. `python manage.py collectstatic`.
3. Verify CSRF works in production.
4. Verify `/approve_reservation_mail/<id>/` email link still works (pure Django, unaffected).

---

## 12. Total Effort Estimate

| Phase | Days |
|---|---|
| Phase 1 — Backend Prep | 1–2 |
| Phase 2 — Vue Skeleton | 1 |
| Phase 3 — Pages | 6–7 |
| Phase 4 — i18n | 1.5 |
| Phase 5 — Build & Deploy | 0.5 |
| **Total** | **~10–12 days** |

---

## 13. What Stays the Same — Everything Backend

The backend is working correctly and is **not part of this migration**:

- All existing Django API endpoints — zero changes, zero refactoring
- All business logic: slot calculation, 15-min buffer, duration validation, conflict checks
- All Django models and migrations (`Reservation`, `TurnedOffDay`, `AlreadyMadeReservation`, `Review`, `CustomUser`)
- `config.ini` worker schedule config — server-side only, Vue never reads it
- Email system, `email_template.html`, SMTP config
- Authentication backend — Django sessions, `login_api`, `logout`, `registration`
- `/approve_reservation_mail/<id>/` email approval link — pure Django view
- Database (MySQL in prod, SQLite in dev)
- Docker + Docker Compose + `.env` / `.env.dev`
- `/admin/` Django admin panel
- `Roman/backend_funcs/` module structure
- `viewer/models.py`, `accounts/models.py`

---

## 14. Dev Workflow

```bash
# Terminal 1 — Django backend
docker compose -f docker-compose.dev.yml up

# Terminal 2 — Vue frontend (Vite HMR)
cd masaze-frontend
npm run dev
# → http://localhost:5173 (proxied to Django at :9000)
```

`vite.config.ts` proxy (avoids CORS in dev, same-origin from browser perspective):
```typescript
server: {
  proxy: {
    '/api': 'http://127.0.0.1:9000',
    '/static': 'http://127.0.0.1:9000',
    '/login_api': 'http://127.0.0.1:9000',
    '/logout': 'http://127.0.0.1:9000',
    '/create_reservation': 'http://127.0.0.1:9000',
    '/check_available_slots': 'http://127.0.0.1:9000',
    '/check_available_slots_ahead': 'http://127.0.0.1:9000',
    '/check_available_durations': 'http://127.0.0.1:9000',
    '/switch_language': 'http://127.0.0.1:9000',
    '/registration': 'http://127.0.0.1:9000',
    '/approve_reservation': 'http://127.0.0.1:9000',
    '/deactivate_reservation': 'http://127.0.0.1:9000',
    '/add_review': 'http://127.0.0.1:9000',
    '/save_settings': 'http://127.0.0.1:9000',
  }
}
```

Vite's HMR means any `.vue` file change reflects instantly in the browser without rebuilding Docker.

---

## 15. Things to Watch Out For

- **CSRF**: The `useApi.ts` interceptor reads `csrftoken` from `document.cookie`. Django sets this automatically on first response. Test login first — it is the first stateful action and verifies CSRF end-to-end.
- **SweetAlert2**: Keep it for simple confirms/alerts (cancel reservation, delete, approve). Login and registration modals should become real Vue components — maintaining them as SweetAlert HTML strings is the biggest pain point in the current codebase.
- **FullCalendar locale**: `import skLocale from '@fullcalendar/core/locales/sk'`. Set on `calendarOptions` as a `computed` that reads `auth.language` from Pinia.
- **`config.ini` is server-side only**: The schedule config is never exposed to the frontend. Vue calls `/check_available_slots_ahead/` etc. — the backend reads config.ini, Vue never touches it.
- **Static files in production**: `STATIC_ROOT = "/app/staticfiles"` in Docker. The `vue_app` catch-all view must read `index.html` from `STATIC_ROOT` (where `collectstatic` copies it), not from the source `masaze-frontend/dist/`.

---

## 16. Decision Checklist Before Starting

- [ ] Run `npm create vue@latest` locally and confirm Node/npm environment is ready
- [ ] Confirm modal strategy: SweetAlert2 only for simple alerts, real Vue components for login/register forms
- [ ] Confirm the Vite proxy list covers all needed Django endpoints (add any missed ones to `vite.config.ts`)
- [ ] Decide if `reviews_api` is a separate endpoint or folded into `bootstrap`
- [ ] Verify `collectstatic` + WhiteNoise correctly picks up Vue `dist/assets/` alongside existing `static/`

