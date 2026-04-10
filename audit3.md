# Vue 3 / Django Audit 3 — Masáže Vlčince

**Date:** April 10, 2026
**Scope:** Production-readiness pass — security, backend authorization, validation, deployment hardening, residual frontend i18n gaps.

---

## Summary

| Severity | Count | Status |
|---|---|---|
| 🔴 CRITICAL | 12 | → Fixed |
| 🟡 MEDIUM | 4 | → Fixed |
| 🟢 LOW | 5 | → Fixed |

---

## 🔴 CRITICAL — Broken Access Control (OWASP A01)

All 12 issues are the same class of vulnerability: **administrative and data-mutating API endpoints have zero server-side authentication or authorization checks**. The Vue frontend guards views client-side only. Any user (including completely anonymous) who knows the URL can call these endpoints directly with `curl` or a browser and execute privileged operations.

### SEC-1 — `get_all_reservations_data` exposes all client data to anonymous users
**File:** `viewer/views.py`
**Problem:** `GET /get_all_reservations_data/` returns paginated reservation data including name, email, phone, notes, and cancellation reason for **every reservation in the database** with no auth check whatsoever.
**Fix:** Added `if not request.user.is_authenticated or not request.user.is_superuser: return JsonResponse(...)` guard.

---

### SEC-2 — `approve_reservation` callable by any user
**File:** `Roman/backend_funcs/reservation.py`
**Problem:** `POST /approve_reservation/` approves any reservation by ID. No authentication check.
**Fix:** Added superuser guard.

---

### SEC-3 — `deactivate_reservation_by_admin` callable by any user
**File:** `Roman/backend_funcs/reservation.py`
**Problem:** `DELETE /deactivate_reservation_by_admin/` deactivates any reservation and emails the client. No auth check.
**Fix:** Added superuser guard.

---

### SEC-4 — `delete_reservation` callable by any user
**File:** `Roman/backend_funcs/reservation.py`
**Problem:** `DELETE /delete_reservation/` hard-deletes any reservation. No auth check.
**Fix:** Added superuser guard.

---

### SEC-5 — `add_personal_note` callable by any user
**File:** `Roman/backend_funcs/reservation.py`
**Problem:** `POST /add_personal_note/` writes to `personal_note` on any reservation. No auth check.
**Fix:** Added superuser guard.

---

### SEC-6 — `save_settings` callable by any user
**File:** `Roman/backend_funcs/settings_view.py`
**Problem:** `POST /save_settings/` writes to `config.ini` — changes worker schedules, working days, and hours. No auth check. Any anonymous user can make all days unavailable for booking.
**Fix:** Added superuser guard.

---

### SEC-7 — `add_turned_off_day` callable by any user
**File:** `Roman/backend_funcs/settings_view.py`
**Problem:** `POST /add_turned_off_day/` adds day-off entries for workers. No auth check.
**Fix:** Added superuser guard.

---

### SEC-8 — `delete_turned_off_day` callable by any user
**File:** `Roman/backend_funcs/settings_view.py`
**Problem:** `DELETE /delete_turned_off_day/` deletes a restriction by ID. No auth check.
**Fix:** Added superuser guard.

---

### SEC-9 — `delete_turned_off_days` callable by any user
**File:** `Roman/backend_funcs/settings_view.py`
**Problem:** `DELETE /delete_turned_off_days/` deletes multiple restrictions. No auth check.
**Fix:** Added superuser guard.

---

### SEC-10 — `delete_saved_person` callable by any user
**File:** `Roman/backend_funcs/users.py`
**Problem:** `DELETE /delete_saved_person/` deletes entries from `AlreadyMadeReservation`. No auth check.
**Fix:** Added superuser guard.

---

### SEC-11 — `delete_review` callable by anyone including anonymous
**File:** `Roman/backend_funcs/general.py`
**Problem:** `DELETE /delete_review/<id>/` deletes any review. No authentication check at all — even anonymous users can delete reviews.
**Fix:** Added superuser guard.

---

### SEC-12 — `deactivate_reservation` no ownership check
**File:** `Roman/backend_funcs/reservation.py`
**Problem:** `DELETE /deactivate_reservation/` cancels a reservation by `reservation_id`. Any authenticated user can cancel **any other user's reservation** — not just their own. The endpoint only checks the reservation exists, not whether it belongs to the caller.
**Fix:** Added ownership check: `if not request.user.is_superuser and reservation.email != request.user.email: return 403`.

---

## 🟡 MEDIUM ISSUES

### MED-1 — `registration` endpoint: no server-side input validation
**File:** `Roman/backend_funcs/users.py`
**Problem:** No validation on any registration field. A user can register with:
- Empty name, surname, email, password, or phone
- Invalid email format (non-email string)
- Password of 1 character

The frontend validates, but API validation is essential because the frontend can be bypassed.
**Fix:** Added field presence check, email regex check, and minimum password length check (8 chars).

---

### MED-2 — `add_review` no HTTP method check and no input length limits
**File:** `Roman/backend_funcs/general.py`
**Problem:** `add_review` accepts any HTTP method — a GET request triggers `json.loads(request.body)` which raises a `JSONDecodeError`. Also, `name_surname` and `message` have no length cap, allowing arbitrarily large strings to be written to the database.
**Fix:** Added method guard (POST only), max length checks (150 for name, 1000 for message).

---

### MED-3 — Dockerfile uses Django development server
**File:** `Dockerfile`
**Problem:** `CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]` is a development server not suitable for production. It is single-threaded, has no request timeout, and includes debug tooling. Concurrent requests (e.g. two users booking simultaneously) are serialized and one will block.
**Fix:** Added `gunicorn` to `requirements.txt`. Updated `Dockerfile` and `docker-compose.yml` to use `gunicorn Roman.wsgi:application --workers 2 --bind 0.0.0.0:8000 --timeout 60 --access-logfile -`.
2 workers is appropriate for the traffic profile; keeps memory footprint minimal.

---

### MED-4 — Missing Django production security headers
**File:** `Roman/settings.py`
**Problem:** `SecurityMiddleware` is loaded but none of the secure-cookie, HSTS, or content-type flags are set. This means:
- Session cookies are not forced Secure — can be transmitted over HTTP
- CSRF cookie is not forced Secure
- No `Strict-Transport-Security` header (HSTS) — browser won't enforce HTTPS for return visits
- `X-Content-Type-Options: nosniff` not set (though Django 3.0+ defaults to True, explicit is better)

**Fix:** Added to `settings.py` (only active when `DEBUG=False`):
```python
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
```

---

## 🟢 LOW ISSUES

### LOW-1 — `settings_view.py`: stale config (module-level read, project rule violation)
**File:** `Roman/backend_funcs/settings_view.py`
**Problem:** `config.read('config.ini')` at module level (line 8). The project rule states "always `config.read('config.ini')` at the start of the function". Because `save_settings` uses the already-loaded in-memory `config` object, if `config.ini` changes externally between requests the function overwrites it with the stale in-memory values.
**Fix:** Removed module-level `config.read`. Added `config.read('config.ini')` at start of `save_settings` and `add_turned_off_day`.

---

### LOW-2 — `AllReservationsView.js`: 1 remaining inline locale ternary
**File:** `static/vue/views/AllReservationsView.js`
**Problem:** Contact filter column placeholder: `:placeholder="locale === 'en' ? 'Phone / Email' : 'Telefón / Email'"` — bypasses `messages.js`.
**Fix:** Added `admin.phonePlaceholder` key to `messages.js` (both SK/EN). Changed to `:placeholder="t('admin.phonePlaceholder')"`.

---

### LOW-3 — `SettingsView.js`: 3 `cancelButtonText` inline ternaries in Swal dialogs
**File:** `static/vue/views/SettingsView.js`
**Problem:** `cancelButtonText: locale.value === 'en' ? 'Cancel' : 'Zrušiť'` appears 3 times. `t('common.cancel')` already exists and is correct.
**Fix:** Replaced all 3 occurrences with `t('common.cancel')`.

---

### LOW-4 — `HomeView.js`: inline error string in `submitReview`
**File:** `static/vue/views/HomeView.js`
**Problem:** `throw new Error(locale.value === 'en' ? 'Please complete all review fields.' : 'Prosím vyplňte všetky polia hodnotenia.')` bypasses i18n.
**Fix:** Added `home.reviewFormError` key to `messages.js`. Changed to `throw new Error(t('home.reviewFormError'))`.

---

### LOW-5 — `ReservationView.js`: all `validateForm` error strings are inline ternaries
**File:** `static/vue/views/ReservationView.js`
**Problem:** 8 validation error messages in `validateForm()` use hardcoded `locale.value === 'en' ? ... : ...` ternaries.
**Fix:** Added 8 new keys to `messages.js` under `reservation`: `errorNoName`, `errorNameTooLong`, `errorNoEmail`, `errorInvalidEmail`, `errorNoPhone`, `errorPhoneTooLong`, `errorNoteTooLong`, `errorNoService`. Replaced all inline ternaries with `t()`.

---

## Files Modified

| File | Changes |
|---|---|
| `Roman/backend_funcs/reservation.py` | SEC-2 to SEC-5, SEC-12: auth/ownership guards added |
| `Roman/backend_funcs/settings_view.py` | SEC-6 to SEC-9, LOW-1: auth guards + config read fix |
| `Roman/backend_funcs/users.py` | SEC-10, MED-1: auth guard + registration validation |
| `Roman/backend_funcs/general.py` | SEC-11, MED-2: auth guard + method + length validation |
| `viewer/views.py` | SEC-1: superuser guard on `get_all_reservations_data` |
| `Roman/settings.py` | MED-4: production security headers |
| `Dockerfile` | MED-3: gunicorn replaces runserver |
| `docker-compose.yml` | MED-3: command updated for gunicorn |
| `requirements.txt` | MED-3: added gunicorn |
| `static/vue/messages.js` | LOW-2, LOW-4, LOW-5: added 10 new i18n keys |
| `static/vue/views/AllReservationsView.js` | LOW-2: inline ternary removed |
| `static/vue/views/SettingsView.js` | LOW-3: 3 cancelButtonText inline ternaries fixed |
| `static/vue/views/HomeView.js` | LOW-4: submitReview error inline fixed |
| `static/vue/views/ReservationView.js` | LOW-5: 8 validateForm inlines fixed |

---

*All 21 issues fixed. Backend is now protected by proper server-side access control. Deployment uses production-grade gunicorn. All security headers set. All user-visible strings covered via messages.js.*
