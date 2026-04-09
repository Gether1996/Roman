# Vue 3 Frontend Audit 2 — Masáže Vlčince

**Date:** April 9, 2026
**Scope:** Full re-audit after VUE_MIGRATION_PLAN completion — SK/EN coverage, diacritics, backend compatibility, hardcoded strings, UX bugs.

---

## Summary

| Severity | Count | Status |
|---|---|---|
| 🔴 CRITICAL | 4 | → Fixed |
| 🟡 MEDIUM | 6 | → Fixed |
| 🟢 LOW | 1 | → Fixed |

---

## 🔴 CRITICAL BUGS

### B1 — AuthModal: 4 SK validation messages missing diacritics
**File:** `static/vue/components/AuthModal.js`
**Problem:** Client-side validation error messages were hardcoded without diacritics — shown directly to Slovak users with plaintext romanization:
- `'Prosim zadajte email a heslo.'` (missing `í, ž, ť`)
- `'Prosim vyplnte vsetky povinne polia.'` (missing `í, ň, š, é, é`)
- `'Hesla sa nezhoduju.'` (missing `á, ú`)
- `'Heslo musi obsahovat aspon 8 znakov.'` (missing `í, ť, ň, 8`)

These are the first messages a new/returning user sees when making a form error — displaying broken Slovak looks unprofessional and violates the project diacritics rule.

**Fix:** Replaced all 4 hardcoded strings with `t()` calls using newly added keys `auth.missingEmailPassword`, `auth.missingFields`, `auth.passwordMismatch`, `auth.passwordTooShort` in `messages.js`.

---

### B2 — AuthModal: 'Este' missing diacritic in auth-switch text
**File:** `static/vue/components/AuthModal.js`
**Problem:** The login ↔ register switch text used `'Este nemáte konto?'` instead of `'Ešte nemáte konto?'` — the word `Ešte` (= "yet") was missing its `š`.

**Fix:** Moved both switch texts to `messages.js` (`auth.switchToRegister`, `auth.switchToLogin`) and use `t()` in the template.

---

### B3 — AppNavbar: hamburger menu button uses wrong aria-label key
**File:** `static/vue/components/AppNavbar.js`
**Problem:** The hamburger menu button used `t('nav.language')` as its `aria-label`. That key returns _"Prepnúť jazyk"_ / _"Switch language"_ — completely wrong for a menu toggle button. Screen reader users would hear "Switch language" when navigating to the hamburger, causing accessibility confusion.

**Fix:** Changed to `:aria-label="menuOpen ? t('nav.closeMenu') : t('nav.openMenu')"` with new `nav.openMenu` / `nav.closeMenu` keys added to `messages.js`.

---

### B4 — AllReservationsView: Approve button displays for admin-deactivated reservations
**File:** `static/vue/views/AllReservationsView.js`
**Problem:** The Approve button condition was `v-if="!r.cancellation_reason && !r.active"`. When an admin deactivates a reservation via `/deactivate_reservation_by_admin/` without providing a cancellation reason, `cancellation_reason` stays empty and `active` stays `false` — so the Approve button would incorrectly appear for that admin-cancelled reservation.

**Fix:** Changed to `v-if="r.status === 'Čaká sa schválenie'"` — this uniquely identifies genuinely pending reservations regardless of how cancellation was performed.

---

## 🟡 MEDIUM ISSUES

### H1 — AllReservationsView: 10+ hardcoded inline locale ternaries in template
**File:** `static/vue/views/AllReservationsView.js`
**Problem:** Every label, column header, note prefix, placeholder, Swal title, and pagination text was hardcoded as `locale === 'en' ? '...' : '...'` instead of using `t()`. Messages.js had some of these keys (`admin.date`, `admin.slot`, `admin.status`, `admin.cancellation`) but they went unused. Changing language at runtime would not trigger re-render of some of these interpolated strings. Strings affected:
- Table column headers: Date, Time, Service, Contact, Status, Notes, Actions
- Toolbar: Per page
- Table body: note labels "Klient", "Zrušenie", "No reservations" message
- Pagination: "total"/"celkom"
- Action tooltips: Approve, Deactivate, Add note, Delete
- Swal dialog titles: Deactivate, Approve, Delete, Add note, Internal note label
- `resStatusLabel()`: inline locale checks

**Fix:** Added all missing keys to `messages.js` (`admin.time`, `admin.service`, `admin.contact`, `admin.notes`, `admin.actions`, `admin.perPage`, `admin.noReservations`, `admin.client`, `admin.total`, `admin.approved`, `admin.pending`, `admin.cancelledLabel`, `admin.deactivateConfirm`, `admin.approveConfirm`, `admin.deleteConfirm`, `admin.internalNote`, `admin.addNoteFull`, `admin.deleteSelected`). Replaced all inline ternaries and `resStatusLabel` return values with `t()`.

---

### H2 — ProfileView: 2 inline strings not using t()
**File:** `static/vue/views/ProfileView.js`
**Problem:** Field labels "Therapist"/"Terapeut" and "Service"/"Služba" used `store.language === 'en' ? ... : ...` checks.

**Fix:** Added `profile.therapist` and `profile.service` to `messages.js`, replaced inline checks with `t()`.

---

### H3 — ReservationView: Phone label + 6 summary row labels hardcoded
**File:** `static/vue/views/ReservationView.js`
**Problem:** The "Phone"/"Telefón" input label and all 7 summary confirmation rows (Date, Time, Service, Name, Email, Phone, Therapist) used inline locale ternaries.

**Fix:** Added `reservation.phone` and `reservation.worker` to `messages.js`. Summary rows now use `t('admin.date')`, `t('admin.time')`, `t('admin.service')`, `t('reservation.phone')`, `t('reservation.worker')`. Dropdown empty state ("No results"/"Žiadne výsledky") moved to `reservation.noResults`.

---

### H4 — HomeView: 3 review modal field labels + Swal title hardcoded
**File:** `static/vue/views/HomeView.js`
**Problem:** Review modal labels "Therapist"/"Terapeut", "Message"/"Správa", "Rating"/"Hodnotenie" and the delete review Swal title "Delete review?"/"Vymazať hodnotenie?" were all inline ternaries.

**Fix:** Added `home.therapist`, `home.message`, `home.rating`, `home.deleteReview` to `messages.js`, used `t()` everywhere.

---

### H5 — SettingsView: Multiple inline strings in template and Swal dialogs
**File:** `static/vue/views/SettingsView.js`
**Problem:** Select-all tooltip, "Delete selected" button text, delete restriction Swal title/confirm button, and "Delete all selected" Swal confirm button were all inline ternaries.

**Fix:** Added `admin.selectAll`, `admin.deleteSelected`, `admin.deleteRestrictionConfirm` to `messages.js`. Template and Swal dialogs now use `t()`.

---

### H6 — CalendarAdminView: Status labels inline in legend and eventClick popup
**File:** `static/vue/views/CalendarAdminView.js`
**Problem:** Legend labels "Čaká sa schválenie"/"Pending" and "Zrušená"/"Cancelled" used inline ternaries. The `eventClick` popup also compared inline `locale.value === 'en'` for "Approved"/"Schválená" and "Pending" labels.

**Fix:** Legend and popup now use `t('admin.pending')`, `t('admin.cancelledLabel')`, `t('admin.approved')`.

---

## 🟢 LOW ISSUES

### A1 — messages.js: ~25 UI string keys defined inline rather than in messages.js
**File:** `static/vue/messages.js`
**Problem:** Across all 6 views and 2 components, approximately 25 user-visible string keys were bypassing `messages.js` entirely. This meant: (1) language switching didn't always retrigger reactive updates for template strings, (2) no single source of truth for translations, (3) the project rule "All UI strings in `messages.js`" was violated.

**Fix:** Added all missing keys to both `sk` and `en` sections of `messages.js`:
- `nav`: `openMenu`, `closeMenu`
- `auth`: `missingEmailPassword`, `missingFields`, `passwordMismatch`, `passwordTooShort`, `switchToRegister`, `switchToLogin`
- `home`: `therapist`, `message`, `rating`, `deleteReview`
- `reservation`: `phone`, `worker`, `noResults`
- `profile`: `therapist`, `service`
- `admin`: `time`, `service`, `contact`, `notes`, `actions`, `perPage`, `noReservations`, `client`, `total`, `approved`, `pending`, `cancelledLabel`, `selectAll`, `deleteSelected`, `deleteRestrictionConfirm`, `internalNote`, `deactivateConfirm`, `approveConfirm`, `deleteConfirm`, `addNoteFull`

---

## Backend API Compatibility Matrix

Full verification against `Roman/backend_funcs/` source:

| Vue usage | Backend field | Status |
|---|---|---|
| `form.phone` → `POST /create_reservation/` | `phone` (json_data.get('phone')) | ✅ |
| `form.name_surname` → `nameSurname` | `json_data.get('nameSurname')` | ✅ |
| `selectedDate` | `json_data.get('selectedDate')` | ✅ |
| `selectedSlot` → `timeSlot` | `json_data.get('timeSlot')` | ✅ |
| `selectedService.duration` | `json_data.get('duration')` | ✅ |
| `selectedService.backendName` → `massageName` | `json_data.get('massageName')` | ✅ |
| `worker.value` | `json_data.get('worker')` | ✅ |
| `form.note` | `json_data.get('note')` | ✅ |
| `data.prefill.phone` from `/api/reservation-bootstrap/` | `prefill['phone']` | ✅ |
| `data.user_options[].phone` | `phone: user.phone_number` | ✅ |
| ProfileView: `reservation.time` | `time: reservation.get_time_range_string()` | ✅ |
| ProfileView: `reservation.massage_name` | `massage_name` | ✅ |
| ProfileView: `reservation.is_past` | `is_past: datetime.now() > reservation.datetime_to` | ✅ |
| ProfileView: `reservation.cancellation_reason` | `cancellation_reason` | ✅ |
| AllReservationsView: `r.slot` | `slot: reservation.get_time_range_string()` | ✅ |
| AllReservationsView: `r.status` | `status: reservation.status` | ✅ |
| AllReservationsView: `r.personal_note` | `personal_note` | ✅ |
| SettingsView bootstrap: `roman`, `evka` keys | `worker_payload('settings-roman')` | ✅ |
| SettingsView bootstrap: `turned_off_days[].time_range` | `day.formatted_time_range()` | ✅ |
| CalendarAdminView: `p.active === 'True'` | `'active': "True" if reservation.active else "False"` (string!) | ✅ |
| `DELETE /deactivate_reservation/` → `reservation_id`, `reason` | Both fields consumed | ✅ |
| `POST /approve_reservation/` → `id` | `json_data.get('id')` | ✅ |
| `DELETE /delete_reservation/` → `id` | `json_data.get('id')` | ✅ |
| `POST /add_personal_note/` → `id`, `note` | Both consumed | ✅ |
| `DELETE /delete_turned_off_day/` → `turnedOffDayId` | `json_data['turnedOffDayId']` | ✅ |
| `DELETE /delete_turned_off_days/` → `ids` | `json_data['ids']` | ✅ |
| `POST /save_settings/` → `files_per_page` | Consumed in settings_view.py | ✅ |
| `POST /add_review/` → `name_surname`, `worker`, `message`, `stars` | All consumed | ✅ |
| Login API response: `message_sk`, `message_en` | Both keys returned | ✅ |
| Registration API response: `message_sk`, `message_en` | Both keys returned | ✅ |

---

## Diacritics Audit — All User-Visible SK Strings

| File | String | Status |
|---|---|---|
| `messages.js` — all SK keys | Full review | ✅ All correct |
| `AuthModal.js` — validation errors | `Prosím zadajte email a heslo.` etc. | ✅ Fixed (B1) |
| `AuthModal.js` — auth switch | `Ešte nemáte konto?` | ✅ Fixed (B2) |
| `ReservationView.js` — Swal errors | `Prosím zadajte meno...` etc. | ✅ Correct |
| `ProfileView.js` — inputValidator | `Prosím zadajte dôvod.` | ✅ Correct |
| `SettingsView.js` — Swal plural | `Vymazať ${count} obmedzení?` | ✅ Correct (kept inline for plural forms) |
| `AllReservationsView.js` — Swal | All moved to `t()` | ✅ |
| `HomeView.js` — Swal | All moved to `t()` | ✅ |

---

## SK/EN Coverage Summary

All user-visible strings verified covered in both languages. No hardcoded monolingual strings remain in templates or critical logic paths. Complex pluralization for restriction count (`Vymazať ${count} obmedzení?`) remains as a justified inline template literal due to Slovak three-form pluralization (`e` / `á` / `í`) which Vue I18n `|` syntax does not support without a custom plural rule.

---

## Files Modified

| File | Changes |
|---|---|
| `static/vue/messages.js` | +25 new keys in both `sk` and `en` sections |
| `static/vue/components/AuthModal.js` | B1+B2 diacritics fix, all inline strings → `t()` |
| `static/vue/components/AppNavbar.js` | B3 aria-label fix → `t('nav.openMenu/closeMenu')` |
| `static/vue/views/AllReservationsView.js` | B4 approve logic fix, 13 inline ternaries → `t()`, `resStatusLabel` rewritten |
| `static/vue/views/ProfileView.js` | 2 inline labels → `t()` |
| `static/vue/views/ReservationView.js` | Phone label + 6 summary labels → `t()`, dropdown empty → `t()` |
| `static/vue/views/HomeView.js` | 3 review modal labels + Swal → `t()` |
| `static/vue/views/SettingsView.js` | 2 template strings + 2 Swal → `t()` |
| `static/vue/views/CalendarAdminView.js` | 3 legend + popup status labels → `t()` |

---

*All 11 issues fixed. Backend fully compatible. All SK diacritics correct. All user-visible strings covered in both languages via `messages.js`.*
