# Audit 4 — Deep Bug & Security Review

**Scope:** Full re-read of every backend and frontend file after audit3 fixes.  
**Date:** Post-audit3  
**Auditor:** GitHub Copilot

---

## Summary

| ID  | Severity | File | Issue |
|-----|----------|------|-------|
| B1  | 🔴 Critical | `backend_funcs/reservation.py` | `check_available_slots`: no try-except on `json.loads`, direct key access crashes on missing `selectedDate`, unguarded `strptime` on untrusted input |
| B2  | 🔴 Critical | `backend_funcs/reservation.py` | `check_available_durations`: no try-except on `json.loads`, both `strptime` calls unguarded on user-supplied strings |
| B3  | 🔴 Critical | `backend_funcs/users.py` | `login_api`: `json.loads(request.body)` outside try-except → 500 crash on malformed JSON |
| B4  | 🟡 Medium  | `viewer/views.py` | Duplicate `_` import: `gettext_lazy as _` (line 7) then `gettext as _` (line 13) — second silently overwrites first |
| B5  | 🟡 Medium  | `viewer/templates/vue_app.html` | Vue 3, VueRouter 4, VueI18n 9 loaded from `unpkg.com` CDN without Subresource Integrity (SRI) hashes — supply-chain attack vector; CDN outage kills entire SPA |
| B6  | 🟡 Medium  | `backend_funcs/settings_view.py` | `save_settings`: `files_per_page`, `days_ahead`, and all time values written raw to `config.ini` without type/range/format validation |
| B7  | 🟡 Medium  | `backend_funcs/reservation.py` | `check_available_slots_ahead` and `check_available_durations`: worker comes from URL param — if not `Roman`/`Evka`, silently falls through to wrong config |
| B8  | 🟢 Low     | `viewer/templates/vue_app.html` | `<html lang="sk">` hardcoded — doesn't reflect user's active language, incorrect for EN users |
| B9  | 🟢 Low     | `backend_funcs/users.py` | `registration`: `username` field not set in `CustomUser.objects.create()` — defaults to empty string instead of a meaningful value |
| B10 | 🟢 Low     | `viewer/views.py` | Legacy dead-code views (`homepage`, `calendar_view_admin`, `reservation`, `settings`, `profile`, `all_reservations`) never URL-routed after Vue migration — ~200 lines of dead weight |

---

## Detailed Findings

### B1 — `check_available_slots`: No input validation (🔴 Critical)

**File:** `Roman/backend_funcs/reservation.py`

**Problem:**
```python
# Line ~312 — no try-except
json_data = json.loads(request.body)
# Line ~315 — direct key access, KeyError if missing
selected_date = json_data['selectedDate']
# Line ~316 — unguarded strptime on untrusted string
selected_date = datetime.strptime(selected_date, '%Y-%m-%d').date()
```
- Malformed JSON body → uncaught `json.JSONDecodeError` → 500
- Missing `selectedDate` key → uncaught `KeyError` → 500
- Bad date format (e.g. `"tomorrow"`) → uncaught `ValueError` → 500
- Worker from body not validated — any string is silently passed to the `else` branch (Evka config)

**Fix:** Wrap everything in try-except, use `.get()` for all fields, validate worker, wrap `strptime` in try-except.

---

### B2 — `check_available_durations`: Same crash vulnerabilities (🔴 Critical)

**File:** `Roman/backend_funcs/reservation.py`

**Problem:**
```python
# Line ~523 — no try-except
json_data = json.loads(request.body)
# Lines ~526-527 — unguarded strptime on untrusted strings
selected_date = datetime.strptime(selected_date, '%Y-%m-%d').date()
time_slot_start = datetime.strptime(time_slot_start_str, '%H:%M').time()
```
- Same crash patterns as B1
- Worker from URL path not validated

**Fix:** Wrap json.loads in try-except, guard both `strptime` calls, validate worker param.

---

### B3 — `login_api`: No try-except on `json.loads` (🔴 Critical)

**File:** `Roman/backend_funcs/users.py`

**Problem:**
```python
def login_api(request):
    ...
    if request.method == 'POST':
        json_data = json.loads(request.body.decode('utf-8'))  # no guard
        user_in_db_exists = CustomUser.objects.filter(email=json_data['email']).exists()
```
- Malformed JSON body → `json.JSONDecodeError` → 500 crash
- Missing `email` or `password` key → `KeyError` → 500 crash
- Correct behaviour should be: return 400

**Fix:** Wrap in try-except, use `.get()` for all field access.

---

### B4 — `viewer/views.py`: Duplicate `_` import (🟡 Medium)

**File:** `viewer/views.py`

**Problem:**
```python
from django.utils.translation import gettext_lazy as _   # line 8 — overwritten!
...
from django.utils.translation import gettext as _        # line 13 — wins
```
Second import silently replaces the first. Any code that relies on lazy evaluation of `_()` gets the non-lazy version instead.

**Fix:** Remove the `gettext_lazy` import; keep only `gettext as _`.

---

### B5 — `vue_app.html`: CDN scripts without SRI hashes (🟡 Medium)

**File:** `viewer/templates/vue_app.html`

**Problem:**
```html
<script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"></script>
<script src="https://unpkg.com/vue-router@4/dist/vue-router.global.prod.js"></script>
<script src="https://unpkg.com/vue-i18n@9/dist/vue-i18n.global.prod.js"></script>
```
- No `integrity=` attribute → a CDN compromise silently executes attacker JS in every user's browser (OWASP A08)
- Floating version tags (`@3`, `@4`, `@9`) are not pinned — any breaking update ships transparently
- CDN outage takes down the entire SPA
- Rest of the project already self-hosts SweetAlert2 and FullCalendar — inconsistent

**Fix:** Download specific pinned versions of Vue, VueRouter, and VueI18n into `static/scripts/` and load them as local static files (consistent with existing pattern).

---

### B6 — `save_settings`: No input validation (🟡 Medium)

**File:** `Roman/backend_funcs/settings_view.py`

**Problem:**
```python
files_per_page = json_data.get('files_per_page')
if files_per_page:
    config.set('settings', 'reservations_per_page', files_per_page)  # raw string, no validation

days_ahead_roman = json_data.get('days_ahead_roman')
if days_ahead_roman:
    config.set('settings-roman', 'days_ahead', days_ahead_roman)  # raw string

if json_data.get(time_from_key_roman):
    config.set('settings-roman', f'{day}_starting_hour', json_data.get(time_from_key_roman))  # raw string
```
- Arbitrary strings can be written into `config.ini`
- `files_per_page = "0"`, `"-1"`, `"99999"` are all accepted
- `days_ahead` accepts any string — non-integer would crash on `int()` later during `check_available_slots_ahead`
- Time values accept any string — non-`HH:MM` would crash on `strptime` in slot-checking functions
- Also: `json_data = json.loads(request.body)` has no try-except here either

**Fix:** Validate `files_per_page` and `days_ahead_*` are positive integers in a sane range; validate time values match `HH:MM` format; wrap `json.loads` in try-except.

---

### B7 — Worker URL param not validated (🟡 Medium)

**File:** `Roman/backend_funcs/reservation.py`

**Problem:**
```python
def check_available_slots_ahead(request, worker):
    ...
    worker_config = config['settings-roman'] if worker == 'Roman' else config['settings-evka']
    # if worker == 'anyone_else', silently falls to settings-evka

def check_available_durations(request, worker):
    ...
    worker_config = config['settings-roman'] if worker == 'Roman' else config['settings-evka']
    # same — arbitrary worker string passes through
```
An attacker can probe the API with `worker=anything` and get Evka's config leaked (days ahead, working hours). More importantly, the path `/check_available_durations/<str:worker>/` with an unexpected value gives no error feedback to the frontend.

**Fix:** Return 400 if `worker not in ('Roman', 'Evka')`.

---

### B8 — `<html lang="sk">` hardcoded (🟢 Low)

**File:** `viewer/templates/vue_app.html`

**Problem:**
```html
<html lang="sk">
```
The `vue_app` view reads `language_code` from the session but doesn't pass it to the template. English users always get `lang="sk"` which is incorrect for screen readers and SEO.

**Fix:** Pass `language_code` in template context; use `<html lang="{{ language_code }}">`.

---

### B9 — `registration` doesn't set `username` field (🟢 Low)

**File:** `Roman/backend_funcs/users.py`

**Problem:**
```python
user = CustomUser.objects.create(
    name=name, surname=surname,
    email=email, password=make_password(password),
    phone_number=phone_number,
    # username is not set — defaults to ''
)
```
`CustomUser.username` has `unique=False` and no `null=True`, so Django writes `''` (empty string) for every new user. Listed in `REQUIRED_FIELDS` for `createsuperuser` but skipped at registration.

**Fix:** Set `username=email` so the field has a meaningful, unique value.

---

### B10 — Legacy dead-code views in `viewer/views.py` (🟢 Low)

**File:** `viewer/views.py`

**Problem:**
The following view functions exist in the file but are not imported in `urls.py` and are never called since the Vue SPA migration:
- `homepage()`
- `calendar_view_admin()`
- `reservation()`
- `settings()`
- `profile()`
- `all_reservations()`

They also reference `config.read('config.ini')` at module level (not thread-safe) and use the now-overwritten `_()` binding. Existence of dead code increases surface area for future maintenance confusion.

**Fix:** Remove all legacy dead-code views and the module-level `config = configparser.ConfigParser()` in `viewer/views.py`.

---

## Fixes Applied

All 10 bugs fixed in the same session as this audit.
