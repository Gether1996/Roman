const { defineComponent, ref, reactive, computed, onMounted, onBeforeUnmount, watch, nextTick } = Vue;
const { useI18n } = VueI18n;

import { fetchJSON, localizedBackendMessage } from '../utils/api.js';
import { formatDateInput, normalizeText } from '../utils/formatters.js';
import { store, tr, section } from '../store.js';

// Services, prices, therapists and pass info come from the admin panel (/sprava/sluzby).

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export const ReservationView = defineComponent({
  name: 'ReservationView',
  setup() {
    const { t, locale } = useI18n();
    const router = VueRouter.useRouter();
    const loading = ref(true);
    const worker = ref('');
    const selectedDate = ref('');
    const selectedSlot = ref('');
    const selectedServiceId = ref('');
    const availableSlots = ref([]);
    const availableDurations = ref([]);
    const userOptions = ref([]);
    const userSearch = ref('');
    const userDropdownOpen = ref(false);
    const selectedUser = ref(null);
    const smInfoOpen = ref(false);
    const calendarRoot = ref(null);
    const calendarLoading = ref(false);
    const errorMessage = ref('');
    const consent = ref(false);
    const activePassId = ref('');
    const form = reactive({
      name_surname: '',
      email: '',
      phone: '',
      note: '',
    });

    const booking = computed(() => section('booking'));
    const therapists = computed(() => section('therapists', []).filter((item) => item.visible !== false || store.isSuperuser));
    const currentTherapist = computed(() => section('therapists', []).find((item) => item.key === worker.value) || null);
    const activePass = computed(() => section('passes', []).find((item) => item.id === activePassId.value && item.enabled !== false) || null);
    const needsConsent = computed(() => !store.isSuperuser && booking.value.require_consent !== false);

    let calendar = null;

    const filteredUsers = computed(() => {
      const query = normalizeText(userSearch.value);
      if (!query) {
        return userOptions.value;
      }
      return userOptions.value.filter((option) => normalizeText(option.name_surname).includes(query));
    });

    const availableServices = computed(() => {
      if (!worker.value) {
        return [];
      }
      return section('services', [])
        .filter((service) => service.active !== false && (service.workers || []).includes(worker.value))
        .filter((service) => availableDurations.value.includes(Number(service.duration)))
        .map((service) => ({ ...service, duration: Number(service.duration), backendName: service.backend_name }));
    });

    const selectedService = computed(() => availableServices.value.find((service) => service.id === selectedServiceId.value) || null);

    const currentStep = computed(() => {
      if (!worker.value) return 1;
      if (!selectedDate.value) return 2;
      if (!selectedSlot.value) return 3;
      if (!selectedService.value) return 4;
      return 5;
    });

    function resetAfterWorker() {
      selectedDate.value = '';
      selectedSlot.value = '';
      selectedServiceId.value = '';
      availableSlots.value = [];
      availableDurations.value = [];
      errorMessage.value = '';
    }

    function resetAfterDate() {
      selectedSlot.value = '';
      selectedServiceId.value = '';
      availableDurations.value = [];
      errorMessage.value = '';
    }

    async function loadBootstrap() {
      loading.value = true;
      const data = await fetchJSON('/api/reservation-bootstrap/');
      userOptions.value = data.user_options || [];
      form.name_surname = data.prefill?.name_surname || '';
      form.email = data.prefill?.email || '';
      form.phone = data.prefill?.phone || '';
      loading.value = false;
    }

    function fillUser(option) {
      selectedUser.value = option;
      userSearch.value = '';
      userDropdownOpen.value = false;
      form.name_surname = option.name_surname || '';
      form.email = option.email || '';
      form.phone = option.phone || '';
    }

    function clearSelectedUser() {
      selectedUser.value = null;
      form.name_surname = '';
      form.email = '';
      form.phone = '';
    }

    function onUserSearchBlur() {
      setTimeout(() => { userDropdownOpen.value = false; }, 150);
    }

    async function refreshCalendarEvents() {
      if (!worker.value || !calendar) {
        return;
      }

      calendarLoading.value = true;
      try {
        const response = await fetchJSON(`/check_available_slots_ahead/${worker.value}/`);
        calendar.removeAllEvents();
        const isMobile = window.innerWidth < 640;
        const events = (response.events || []).map((event) => ({
          ...event,
          title: isMobile
            ? String(event.extendedProps?.available_count || '')
            : (locale.value === 'en' ? event.extendedProps?.title_en : event.extendedProps?.title_sk) || event.title,
        }));
        calendar.addEventSource(events);
        markDisabledDays();
      } finally {
        calendarLoading.value = false;
      }
    }

    function markDisabledDays() {
      if (!calendarRoot.value || !calendar) {
        return;
      }

      const dayCells = calendarRoot.value.querySelectorAll('.fc-daygrid-day');
      dayCells.forEach((cell) => {
        const date = cell.getAttribute('data-date');
        const hasEvent = calendar.getEvents().some((event) => {
          const eventDate = event.startStr.split('T')[0];
          return eventDate === date;
        });

        cell.classList.toggle('calendar-disabled-day', !hasEvent);
      });
    }

    function markSelectedDay() {
      if (!calendarRoot.value) return;
      calendarRoot.value.querySelectorAll('.calendar-selected-day').forEach(el => el.classList.remove('calendar-selected-day'));
      if (selectedDate.value) {
        const cell = calendarRoot.value.querySelector(`[data-date="${selectedDate.value}"]`);
        if (cell) cell.classList.add('calendar-selected-day');
      }
    }

    function scrollToNext(refId) {
      const el = document.getElementById(refId);
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY - 116;
      window.scrollTo({ top, behavior: 'smooth' });
    }

    async function pickWorker(value) {
      worker.value = value;
      resetAfterWorker();
      markSelectedDay();
      if (calendar) {
        await refreshCalendarEvents();
      }
      // DOM update for v-if="worker" section is async — watch calendarRoot handles init
      await nextTick();
      scrollToNext('res-step-date');
    }

    async function pickDate(rawDate) {
      selectedDate.value = rawDate;
      resetAfterDate();
      const response = await fetchJSON('/check_available_slots/', {
        method: 'POST',
        body: JSON.stringify({
          worker: worker.value,
          selectedDate: rawDate,
        }),
      });
      availableSlots.value = response.available_slots || [];
      await nextTick();
      markSelectedDay();
      scrollToNext('res-step-time');
    }

    async function pickSlot(slot) {
      selectedSlot.value = slot;
      selectedServiceId.value = '';
      const response = await fetchJSON(`/check_available_durations/${worker.value}/`, {
        method: 'POST',
        body: JSON.stringify({
          pickedDateGeneralData: selectedDate.value,
          timeSlot: slot,
        }),
      });
      availableDurations.value = response.available_durations || [];
      await nextTick();
      scrollToNext('res-step-service');
    }

    function validateForm() {
      const errors = [];
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!form.name_surname.trim()) {
        errors.push(t('reservation.errorNoName'));
      }
      if (form.name_surname.trim().length > 150) {
        errors.push(t('reservation.errorNameTooLong'));
      }

      if (!store.isSuperuser) {
        if (!form.email.trim()) {
          errors.push(t('reservation.errorNoEmail'));
        }
        if (form.email.trim() && !emailPattern.test(form.email.trim())) {
          errors.push(t('reservation.errorInvalidEmail'));
        }
        if (!form.phone.trim()) {
          errors.push(t('reservation.errorNoPhone'));
        }
      }

      if (form.phone.trim().length > 20) {
        errors.push(t('reservation.errorPhoneTooLong'));
      }
      if (form.note.trim().length > 200) {
        errors.push(t('reservation.errorNoteTooLong'));
      }
      if (!selectedService.value) {
        errors.push(t('reservation.errorNoService'));
      }
      if (needsConsent.value && !consent.value) {
        errors.push(locale.value === 'en'
          ? 'Please agree to the terms and conditions.'
          : 'Prosím, potvrďte súhlas s obchodnými podmienkami.');
      }

      return errors;
    }

    async function submitReservation() {
      const errors = validateForm();
      if (errors.length) {
        errorMessage.value = errors.join(' ');
        return;
      }

      const summaryRows = [
        [t('admin.date'), formatDateInput(selectedDate.value)],
        [t('admin.time'), selectedSlot.value],
        [t('admin.service'), `${tr(selectedService.value.name)} - ${selectedService.value.price}`],
        [t('reservation.nameSurname'), form.name_surname],
        ['Email', form.email || '-'],
        [t('reservation.phone'), form.phone || '-'],
        [t('reservation.worker'), worker.value],
      ];

      const result = await window.Swal.fire({
        title: t('reservation.summary'),
        html: `
          <div class="summary-list">
            ${summaryRows.map(([label, value]) => `<div class="summary-row"><strong>${escapeHtml(label)}</strong><span>${escapeHtml(value)}</span></div>`).join('')}
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        confirmButtonColor: '#0f7e7a',
      });

      if (!result.isConfirmed) {
        return;
      }

      try {
        const response = await fetchJSON('/create_reservation/', {
          method: 'POST',
          body: JSON.stringify({
            massageName: selectedService.value.backendName,
            selectedDate: selectedDate.value,
            worker: worker.value,
            duration: selectedService.value.duration,
            timeSlot: selectedSlot.value,
            nameSurname: form.name_surname,
            email: form.email,
            phone: form.phone,
            note: form.note,
            consent: needsConsent.value ? consent.value : undefined,
          }),
        });

        const successText = !store.isSuperuser ? tr(booking.value.success_message) : '';
        await window.Swal.fire({
          icon: 'success',
          title: localizedBackendMessage(response, store.language, t('reservation.success')),
          text: successText || undefined,
          confirmButtonColor: '#0f7e7a',
        });

        router.push('/');
      } catch (error) {
        const message = localizedBackendMessage(error.data, store.language, t('reservation.failed'));
        errorMessage.value = message;
        await window.Swal.fire({
          icon: 'error',
          title: message,
          confirmButtonColor: '#0f7e7a',
        });
      }
    }

    function initializeCalendar() {
      if (!calendarRoot.value) {
        return;
      }

      calendar = new window.FullCalendar.Calendar(calendarRoot.value, {
        initialView: 'dayGridMonth',
        firstDay: 1,
        locale: store.language === 'sk' ? 'sk' : 'en',
        height: 'auto',
        // Re-apply the disabled/selected day styling whenever the visible range
        // changes (e.g. navigating to the next month), not only when events load.
        datesSet: () => {
          markDisabledDays();
          markSelectedDay();
        },
        dateClick: async (info) => {
          const clickedDate = new Date(info.dateStr);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (clickedDate < today) {
            return;
          }

          const hasEvent = calendar.getEvents().some((event) => event.startStr.split('T')[0] === info.dateStr);
          if (!hasEvent) {
            return;
          }

          await pickDate(info.dateStr);
        },
        eventClick: async (info) => {
          const rawDate = info.event.startStr.split('T')[0];
          await pickDate(rawDate);
        },
      });

      calendar.render();
    }

    watch(() => store.language, async (language) => {
      if (calendar) {
        calendar.setOption('locale', language);
        await refreshCalendarEvents();
      }
    });

    // C1 FIX: Watch the calendarRoot ref — FullCalendar initializes as soon as the
    // DOM element actually mounts (after v-if="worker" renders), not before.
    watch(calendarRoot, (el) => {
      if (el && !calendar) {
        initializeCalendar();
        refreshCalendarEvents();
      }
    });

    onMounted(async () => {
      await loadBootstrap();
    });

    onBeforeUnmount(() => {
      if (calendar) {
        calendar.destroy();
      }
    });

    function chooseService(service) {
      selectedServiceId.value = service.id;
      if (service.pass_id && section('passes', []).some((item) => item.id === service.pass_id && item.enabled !== false)) {
        activePassId.value = service.pass_id;
        smInfoOpen.value = true;
      } else {
        nextTick(() => scrollToNext('res-step-details'));
      }
    }

    function closePass() {
      smInfoOpen.value = false;
      nextTick(() => scrollToNext('res-step-details'));
    }

    return {
      store,
      tr,
      booking,
      therapists,
      currentTherapist,
      activePass,
      needsConsent,
      consent,
      chooseService,
      closePass,
      loading,
      worker,
      selectedDate,
      selectedSlot,
      selectedServiceId,
      availableSlots,
      availableServices,
      userOptions,
      userSearch,
      filteredUsers,
      userDropdownOpen,
      selectedUser,
      smInfoOpen,
      form,
      errorMessage,
      currentStep,
      calendarRoot,
      calendarLoading,
      pickWorker,
      pickSlot,
      markSelectedDay,
      scrollToNext,
      fillUser,
      clearSelectedUser,
      onUserSearchBlur,
      submitReservation,
      t,
      locale,
    };
  },
  template: `
    <section class="page-section">
      <div class="container-shell reservation-shell">
        <div class="reservation-header">
          <h1>{{ tr(booking.title) || t('reservation.title') }}</h1>
          <p>{{ tr(booking.subtitle) || t('reservation.subtitle') }}</p>
        </div>
        <div v-if="tr(booking.notice)" class="booking-notice" role="status">
          <i class="fa-solid fa-circle-info"></i>
          <span>{{ tr(booking.notice) }}</span>
        </div>

        <div v-if="loading" class="glass-panel centered-copy">{{ t('common.loading') }}</div>

        <template v-else>
          <div class="step-progress">
            <div
              v-for="step in 5"
              :key="step"
              class="step-pip"
              :class="{ active: currentStep >= step, done: currentStep > step }"
            >
              <span class="step-pip-dot"></span>
              <span class="step-pip-label">{{ step === 1 ? t('reservation.pickWorker') : step === 2 ? t('reservation.pickDate') : step === 3 ? t('reservation.pickTime') : step === 4 ? t('reservation.pickService') : t('reservation.details') }}</span>
            </div>
          </div>

          <div class="reservation-column">
            <article class="glass-panel reservation-stage">
              <h2>{{ t('reservation.pickWorker') }}</h2>
              <div class="worker-grid">
                <button
                  v-for="therapist in therapists"
                  :key="therapist.key"
                  class="worker-card"
                  :class="{ active: worker === therapist.key, disabled: therapist.booking_enabled === false && !store.isSuperuser }"
                  :disabled="therapist.booking_enabled === false && !store.isSuperuser"
                  @click="pickWorker(therapist.key)"
                >
                  <img :src="therapist.photo_small || therapist.photo" :alt="therapist.key" />
                  <strong>{{ therapist.key }}</strong>
                  <small v-if="therapist.booking_enabled === false" class="worker-card-note">
                    {{ locale === 'en' ? 'Online booking unavailable' : 'Online rezervácia nedostupná' }}
                  </small>
                </button>
              </div>
              <p v-if="currentTherapist && tr(currentTherapist.booking_note)" class="booking-notice booking-notice-inline">
                <i class="fa-solid fa-circle-info"></i> <span>{{ tr(currentTherapist.booking_note) }}</span>
              </p>
            </article>

            <article class="glass-panel reservation-stage" v-if="worker" id="res-step-date">
              <h2>{{ t('reservation.pickDate') }}</h2>
              <div class="booking-calendar-wrap" :class="{ loading: calendarLoading }">
                <div ref="calendarRoot" class="calendar-shell booking-calendar"></div>
                <div v-if="calendarLoading" class="calendar-loading-overlay" aria-live="polite" aria-busy="true">
                  <div class="calendar-loading-box">
                    <span class="calendar-spinner"></span>
                    <strong>{{ t('common.loading') }}</strong>
                    <span>{{ locale === 'sk' ? 'Načítavajú sa voľné termíny...' : 'Loading available dates...' }}</span>
                  </div>
                </div>
              </div>
              <div v-if="selectedDate" class="selection-pill">{{ formatDateInput(selectedDate) }}</div>
            </article>

            <article class="glass-panel reservation-stage" v-if="selectedDate" id="res-step-time">
              <h2>{{ t('reservation.pickTime') }}</h2>
              <div v-if="availableSlots.length" class="slot-grid">
                <button
                  v-for="slot in availableSlots"
                  :key="slot"
                  class="slot-button"
                  :class="{ active: selectedSlot === slot }"
                  @click="pickSlot(slot)"
                >
                  {{ slot }}
                </button>
              </div>
              <p v-else class="centered-copy">{{ t('reservation.noSlots') }}</p>
            </article>

            <article class="glass-panel reservation-stage" v-if="selectedSlot" id="res-step-service">
              <h2>{{ t('reservation.pickService') }}</h2>
              <div class="service-grid">
                <button
                  v-for="service in availableServices"
                  :key="service.id"
                  class="service-card"
                  :class="{ active: selectedServiceId === service.id }"
                  @click="chooseService(service)"
                >
                  <strong>{{ tr(service.name) }}</strong>
                  <span>{{ service.price }}</span>
                </button>
              </div>
            </article>

            <article class="glass-panel reservation-stage" v-if="currentStep >= 4" id="res-step-details">
              <h2>{{ t('reservation.details') }}</h2>

              <div v-if="store.isSuperuser" class="admin-customer-picker">
                <span class="field-label">{{ t('reservation.selectSavedPerson') }}</span>

                <!-- Selected chip -->
                <div v-if="selectedUser" class="user-selected-chip">
                  <span>{{ selectedUser.name_surname }}</span>
                  <button type="button" class="user-chip-clear" @click="clearSelectedUser()" :aria-label="t('reservation.clearSelection')">&#x2715;</button>
                </div>

                <!-- Dropdown search (shown when no user selected) -->
                <div v-else class="user-search-wrap">
                  <input
                    v-model.trim="userSearch"
                    type="text"
                    :placeholder="t('common.search')"
                    autocomplete="off"
                    @focus="userDropdownOpen = true"
                    @input="userDropdownOpen = true"
                    @blur="onUserSearchBlur()"
                  />
                  <div v-if="userDropdownOpen" class="user-dropdown">
                    <button
                      v-for="option in filteredUsers"
                      :key="option.id"
                      type="button"
                      class="user-dropdown-item"
                      @mousedown.prevent="fillUser(option)"
                    >{{ option.name_surname }}</button>
                    <div v-if="userSearch && !filteredUsers.length" class="user-dropdown-empty">
                      {{ t('reservation.noResults') }}
                    </div>
                  </div>
                </div>
              </div>

              <label class="field">
                <span>{{ t('reservation.nameSurname') }}*</span>
                <input v-model.trim="form.name_surname" type="text" />
              </label>

              <label class="field">
                <span>Email<span v-if="!store.isSuperuser">*</span></span>
                <input v-model.trim="form.email" type="email" />
              </label>

              <label class="field">
                <span>{{ t('reservation.phone') }}<span v-if="!store.isSuperuser">*</span></span>
                <input v-model.trim="form.phone" type="text" />
              </label>

              <label class="field">
                <span>{{ t('reservation.note') }}</span>
                <textarea v-model.trim="form.note" rows="4"></textarea>
              </label>

              <label v-if="needsConsent" class="consent-check">
                <input type="checkbox" v-model="consent" />
                <span v-if="locale === 'en'">
                  I agree to the <router-link to="/obchodne-podmienky/" target="_blank">terms and booking conditions</router-link>
                  and acknowledge the <router-link to="/ochrana-osobnych-udajov/" target="_blank">privacy policy</router-link>.*
                </span>
                <span v-else>
                  Súhlasím s <router-link to="/obchodne-podmienky/" target="_blank">obchodnými a rezervačnými podmienkami</router-link>
                  a beriem na vedomie <router-link to="/ochrana-osobnych-udajov/" target="_blank">spracovanie osobných údajov</router-link>.*
                </span>
              </label>

              <p class="form-helper">{{ t('reservation.formHint') }}</p>
              <p v-if="errorMessage" class="form-error">{{ errorMessage }}</p>

              <button class="btn btn-primary-strong wide-button" @click="submitReservation()">
                {{ t('reservation.finish') }}
              </button>
            </article>
          </div>
        </template>
      </div>
    </section>

    <!-- Pass (permanentka) info modal – content from the admin panel -->
    <div v-if="smInfoOpen && activePass" class="modal-shell" @click.self="closePass()">
      <div class="modal-card sm-info-card">
        <button type="button" class="modal-close" @click="closePass()" :aria-label="t('common.close')">
          <i class="fa-solid fa-xmark"></i>
        </button>

        <div class="sm-info-icon">
          <i class="fa-solid" :class="activePass.icon || 'fa-ticket'"></i>
        </div>

        <h2 class="sm-info-title">{{ tr(activePass.title) }}</h2>
        <p v-if="tr(activePass.subtitle)" class="sm-info-sub">{{ tr(activePass.subtitle) }}</p>

        <span class="sm-info-badge">{{ locale === 'en' ? 'PRICE LIST' : 'CENNÍK' }}</span>

        <div class="sm-price-table">
          <div v-for="(row, index) in activePass.rows" :key="index" class="sm-price-row">
            <span>{{ tr(row.label) }}</span>
            <span class="sm-price-tag">{{ row.price }}</span>
          </div>
        </div>

        <div v-if="activePass.notes && activePass.notes.length" class="sm-info-notes">
          <p v-for="(note, index) in activePass.notes" :key="index"><i class="fa-solid fa-circle-info"></i> {{ tr(note) }}</p>
        </div>

        <button type="button" class="btn btn-primary-strong" style="margin-top:0.5rem" @click="closePass()">
          {{ t('common.close') }}
        </button>
      </div>
    </div>
  `,
  methods: {
    formatDateInput,
  },
});
