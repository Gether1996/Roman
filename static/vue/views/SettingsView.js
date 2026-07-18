const { defineComponent, reactive, ref, onMounted } = Vue;
const { useI18n } = VueI18n;

import { fetchJSON } from '../utils/api.js';
import { formatDateInput } from '../utils/formatters.js';
import { store } from '../store.js';

const dayNames = [
  ['monday', 'Monday'],
  ['tuesday', 'Tuesday'],
  ['wednesday', 'Wednesday'],
  ['thursday', 'Thursday'],
  ['friday', 'Friday'],
  ['saturday', 'Saturday'],
  ['sunday', 'Sunday'],
];

function makeWorkerState() {
  return {
    days_ahead: 30,
    working_days: [],
    hours: {
      monday: { start: '08:00', end: '16:00' },
      tuesday: { start: '08:00', end: '16:00' },
      wednesday: { start: '08:00', end: '16:00' },
      thursday: { start: '08:00', end: '16:00' },
      friday: { start: '08:00', end: '16:00' },
      saturday: { start: '08:00', end: '16:00' },
      sunday: { start: '08:00', end: '16:00' },
    },
  };
}

export const SettingsView = defineComponent({
  name: 'SettingsView',
  setup() {
    const { t, locale } = useI18n();
    const loading = ref(true);
    const roman = reactive(makeWorkerState());
    const evka = reactive(makeWorkerState());
    const turnedOffDays = ref([]);
    const selectedRestrictionIds = ref([]);
    const showRestrictionForm = ref(false);
    const restrictionForm = reactive({
      worker: 'Roman',
      date_from: '',
      date_to: '',
      whole_day: true,
      time_from: '08:00',
      time_to: '12:00',
    });

    function applyWorkerState(target, source) {
      target.days_ahead = source.days_ahead;
      target.working_days = [...source.working_days];
      for (const [day] of dayNames) {
        target.hours[day].start = source.hours[day].start;
        target.hours[day].end = source.hours[day].end;
      }
    }

    async function loadSettings() {
      if (!store.isSuperuser) {
        loading.value = false;
        return;
      }

      loading.value = true;
      const data = await fetchJSON('/api/settings-bootstrap/');
      applyWorkerState(roman, data.roman);
      applyWorkerState(evka, data.evka);
      turnedOffDays.value = data.turned_off_days || [];
      loading.value = false;
    }

    function toggleWorkingDay(workerState, dayLabel) {
      if (workerState.working_days.includes(dayLabel)) {
        workerState.working_days = workerState.working_days.filter((day) => day !== dayLabel);
      } else {
        workerState.working_days = [...workerState.working_days, dayLabel];
      }
    }

    async function saveWorker(workerKey, workerState) {
      const body = {
        [`days_ahead_${workerKey}`]: workerState.days_ahead,
        [`selected_days_${workerKey}`]: workerState.working_days,
      };

      for (const [day] of dayNames) {
        body[`time_from_${workerKey}_${day}`] = workerState.hours[day].start;
        body[`time_to_${workerKey}_${day}`] = workerState.hours[day].end;
      }

      await fetchJSON('/save_settings/', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      await window.Swal.fire({
        icon: 'success',
        title: t('admin.settingsSaved'),
        confirmButtonColor: '#0f7e7a',
      });
    }

    async function addRestriction() {
      if (!restrictionForm.date_from || !restrictionForm.date_to) {
        await window.Swal.fire({
          icon: 'warning',
          title: locale.value === 'en' ? 'Please choose both dates.' : 'Prosím vyberte obidva dátumy.',
          confirmButtonColor: '#0f7e7a',
        });
        return;
      }
      if (restrictionForm.date_to < restrictionForm.date_from) {
        await window.Swal.fire({
          icon: 'warning',
          title: locale.value === 'en' ? 'End date is before start date.' : 'Dátum "do" je pred dátumom "od".',
          confirmButtonColor: '#0f7e7a',
        });
        return;
      }
      if (!restrictionForm.whole_day && restrictionForm.time_to <= restrictionForm.time_from) {
        await window.Swal.fire({
          icon: 'warning',
          title: locale.value === 'en' ? 'End time must be after start time.' : 'Čas "do" musí byť po čase "od".',
          confirmButtonColor: '#0f7e7a',
        });
        return;
      }

      try {
        await fetchJSON('/add_turned_off_day/', {
          method: 'POST',
          body: JSON.stringify({
            worker: restrictionForm.worker,
            date_from: restrictionForm.date_from,
            date_to: restrictionForm.date_to,
            whole_day: restrictionForm.whole_day,
            time_from: restrictionForm.whole_day ? null : restrictionForm.time_from,
            time_to: restrictionForm.whole_day ? null : restrictionForm.time_to,
          }),
        });
      } catch (error) {
        await window.Swal.fire({ icon: 'error', title: t('reservation.failed'), confirmButtonColor: '#0f7e7a' });
        return;
      }

      showRestrictionForm.value = false;
      restrictionForm.date_from = '';
      restrictionForm.date_to = '';
      restrictionForm.whole_day = true;
      await loadSettings();
    }

    async function removeRestriction(id) {
      const result = await window.Swal.fire({
        title: t('admin.deleteRestrictionConfirm'),
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: t('common.delete'),
        cancelButtonText: t('common.cancel'),
        confirmButtonColor: '#b83b5e',
      });
      if (!result.isConfirmed) return;
      await fetchJSON('/delete_turned_off_day/', {
        method: 'DELETE',
        body: JSON.stringify({ turnedOffDayId: id }),
      });
      await loadSettings();
    }

    async function removeSelectedRestrictions() {
      if (!selectedRestrictionIds.value.length) return;

      const count = selectedRestrictionIds.value.length;
      const result = await window.Swal.fire({
        title: locale.value === 'en'
          ? `Delete ${count} restriction${count > 1 ? 's' : ''}?`
          : `Vymazať ${count} obmedzeni${count === 1 ? 'e' : count < 5 ? 'á' : 'í'}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: t('admin.deleteSelected'),
        cancelButtonText: t('common.cancel'),
        confirmButtonColor: '#b83b5e',
      });
      if (!result.isConfirmed) return;

      await fetchJSON('/delete_turned_off_days/', {
        method: 'DELETE',
        body: JSON.stringify({ ids: selectedRestrictionIds.value }),
      });
      selectedRestrictionIds.value = [];
      await loadSettings();
    }

    const allSelected = Vue.computed(() =>
      turnedOffDays.value.length > 0 &&
      selectedRestrictionIds.value.length === turnedOffDays.value.length
    );

    function toggleSelectAll() {
      if (allSelected.value) {
        selectedRestrictionIds.value = [];
      } else {
        selectedRestrictionIds.value = turnedOffDays.value.map(item => String(item.id));
      }
    }

    // Open the native date/time picker (OS wheel on mobile) from anywhere on the field.
    function openPicker(event) {
      const input = event.currentTarget.querySelector('input') || event.currentTarget;
      if (input && typeof input.showPicker === 'function') {
        try { input.showPicker(); } catch (e) { /* ignore (not user-activated / unsupported) */ }
      }
    }

    onMounted(loadSettings);

    return {
      store,
      loading,
      roman,
      evka,
      turnedOffDays,
      selectedRestrictionIds,
      showRestrictionForm,
      restrictionForm,
      dayNames,
      formatDateInput,
      openPicker,
      toggleWorkingDay,
      saveWorker,
      addRestriction,
      removeRestriction,
      removeSelectedRestrictions,
      allSelected,
      toggleSelectAll,
      t,
      locale,
    };
  },
  template: `
    <section class="page-section container-shell">
      <div class="section-header">
        <span class="section-kicker">Admin</span>
        <h1>{{ t('admin.settingsTitle') }}</h1>
      </div>

      <div v-if="!store.isSuperuser" class="glass-panel centered-copy">
        <p>{{ t('common.unauthorized') }}</p>
        <router-link class="btn btn-primary-strong" to="/">{{ t('common.backHome') }}</router-link>
      </div>

      <div v-else-if="loading" class="glass-panel centered-copy">{{ t('common.loading') }}</div>

      <template v-else>
        <div class="settings-grid">
          <article
            v-for="w in [{ key: 'roman', state: roman, name: 'Roman' }, { key: 'evka', state: evka, name: 'Evka' }]"
            :key="w.key"
            class="glass-panel settings-card"
          >
            <div class="settings-card-head">
              <h2>
                <span class="worker-dot" :style="w.name === 'Evka' ? 'background:#db2777' : 'background:#0f7e7a'"></span>
                {{ w.name }}
              </h2>
              <button class="btn btn-primary-strong" @click="saveWorker(w.key, w.state)">{{ t('common.save') }}</button>
            </div>

            <label class="field">
              <span>{{ t('admin.daysAhead') }}</span>
              <input class="ctrl" v-model.number="w.state.days_ahead" type="number" min="1" max="365" />
            </label>

            <div class="working-day-row">
              <button
                v-for="[dayKey, dayLabel] in dayNames"
                :key="dayKey"
                class="day-toggle"
                :class="{ active: w.state.working_days.includes(dayLabel) }"
                @click="toggleWorkingDay(w.state, dayLabel)"
              >
                {{ dayLabel.slice(0, 3) }}
              </button>
            </div>

            <div class="settings-hours-grid">
              <div
                v-for="[dayKey, dayLabel] in dayNames"
                :key="dayKey"
                class="hours-row"
                :class="{ off: !w.state.working_days.includes(dayLabel) }"
              >
                <strong>{{ dayLabel }}</strong>
                <div class="hours-fields">
                  <input class="ctrl ctrl-time" v-model="w.state.hours[dayKey].start" type="time" @click="openPicker($event)" />
                  <span class="hours-dash">–</span>
                  <input class="ctrl ctrl-time" v-model="w.state.hours[dayKey].end" type="time" @click="openPicker($event)" />
                </div>
              </div>
            </div>
          </article>
        </div>

        <article class="glass-panel settings-card">
          <div class="settings-card-head">
            <h2>{{ t('admin.restrictionsTitle') }}</h2>
            <div class="inline-actions">
              <button class="btn btn-secondary-soft" @click="showRestrictionForm = !showRestrictionForm">
                <i class="fa-solid" :class="showRestrictionForm ? 'fa-xmark' : 'fa-plus'"></i>
                {{ t('admin.addRestriction') }}
              </button>
              <button class="btn btn-danger-soft" @click="removeSelectedRestrictions()" :disabled="!selectedRestrictionIds.length">
                <i class="fa-solid fa-trash"></i>
                {{ t('admin.deleteSelected') }}
                <span v-if="selectedRestrictionIds.length" class="del-count">{{ selectedRestrictionIds.length }}</span>
              </button>
            </div>
          </div>

          <div v-if="showRestrictionForm" class="restriction-form">
            <div class="rf-field">
              <label>{{ t('admin.worker') }}</label>
              <select class="ctrl ctrl-select" v-model="restrictionForm.worker">
                <option value="Roman">Roman</option>
                <option value="Evka">Evka</option>
              </select>
            </div>

            <div class="rf-field">
              <label>{{ locale === 'en' ? 'From' : 'Od' }}</label>
              <div class="date-field" @click="openPicker($event)">
                <input class="ctrl date-field-native" type="date" v-model="restrictionForm.date_from" />
                <span class="date-field-display" :class="{ placeholder: !restrictionForm.date_from }">{{ restrictionForm.date_from ? formatDateInput(restrictionForm.date_from) : 'DD.MM.RRRR' }}</span>
              </div>
            </div>

            <div class="rf-field">
              <label>{{ locale === 'en' ? 'To' : 'Do' }}</label>
              <div class="date-field" @click="openPicker($event)">
                <input class="ctrl date-field-native" type="date" v-model="restrictionForm.date_to" />
                <span class="date-field-display" :class="{ placeholder: !restrictionForm.date_to }">{{ restrictionForm.date_to ? formatDateInput(restrictionForm.date_to) : 'DD.MM.RRRR' }}</span>
              </div>
            </div>

            <div class="rf-field rf-field-check">
              <label class="switch-inline">
                <input type="checkbox" v-model="restrictionForm.whole_day" />
                <span>{{ t('admin.wholeDay') }}</span>
              </label>
            </div>

            <div class="rf-field" v-if="!restrictionForm.whole_day">
              <label>{{ locale === 'en' ? 'From (time)' : 'Od (čas)' }}</label>
              <input class="ctrl ctrl-time" type="time" v-model="restrictionForm.time_from" @click="openPicker($event)" />
            </div>
            <div class="rf-field" v-if="!restrictionForm.whole_day">
              <label>{{ locale === 'en' ? 'To (time)' : 'Do (čas)' }}</label>
              <input class="ctrl ctrl-time" type="time" v-model="restrictionForm.time_to" @click="openPicker($event)" />
            </div>

            <div class="rf-field rf-actions">
              <button class="btn btn-primary-strong wide-button" @click="addRestriction()">{{ t('common.save') }}</button>
            </div>
          </div>

          <div class="restriction-table-wrap">
            <table class="restriction-table">
              <thead>
                <tr>
                  <th class="rt-check">
                    <input type="checkbox" :checked="allSelected" @change="toggleSelectAll()" :indeterminate.prop="selectedRestrictionIds.length > 0 && !allSelected" :title="t('admin.selectAll')" />
                  </th>
                  <th>{{ t('admin.worker') }}</th>
                  <th>{{ t('admin.date') }}</th>
                  <th>{{ locale === 'en' ? 'Type' : 'Typ' }}</th>
                  <th class="rt-action"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!turnedOffDays.length">
                  <td colspan="5" class="rt-empty">{{ locale === 'en' ? 'No restrictions yet' : 'Zatiaľ žiadne obmedzenia' }}</td>
                </tr>
                <tr
                  v-for="item in turnedOffDays"
                  :key="item.id"
                  :class="{ selected: selectedRestrictionIds.includes(String(item.id)) }"
                >
                  <td class="rt-check">
                    <input type="checkbox" v-model="selectedRestrictionIds" :value="String(item.id)" />
                  </td>
                  <td class="rt-worker">
                    <span class="worker-dot" :style="item.worker === 'Evka' ? 'background:#db2777' : 'background:#0f7e7a'"></span>
                    {{ item.worker }}
                  </td>
                  <td class="rt-date">{{ item.date }}</td>
                  <td>
                    <span class="rt-type-badge" :class="item.whole_day ? 'whole' : 'partial'">
                      {{ item.whole_day ? t('admin.wholeDay') : item.time_range }}
                    </span>
                  </td>
                  <td class="rt-action">
                    <button class="btn-icon btn-icon--del" :title="t('common.delete')" @click="removeRestriction(item.id)">
                      <i class="fa-solid fa-trash"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>
      </template>
    </section>
  `,
});
