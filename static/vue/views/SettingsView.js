const { defineComponent, reactive, ref, onMounted } = Vue;
const { useI18n } = VueI18n;

import { fetchJSON } from '../utils/api.js';
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
        title: locale.value === 'en' ? 'Settings saved.' : 'Nastavenia uložené.',
        confirmButtonColor: '#0f7e7a',
      });
    }

    async function addRestriction() {
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
        cancelButtonText: locale.value === 'en' ? 'Cancel' : 'Zrušiť',
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
        cancelButtonText: locale.value === 'en' ? 'Cancel' : 'Zrušiť',
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
          <article class="glass-panel settings-card">
            <div class="settings-card-head">
              <h2>Roman</h2>
              <button class="btn btn-primary-strong" @click="saveWorker('roman', roman)">{{ t('common.save') }}</button>
            </div>
            <label class="field">
              <span>{{ t('admin.daysAhead') }}</span>
              <input v-model.number="roman.days_ahead" type="number" min="1" />
            </label>
            <div class="working-day-row">
              <button
                v-for="[dayKey, dayLabel] in dayNames"
                :key="dayKey"
                class="day-toggle"
                :class="{ active: roman.working_days.includes(dayLabel) }"
                @click="toggleWorkingDay(roman, dayLabel)"
              >
                {{ dayLabel.slice(0, 3) }}
              </button>
            </div>
            <div class="settings-hours-grid">
              <div v-for="[dayKey, dayLabel] in dayNames" :key="dayKey" class="hours-row">
                <strong>{{ dayLabel }}</strong>
                <input v-model="roman.hours[dayKey].start" type="time" />
                <input v-model="roman.hours[dayKey].end" type="time" />
              </div>
            </div>
          </article>

          <article class="glass-panel settings-card">
            <div class="settings-card-head">
              <h2>Evka</h2>
              <button class="btn btn-primary-strong" @click="saveWorker('evka', evka)">{{ t('common.save') }}</button>
            </div>
            <label class="field">
              <span>{{ t('admin.daysAhead') }}</span>
              <input v-model.number="evka.days_ahead" type="number" min="1" />
            </label>
            <div class="working-day-row">
              <button
                v-for="[dayKey, dayLabel] in dayNames"
                :key="dayKey"
                class="day-toggle"
                :class="{ active: evka.working_days.includes(dayLabel) }"
                @click="toggleWorkingDay(evka, dayLabel)"
              >
                {{ dayLabel.slice(0, 3) }}
              </button>
            </div>
            <div class="settings-hours-grid">
              <div v-for="[dayKey, dayLabel] in dayNames" :key="dayKey" class="hours-row">
                <strong>{{ dayLabel }}</strong>
                <input v-model="evka.hours[dayKey].start" type="time" />
                <input v-model="evka.hours[dayKey].end" type="time" />
              </div>
            </div>
          </article>
        </div>

        <article class="glass-panel settings-card">
          <div class="settings-card-head">
            <div class="restriction-head-left">
              <label class="restriction-select-all" :title="t('admin.selectAll')">
                <input type="checkbox" :checked="allSelected" @change="toggleSelectAll()" :indeterminate.prop="selectedRestrictionIds.length > 0 && !allSelected" />
              </label>
              <h2>{{ t('admin.restrictionsTitle') }}</h2>
            </div>
            <div class="inline-actions">
              <button class="btn btn-secondary-soft" @click="showRestrictionForm = !showRestrictionForm">{{ t('admin.addRestriction') }}</button>
              <button class="btn btn-danger-soft" @click="removeSelectedRestrictions()" :disabled="!selectedRestrictionIds.length">
                <i class="fa-solid fa-trash"></i>
                {{ t('admin.deleteSelected') }}
                <span v-if="selectedRestrictionIds.length" class="del-count">{{ selectedRestrictionIds.length }}</span>
              </button>
            </div>
          </div>

          <div v-if="showRestrictionForm" class="restriction-form">
            <select v-model="restrictionForm.worker">
              <option value="Roman">Roman</option>
              <option value="Evka">Evka</option>
            </select>
            <input v-model="restrictionForm.date_from" type="date" />
            <input v-model="restrictionForm.date_to" type="date" />
            <label class="checkbox-inline">
              <input v-model="restrictionForm.whole_day" type="checkbox" />
              <span>{{ t('admin.wholeDay') }}</span>
            </label>
            <input v-if="!restrictionForm.whole_day" v-model="restrictionForm.time_from" type="time" />
            <input v-if="!restrictionForm.whole_day" v-model="restrictionForm.time_to" type="time" />
            <button class="btn btn-primary-strong" @click="addRestriction()">{{ t('common.save') }}</button>
          </div>

          <div class="stack-grid">
            <article v-for="item in turnedOffDays" :key="item.id" class="restriction-row">
              <label class="checkbox-inline">
                <input v-model="selectedRestrictionIds" :value="String(item.id)" type="checkbox" />
                <span>{{ item.worker }}</span>
              </label>
              <strong>{{ item.date }}</strong>
              <span>{{ item.whole_day ? t('admin.wholeDay') : item.time_range }}</span>
              <button class="btn btn-danger-soft" @click="removeRestriction(item.id)">{{ t('common.delete') }}</button>
            </article>
          </div>
        </article>
      </template>
    </section>
  `,
});
