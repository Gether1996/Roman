const { defineComponent, ref, reactive, computed, onMounted, onBeforeUnmount, watch, nextTick } = Vue;
const { useI18n } = VueI18n;

import { fetchJSON, localizedBackendMessage } from '../utils/api.js';
import { formatDateInput, normalizeText } from '../utils/formatters.js';
import { store } from '../store.js';

const serviceCatalog = {
  Roman: [
    { id: '30-basic', duration: 30, price: '25 EUR', backendName: '30 min masáž', sk: '30 min masáž', en: '30 min massage' },
    { id: '45-basic', duration: 45, price: '30 EUR', backendName: '45 min masáž', sk: '45 min masáž', en: '45 min massage' },
    { id: '45-sm', duration: 45, price: '20 EUR', backendName: '45 min SM systém', sk: '45 min SM individualne cvičenie', en: '45 min SM individual training' },
    { id: '60-basic', duration: 60, price: '35 EUR', backendName: '60 min masáž', sk: '60 min masáž', en: '60 min massage' },
    { id: '90-basic', duration: 90, price: '60 EUR', backendName: '90 min masáž', sk: '90 min masáž', en: '90 min massage' },
    { id: '90-sm', duration: 90, price: '60 EUR', backendName: '90 min masáž + SM systém', sk: '90 min masáž + SM systém', en: '90 min massage + SM system' },
    { id: '120-basic', duration: 120, price: '80 EUR', backendName: '120 min masáž', sk: '120 min masáž', en: '120 min massage' },
  ],
  Evka: [
    { id: '30-basic', duration: 30, price: '25 EUR', backendName: '30 min masáž', sk: '30 min masáž', en: '30 min massage' },
    { id: '45-basic', duration: 45, price: '30 EUR', backendName: '45 min masáž', sk: '45 min masáž', en: '45 min massage' },
    { id: '60-basic', duration: 60, price: '35 EUR', backendName: '60 min masáž', sk: '60 min masáž', en: '60 min massage' },
    { id: '90-basic', duration: 90, price: '60 EUR', backendName: '90 min masáž', sk: '90 min masáž', en: '90 min massage' },
    { id: '120-basic', duration: 120, price: '80 EUR', backendName: '120 min masáž', sk: '120 min masáž', en: '120 min massage' },
  ],
};

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
    const errorMessage = ref('');
    const form = reactive({
      name_surname: '',
      email: '',
      phone: '',
      note: '',
    });

    let calendar = null;

    const filteredUsers = computed(() => {
      const query = normalizeText(userSearch.value);
      if (!query) {
        return userOptions.value.slice(0, 8);
      }
      return userOptions.value.filter((option) => normalizeText(option.name_surname).includes(query)).slice(0, 8);
    });

    const availableServices = computed(() => {
      if (!worker.value) {
        return [];
      }
      return (serviceCatalog[worker.value] || []).filter((service) => availableDurations.value.includes(service.duration));
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
    }

    function markDisabledDays() {
      if (!calendarRoot.value) {
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
        [t('admin.service'), `${selectedService.value[locale.value]} - ${selectedService.value.price}`],
        [t('reservation.nameSurname'), form.name_surname],
        ['Email', form.email || '-'],
        [t('reservation.phone'), form.phone || '-'],
        [t('reservation.worker'), worker.value],
      ];

      const result = await window.Swal.fire({
        title: t('reservation.summary'),
        html: `
          <div class="summary-list">
            ${summaryRows.map(([label, value]) => `<div class="summary-row"><strong>${label}</strong><span>${value}</span></div>`).join('')}
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
          }),
        });

        await window.Swal.fire({
          icon: 'success',
          title: localizedBackendMessage(response, store.language, t('reservation.success')),
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

    return {
      store,
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
          <h1>{{ t('reservation.title') }}</h1>
          <p>{{ t('reservation.subtitle') }}</p>
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
                <button class="worker-card" :class="{ active: worker === 'Roman' }" @click="pickWorker('Roman')">
                  <img src="/static/images/roman-mini.jpg" alt="Roman" />
                  <strong>Roman</strong>
                </button>
                <button class="worker-card" :class="{ active: worker === 'Evka' }" @click="pickWorker('Evka')">
                  <img src="/static/images/evka-mini.jpg" alt="Evka" />
                  <strong>Evka</strong>
                </button>
              </div>
            </article>

            <article class="glass-panel reservation-stage" v-if="worker" id="res-step-date">
              <h2>{{ t('reservation.pickDate') }}</h2>
              <div ref="calendarRoot" class="calendar-shell booking-calendar"></div>
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
                  @click="() => { selectedServiceId = service.id; if (service.id === '45-sm') { smInfoOpen = true; } else { $nextTick(() => scrollToNext('res-step-details')); } }"
                >
                  <strong>{{ service[locale] }}</strong>
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

    <!-- SM system info modal -->
    <div v-if="smInfoOpen" class="modal-shell" @click.self="smInfoOpen = false; $nextTick(() => scrollToNext('res-step-details'))">
      <div class="modal-card sm-info-card">
        <button type="button" class="modal-close" @click="smInfoOpen = false; $nextTick(() => scrollToNext('res-step-details'))" :aria-label="t('common.close')">
          <i class="fa-solid fa-xmark"></i>
        </button>

        <div class="sm-info-icon">
          <i class="fa-solid fa-arrows-spin"></i>
        </div>

        <h2 class="sm-info-title">{{ locale === 'en' ? 'SM system — pass' : 'SM systém „permanentka"' }}</h2>
        <p class="sm-info-sub">{{ locale === 'en' ? 'Current pass options' : 'Aktuálne možnosti permanentky' }}</p>

        <span class="sm-info-badge">{{ locale === 'en' ? 'PRICE LIST' : 'CENNÍK' }}</span>

        <div class="sm-price-table">
          <div class="sm-price-row">
            <span>{{ locale === 'en' ? 'Single entry' : 'Jeden vstup' }}</span>
            <span class="sm-price-tag">20 €</span>
          </div>
          <div class="sm-price-row">
            <span>{{ locale === 'en' ? '3 entries' : '3 vstupy' }}</span>
            <span class="sm-price-tag">45 €</span>
          </div>
          <div class="sm-price-row">
            <span>{{ locale === 'en' ? '5 entries' : '5 vstupov' }}</span>
            <span class="sm-price-tag">75 €</span>
          </div>
        </div>

        <div class="sm-info-notes">
          <p><i class="fa-solid fa-circle-info"></i> {{ locale === 'en' ? 'On your first visit we will issue you a physical pass card.' : 'Pri prvej návšteve Vám vystavíme papierovú permanentku.' }}</p>
          <p><i class="fa-solid fa-phone"></i> {{ locale === 'en' ? 'This notice is informational. For more details, feel free to contact us in person or by phone.' : 'Toto oznámenie má informatívny charakter. Podrobnejšie informácie vám radi poskytneme osobne alebo telefonicky.' }}</p>
        </div>

        <button type="button" class="btn btn-primary-strong" style="margin-top:0.5rem" @click="smInfoOpen = false; $nextTick(() => scrollToNext('res-step-details'))">
          {{ t('common.close') }}
        </button>
      </div>
    </div>
  `,
  methods: {
    formatDateInput,
  },
});
