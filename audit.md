# Vue 3 Frontend Audit — Masáže Vlčince

**Date:** April 9, 2026  
**Scope:** Full audit of Vue 3 SPA compatibility with Django backend, field alignment, mobile responsiveness, UX.

---

## Summary

| Severity | Count | Status |
|---|---|---|
| 🔴 CRITICAL | 4 | → Fixed |
| 🟡 MEDIUM | 5 | → Fixed |
| 🟢 LOW | 4 | → Fixed |

---

## 🔴 CRITICAL BUGS

### C1 — Calendar never initializes in ReservationView
**File:** `static/vue/views/ReservationView.js`  
**Root cause:** Vue 3 batches DOM updates asynchronously. When `pickWorker()` sets `worker.value = 'Roman'`, the `v-if="worker"` section renders the calendar container, but the DOM has NOT updated yet when `initializeCalendar()` immediately runs. `calendarRoot.value` is still `null` at that point, so FullCalendar never attaches.  
**Fix:** Replace direct `initializeCalendar()` call with a `watch` on `calendarRoot` ref — FullCalendar initializes as soon as the DOM element actually mounts.

---

### C2 — Calendar never renders in CalendarAdminView
**File:** `static/vue/views/CalendarAdminView.js`  
**Root cause:** Same nextTick issue. `loading.value = false` hides the loading div and shows the `<div ref="calendarRoot">` container, but Vue hasn't flushed the DOM update yet. `calendarRoot.value` is null at the point FullCalendar is instantiated.  
**Fix:** Add `await Vue.nextTick()` after `loading.value = false` before initializing FullCalendar.

---

### C3 — Register button removed from navbar — users cannot register
**File:** `static/vue/components/AppNavbar.js` (regression from navbar rework)  
**Root cause:** Prior navbar rework removed the "Register" button from the guest nav actions and added no toggle inside `AuthModal` to switch from login → register. Users are locked out of creating accounts.  
**Fix:** Add "Register" button back to guest nav actions. Also add a switch link inside `AuthModal` so users can toggle between login and register.

---

### C4 — ProfileView shows empty reservations after login
**File:** `static/vue/views/ProfileView.js`  
**Root cause:** `onMounted(loadReservations)` runs once on mount. If user is not authenticated at mount time, the API returns 401 and `reservations.value` stays empty. After login via `AuthModal`, `store.isAuthenticated` becomes `true` reactive so the loading/unauthorized state clears, but `loadReservations()` is never called again. Profile shows "no reservations" even though the user has reservations.  
**Fix:** Watch `store.isAuthenticated` and reload reservations when it becomes `true`.

---

## 🟡 MEDIUM ISSUES

### M1 — `.restriction-row` missing `display: flex`
**File:** `static/css/vue-app.css`  
**Problem:** `.restriction-row` has `justify-content`, `align-items`, `flex-wrap` but no `display: flex`. The restrictions table rows are not laid out horizontally — items stack vertically.  
**Fix:** Add `display: flex; align-items: center;` to `.restriction-row`.

---

### M2 — `.select-inline` class not defined in CSS
**File:** `static/vue/views/AllReservationsView.js` uses `.select-inline`, CSS never defines it.  
**Problem:** The "per page" dropdown in the reservation table toolbar is completely unstyled — no padding, no border-radius, no background.  
**Fix:** Define `.select-inline` in `vue-app.css`.

---

### M3 — `.filter-toolbar` missing `flex-wrap: wrap`
**File:** `static/css/vue-app.css`  
**Problem:** On screen widths between 560px–820px, the filter toolbar contains 5+ buttons + dropdown that cannot wrap, causing horizontal overflow.  
**Fix:** Add `flex-wrap: wrap;` to `.filter-toolbar`.

---

### M4 — Login/registration error messages not bilingual
**File:** `Roman/backend_funcs/users.py` returns `{'status': 'error', 'message': _('...')}` (single locale string via Django i18n), not the standard `message_sk`/`message_en` dual format.  
**Problem:** If the user's browser/session is in English but Django session language hasn't synced yet, error messages show in Slovak.  
**Fix:** Return both `message_sk` and `message_en` from `login_api` and `registration` endpoints, and update `AuthModal.js` to read them via `localizedBackendMessage`.

---

### M5 — Approve button logic shows for admin-cancelled reservations
**File:** `static/vue/views/AllReservationsView.js`  
**Problem:** The Approve button condition is `!reservation.active && !reservation.cancellation_reason`. When admin deactivates via `deactivate_reservation_by_admin`, it sets `personal_note` but leaves `cancellation_reason` empty. These reservations incorrectly show the "Approve" button.  
**Fix:** Use `reservation.status` to control button visibility — check for `status === 'Čaká sa schválenie'` for Approve, and active statuses for Deactivate.

---

## 🟢 LOW ISSUES

### L1 — ProfileView missing `massage_name` field
**File:** `static/vue/views/ProfileView.js`  
**Problem:** The profile reservation cards show worker, date, time, status but NOT what type of massage was booked. The `my_reservations` API endpoint does not include `massage_name` in its response.  
**Fix:** Add `massage_name` to the `my_reservations` API response in `general.py` and add it to the profile card template.

---

### L2 — Hardcoded untranslated label strings in AllReservationsView
**File:** `static/vue/views/AllReservationsView.js`  
**Problem:** Several `<span class="meta-label">` values are hardcoded English strings: `"Worker"`, `"Date"`, `"Slot"`, `"Type"`, `"Name"`, `"Email"`, `"Phone"`, `"Created"`, `"Status"`, `"Client note"`, `"Personal note"`, `"Cancellation"`, `"Prev"`, `"Next"`. These do not switch to Slovak when language is changed.  
**Fix:** Move all to `messages.js` and use `t()`.

---

### L3 — AuthModal confirm password field uses hardcoded string
**File:** `static/vue/components/AuthModal.js`  
**Problem:** Label for confirm password: `store.language === 'en' ? 'Confirm password' : 'Potvrdit heslo'` — uses direct store.language check instead of `t()`.  
**Fix:** Add `auth.confirmPassword` key to `messages.js` and use `t('auth.confirmPassword')`.

---

### L4 — Step indicator cards too wide on very small screens (≤360px)
**File:** `static/css/vue-app.css`  
**Problem:** `.step-grid` has no specific column count defined, inherits from the base grid block. On very small screens, all 5 step cards do not wrap gracefully — they compress below minimum readable size.  
**Fix:** Add explicit responsive column rules for `.step-grid` at ≤560px.

---

## Backend Field Compatibility Matrix

| Vue Field | Backend Field | Endpoint | Status |
|---|---|---|---|
| `massageName` | `massageName` | POST `/create_reservation/` | ✅ |
| `selectedDate` | `selectedDate` | POST `/create_reservation/` | ✅ |
| `worker` | `worker` | POST `/create_reservation/` | ✅ |
| `duration` | `duration` | POST `/create_reservation/` | ✅ |
| `timeSlot` | `timeSlot` | POST `/create_reservation/` | ✅ |
| `nameSurname` | `nameSurname` | POST `/create_reservation/` | ✅ |
| `email` | `email` | POST `/create_reservation/` | ✅ |
| `phone` | `phone` | POST `/create_reservation/` | ✅ |
| `note` | `note` | POST `/create_reservation/` | ✅ |
| `reservation_id` | `reservation_id` | DELETE `/deactivate_reservation/` | ✅ |
| `reason` | `reason` | DELETE `/deactivate_reservation/` | ✅ |
| `id` | `id` | POST `/approve_reservation/` | ✅ |
| `id, note` | `id, note` | DELETE `/deactivate_reservation_by_admin/` | ✅ |
| `id` | `id` | DELETE `/delete_reservation/` | ✅ |
| `id, note` | `id, note` | POST `/add_personal_note/` | ✅ |
| `turnedOffDayId` | `turnedOffDayId` | DELETE `/delete_turned_off_day/` | ✅ |
| `ids` | `ids` | DELETE `/delete_turned_off_days/` | ✅ |
| `days_ahead_roman` | `days_ahead_roman` | POST `/save_settings/` | ✅ |
| `selected_days_roman` | `selected_days_roman` | POST `/save_settings/` | ✅ |
| `time_from_roman_monday`… | same | POST `/save_settings/` | ✅ |
| `name_surname, worker, message, stars` | same | POST `/add_review/` | ✅ |
| `files_per_page` | `files_per_page` | POST `/save_settings/` | ✅ |

---

## API Response Field Compatibility

| API Response Field | Vue Usage | Status |
|---|---|---|
| `reservations[].date` | ProfileView, AllReservationsView | ✅ |
| `reservations[].time` | ProfileView | ✅ |
| `reservations[].slot` | AllReservationsView | ✅ |
| `reservations[].active` | ProfileView cancel button guard | ✅ |
| `reservations[].is_past` | ProfileView cancel button guard | ✅ |
| `reservations[].massage_name` | AllReservationsView | ✅ (missing in ProfileView → L1) |
| `reservations[].personal_note` | AllReservationsView | ✅ |
| `reservations[].cancellation_reason` | AllReservationsView | ✅ |
| `turned_off_days[].time_range` | SettingsView | ✅ (formatted on backend) |
| `settings.roman.hours[day].start` | SettingsView | ✅ |

---

*All 13 issues fixed in the accompanying code changes.*
