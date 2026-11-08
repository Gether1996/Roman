const { defineComponent, ref, reactive, computed, onMounted } = Vue;

import { api, toast, toastError, confirmDialog, fmtDate, relativeDay, weekday, todayISO, plural, clone } from '../ui.js';
import { adminComponents } from '../components.js';
import { store } from '../../store.js';

const DAYS = [
  ['monday', 'Monday', 'Pondelok'],
  ['tuesday', 'Tuesday', 'Utorok'],
  ['wednesday', 'Wednesday', 'Streda'],
  ['thursday', 'Thursday', 'Štvrtok'],
  ['friday', 'Friday', 'Piatok'],
  ['saturday', 'Saturday', 'Sobota'],
  ['sunday', 'Sunday', 'Nedeľa'],
];

export const ScheduleView = defineComponent({
  name: 'ScheduleView',
  components: { ...adminComponents },
  setup() {
    const loading = ref(true);
    const workers = reactive({ Roman: null, Evka: null });
    const originals = reactive({ Roman: '', Evka: '' });
    const saving = reactive({ Roman: false, Evka: false });
    const offDays = ref([]);
    const selected = ref([]);
    const showPast = ref(false);
    const offWorker = ref('');
    const formOpen = ref(false);
    const form = reactive({ worker: 'Roman', date_from: '', date_to: '', whole_day: true, time_from: '08:00', time_to: '12:00', both: false });

    const therapists = computed(() => store.content?.therapists || []);
    const colorOf = (key) => therapists.value.find((t) => t.key === key)?.color || '#0f7e7a';

    const visibleOff = computed(() => offDays.value
      .filter((d) => showPast.value || d.date_iso >= todayISO())
      .filter((d) => !offWorker.value || d.worker === offWorker.value)
      .sort((a, b) => (a.date_iso + a.time_from).localeCompare(b.date_iso + b.time_from)));

    function isDirty(key) {
      return workers[key] && JSON.stringify(workers[key]) !== originals[key];
    }

    async function load() {
      try {
        const data = await api.get('/api/settings-bootstrap/');
        workers.Roman = data.roman;
        workers.Evka = data.evka;
        originals.Roman = JSON.stringify(data.roman);
        originals.Evka = JSON.stringify(data.evka);
        offDays.value = data.turned_off_days || [];
        selected.value = [];
      } catch (error) {
        toastError(error, 'Rozvrh sa nepodarilo načítať.');
      } finally {
        loading.value = false;
      }
    }

    function toggleDay(key, label) {
      const list = workers[key].working_days;
      workers[key].working_days = list.includes(label) ? list.filter((d) => d !== label) : [...list, label];
    }

    function copyFrom(target, source) {
      workers[target].working_days = [...workers[source].working_days];
      workers[target].hours = clone(workers[source].hours);
    }

    async function save(key) {
      const state = workers[key];
      for (const [day, label, name] of DAYS) {
        if (state.working_days.includes(label) && state.hours[day].end <= state.hours[day].start) {
          toast(`${key}: ${name} – koniec musí byť po začiatku.`, 'error');
          return;
        }
      }
      const slug = key.toLowerCase();
      const body = { [`days_ahead_${slug}`]: state.days_ahead, [`selected_days_${slug}`]: state.working_days };
      DAYS.forEach(([day]) => {
        body[`time_from_${slug}_${day}`] = state.hours[day].start;
        body[`time_to_${slug}_${day}`] = state.hours[day].end;
      });
      saving[key] = true;
      try {
        await api.post('/save_settings/', body);
        originals[key] = JSON.stringify(state);
        toast(`Rozvrh – ${key} bol uložený.`);
      } catch (error) {
        toastError(error, 'Uloženie zlyhalo.');
      } finally {
        saving[key] = false;
      }
    }

    function openForm() {
      Object.assign(form, { worker: 'Roman', date_from: todayISO(), date_to: todayISO(), whole_day: true, time_from: '08:00', time_to: '12:00', both: false });
      formOpen.value = true;
    }

    async function addOff() {
      if (!form.date_from || !form.date_to) return toast('Vyberte dátum od a do.', 'error');
      if (form.date_to < form.date_from) return toast('Dátum „do“ je pred dátumom „od“.', 'error');
      if (!form.whole_day && form.time_to <= form.time_from) return toast('Čas „do“ musí byť po čase „od“.', 'error');
      const targets = form.both ? ['Roman', 'Evka'] : [form.worker];
      try {
        for (const worker of targets) {
          await api.post('/add_turned_off_day/', {
            worker, date_from: form.date_from, date_to: form.date_to, whole_day: form.whole_day,
            time_from: form.whole_day ? null : form.time_from, time_to: form.whole_day ? null : form.time_to,
          });
        }
        formOpen.value = false;
        toast('Voľno bolo pridané. V týchto časoch sa klienti nebudú môcť objednať.');
        load();
      } catch (error) {
        toastError(error, 'Voľno sa nepodarilo pridať.');
      }
    }

    async function removeOne(item) {
      if (!(await confirmDialog({ title: 'Odstrániť voľno?', text: `${item.worker}, ${fmtDate(item.date_iso)}${item.whole_day ? '' : ', ' + item.time_from + '–' + item.time_to}`, confirm: 'Odstrániť', danger: true }))) return;
      try {
        await api.del('/delete_turned_off_day/', { turnedOffDayId: item.id });
        toast('Voľno bolo odstránené.');
        load();
      } catch (error) { toastError(error); }
    }

    async function removeSelected() {
      const n = selected.value.length;
      if (!n || !(await confirmDialog({ title: `Odstrániť ${n} ${plural(n, 'záznam', 'záznamy', 'záznamov')}?`, confirm: 'Odstrániť', danger: true }))) return;
      try {
        await api.del('/delete_turned_off_days/', { ids: selected.value });
        toast('Vybrané voľno bolo odstránené.');
        load();
      } catch (error) { toastError(error); }
    }

    onMounted(load);

    return {
      loading, workers, saving, offDays, selected, showPast, offWorker, formOpen, form, visibleOff, therapists, DAYS,
      colorOf, isDirty, toggleDay, copyFrom, save, openForm, addOff, removeOne, removeSelected,
      fmtDate, relativeDay, weekday, todayISO,
    };
  },
  template: `
    <div>
      <a-page-head title="Rozvrh a voľno" subtitle="Pracovné hodiny určujú, kedy si klienti môžu online rezervovať termín. Voľno (dovolenka, lekár…) dané časy zablokuje." >
        <button class="adm-btn is-primary" @click="openForm"><i class="fa-solid fa-umbrella-beach"></i> Pridať voľno</button>
      </a-page-head>

      <div v-if="loading" class="adm-loading"><i class="fa-solid fa-spinner fa-spin"></i> Načítavam…</div>
      <template v-else>
        <div class="adm-grid-2" style="align-items:start">
          <a-card v-for="key in ['Roman', 'Evka']" :key="key" :title="key" icon="fa-user-clock">
            <template #actions>
              <button class="adm-btn is-ghost is-sm" @click="copyFrom(key, key === 'Roman' ? 'Evka' : 'Roman')" :title="'Skopírovať hodiny od ' + (key === 'Roman' ? 'Evky' : 'Romana')"><i class="fa-regular fa-copy"></i></button>
              <button class="adm-btn is-primary is-sm" :disabled="!isDirty(key) || saving[key]" @click="save(key)">
                <i class="fa-solid" :class="saving[key] ? 'fa-spinner fa-spin' : 'fa-floppy-disk'"></i> Uložiť
              </button>
            </template>
            <p v-if="isDirty(key)" class="adm-alert is-warning"><i class="fa-solid fa-circle-exclamation"></i> Neuložené zmeny v rozvrhu.</p>
            <a-field label="Koľko dní dopredu sa dá rezervovať online" hint="Napr. 30 = klienti vidia voľné termíny na najbližších 30 dní.">
              <input v-model.number="workers[key].days_ahead" type="number" min="1" max="365" style="max-width:140px" />
            </a-field>
            <div class="adm-week">
              <div v-for="[day, label, name] in DAYS" :key="day" class="adm-week-row" :class="{ 'is-off': !workers[key].working_days.includes(label) }">
                <a-toggle :model-value="workers[key].working_days.includes(label)" @update:model-value="toggleDay(key, label)" :label="name" />
                <div class="adm-week-hours">
                  <time-input v-model="workers[key].hours[day].start" />
                  <span class="adm-muted">–</span>
                  <time-input v-model="workers[key].hours[day].end" />
                  <span v-if="!workers[key].working_days.includes(label)" class="adm-badge is-muted">nepracuje</span>
                </div>
              </div>
            </div>
          </a-card>
        </div>

        <a-card title="Voľno a obmedzenia" icon="fa-umbrella-beach" description="Celé dni alebo len časť dňa, kedy terapeut nepracuje. Existujúce rezervácie sa tým nezrušia.">
          <template #actions>
            <button v-if="selected.length" class="adm-btn is-soft is-danger is-sm" @click="removeSelected"><i class="fa-solid fa-trash"></i> Odstrániť vybrané ({{ selected.length }})</button>
          </template>
          <div class="adm-toolbar">
            <div class="adm-btn-group">
              <button :class="{ active: !offWorker }" @click="offWorker = ''">Obaja</button>
              <button v-for="t in therapists" :key="t.key" :class="{ active: offWorker === t.key }" @click="offWorker = t.key">{{ t.key }}</button>
            </div>
            <label class="adm-en-switch"><input type="checkbox" v-model="showPast" /> Zobraziť aj minulé</label>
          </div>
          <a-empty v-if="!visibleOff.length" icon="fa-calendar-check" text="Žiadne naplánované voľno." />
          <table v-else class="adm-table adm-table-cards">
            <thead><tr><th style="width:36px"></th><th>Dátum</th><th>Terapeut</th><th>Rozsah</th><th></th></tr></thead>
            <tbody>
              <tr v-for="item in visibleOff" :key="item.id" :style="{ opacity: item.date_iso < todayISO() ? .55 : 1 }">
                <td><input type="checkbox" v-model="selected" :value="item.id" aria-label="Vybrať" /></td>
                <td><span class="adm-strong">{{ fmtDate(item.date_iso) }}</span> <span class="adm-muted">{{ weekday(item.date_iso) }}</span></td>
                <td><span class="adm-dot" :style="{ background: colorOf(item.worker) }"></span> {{ item.worker }}</td>
                <td><span class="adm-badge" :class="item.whole_day ? 'is-pending' : 'is-blue'">{{ item.whole_day ? 'Celý deň' : item.time_from + ' – ' + item.time_to }}</span></td>
                <td class="adm-td-actions"><button class="adm-icon-btn is-danger" title="Odstrániť" @click="removeOne(item)"><i class="fa-solid fa-trash"></i></button></td>
              </tr>
            </tbody>
          </table>
        </a-card>
      </template>

      <a-modal v-if="formOpen" title="Pridať voľno" @close="formOpen = false">
        <a-field label="Terapeut">
          <div class="adm-btn-group">
            <button v-for="w in ['Roman', 'Evka']" :key="w" :class="{ active: !form.both && form.worker === w }" @click="form.worker = w; form.both = false">{{ w }}</button>
            <button :class="{ active: form.both }" @click="form.both = true">Obaja</button>
          </div>
        </a-field>
        <div class="adm-grid-2">
          <a-field label="Od dátumu"><date-input v-model="form.date_from" :min="todayISO()" @update:model-value="v => { if (!form.date_to || form.date_to < v) form.date_to = v }" /></a-field>
          <a-field label="Do dátumu (vrátane)"><date-input v-model="form.date_to" :min="form.date_from" /></a-field>
        </div>
        <a-toggle v-model="form.whole_day" label="Celý deň" hint="Vypnite, ak je voľno len na časť dňa (napr. lekár 10:00 – 12:00)." />
        <div v-if="!form.whole_day" class="adm-grid-2">
          <a-field label="Od"><time-input v-model="form.time_from" /></a-field>
          <a-field label="Do"><time-input v-model="form.time_to" /></a-field>
        </div>
        <template #footer>
          <button class="adm-btn is-soft" @click="formOpen = false">Zrušiť</button>
          <button class="adm-btn is-primary" @click="addOff"><i class="fa-solid fa-check"></i> Pridať voľno</button>
        </template>
      </a-modal>
    </div>
  `,
});
