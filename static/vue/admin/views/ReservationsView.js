const { defineComponent, ref, reactive, computed, watch, onMounted } = Vue;

import {
  api, ui, toast, toastError, confirmDialog, promptDialog, errorMessage,
  fmtDate, fmtDateTime, relativeDay, weekday, todayISO, addDaysISO, plural, formatPrice, minutesLabel, STATUS_META,
} from '../ui.js';
import { adminComponents } from '../components.js';
import { loadContent, contentState } from '../useContent.js';
import { store } from '../../store.js';
import { normalizeText } from '../../utils/formatters.js';

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ------------------------------------------------------------------ detail */
const ReservationDetail = defineComponent({
  name: 'ReservationDetail',
  components: { ...adminComponents },
  props: { id: { type: [String, Number], required: true } },
  emits: ['close', 'changed'],
  setup(props, { emit }) {
    const loading = ref(true);
    const reservation = ref(null);
    const history = ref([]);
    const editing = ref(false);
    const saving = ref(false);
    const form = reactive({});
    const conflicts = ref([]);

    const services = computed(() => (contentState.content?.services || []));
    const workerColors = computed(() => Object.fromEntries((store.content?.therapists || []).map((t) => [t.key, t.color])));

    async function load() {
      loading.value = true;
      try {
        const data = await api.get(`/api/admin/reservations/${props.id}/`);
        reservation.value = data.reservation;
        history.value = data.history || [];
      } catch (error) {
        toastError(error, 'Rezerváciu sa nepodarilo načítať.');
        emit('close');
      } finally {
        loading.value = false;
      }
    }

    function startEdit() {
      const r = reservation.value;
      Object.assign(form, {
        date: r.date, time_from: r.time_from, duration: r.duration, worker: r.worker,
        massage_name: r.massage_name, name_surname: r.name_surname, email: r.email, phone_number: r.phone_number,
        special_request: r.special_request, personal_note: r.personal_note, notify: !!r.email,
      });
      conflicts.value = [];
      editing.value = true;
    }

    function pickService(event) {
      const service = services.value.find((s) => s.id === event.target.value);
      if (!service) return;
      form.massage_name = service.backend_name;
      form.duration = service.duration;
    }

    const moved = computed(() => editing.value && reservation.value && (
      form.date !== reservation.value.date || form.time_from !== reservation.value.time_from
      || Number(form.duration) !== reservation.value.duration || form.worker !== reservation.value.worker));

    async function save(force = false) {
      saving.value = true;
      try {
        const data = await api.post(`/api/admin/reservations/${props.id}/update/`, { ...form, force });
        reservation.value = data.reservation;
        editing.value = false;
        conflicts.value = [];
        toast(data.mail_sent ? 'Zmeny uložené, klientovi bol odoslaný e-mail so zmenou.' : 'Zmeny boli uložené.');
        emit('changed');
      } catch (error) {
        if (error.status === 409) {
          conflicts.value = error.data?.conflicts || [];
        }
        toastError(error, 'Uloženie zlyhalo.');
      } finally {
        saving.value = false;
      }
    }

    async function approve() {
      const r = reservation.value;
      if (!(await confirmDialog({ title: 'Schváliť rezerváciu?', text: r.email ? `Klientovi príde potvrdenie na ${r.email}.` : 'Rezervácia nemá e-mail, klient nedostane potvrdenie.', confirm: 'Schváliť' }))) return;
      try {
        await api.post('/approve_reservation/', { id: r.id });
        toast('Rezervácia bola schválená.');
        await load();
        emit('changed');
      } catch (error) { toastError(error); }
    }

    async function cancel() {
      const r = reservation.value;
      const note = await promptDialog({
        title: 'Zrušiť rezerváciu?',
        label: r.email ? 'Správa pre klienta – príde mu e-mailom (nepovinné)' : 'Interná poznámka (nepovinné)',
        confirm: 'Zrušiť rezerváciu', textarea: true, value: r.personal_note || '',
      });
      if (note === null) return;
      try {
        await api.del('/deactivate_reservation_by_admin/', { id: r.id, note });
        toast('Rezervácia bola zrušená, termín je opäť voľný.');
        await load();
        emit('changed');
      } catch (error) { toastError(error); }
    }

    async function remove() {
      const r = reservation.value;
      if (!(await confirmDialog({ title: 'Natrvalo vymazať rezerváciu?', text: `${r.name_surname}, ${fmtDate(r.date)} ${r.time_from}. Túto akciu nie je možné vrátiť. Ak chcete len uvoľniť termín, použite radšej „Zrušiť“.`, confirm: 'Vymazať natrvalo', danger: true, icon: 'warning' }))) return;
      try {
        await api.del('/delete_reservation/', { id: r.id });
        toast('Rezervácia bola vymazaná.');
        emit('changed');
        emit('close');
      } catch (error) { toastError(error); }
    }

    async function resend() {
      const r = reservation.value;
      if (!r.email) return;
      if (!(await confirmDialog({ title: 'Znovu odoslať potvrdenie?', text: `Potvrdzovací e-mail sa odošle na ${r.email}.`, confirm: 'Odoslať' }))) return;
      try {
        const data = await api.post('/resend_confirmation/', { id: r.id });
        toast(data.message_sk || 'Potvrdenie bolo odoslané.');
      } catch (error) { toastError(error); }
    }

    async function editNote() {
      const r = reservation.value;
      const note = await promptDialog({ title: 'Interná poznámka', label: 'Vidíte ju len vy, klient nie.', value: r.personal_note || '', textarea: true });
      if (note === null) return;
      try {
        await api.post('/add_personal_note/', { id: r.id, note });
        r.personal_note = note;
        toast('Poznámka bola uložená.');
        emit('changed');
      } catch (error) { toastError(error); }
    }

    loadContent().catch(() => null);
    onMounted(load);

    return {
      loading, reservation, history, editing, saving, form, conflicts, services, workerColors, moved,
      startEdit, pickService, save, approve, cancel, remove, resend, editNote,
      fmtDate, fmtDateTime, relativeDay, weekday, minutesLabel, formatPrice, STATUS_META, durations: [30, 45, 60, 75, 90, 105, 120, 150, 180],
    };
  },
  template: `
    <a-modal :title="editing ? 'Upraviť rezerváciu' : 'Detail rezervácie'" wide @close="$emit('close')">
      <div v-if="loading" class="adm-loading"><i class="fa-solid fa-spinner fa-spin"></i></div>
      <template v-else-if="reservation">
        <template v-if="!editing">
          <div style="display:flex;gap:.6rem;align-items:center;flex-wrap:wrap;margin-bottom:1rem">
            <span class="adm-badge" :class="STATUS_META[reservation.status_key].cls"><i class="fa-solid" :class="STATUS_META[reservation.status_key].icon"></i> {{ STATUS_META[reservation.status_key].label }}</span>
            <span v-if="reservation.is_past" class="adm-badge is-muted">Prebehla</span>
            <span v-if="reservation.has_account" class="adm-badge is-blue"><i class="fa-solid fa-user-check"></i> Registrovaný klient</span>
          </div>
          <dl class="adm-detail-grid">
            <dt>Termín</dt><dd>{{ weekday(reservation.date) }} {{ fmtDate(reservation.date) }}, {{ reservation.time_from }} – {{ reservation.time_to }} <span class="adm-muted">({{ minutesLabel(reservation.duration) }})</span></dd>
            <dt>Terapeut</dt><dd><span class="adm-dot" :style="{ background: workerColors[reservation.worker] }"></span> {{ reservation.worker }}</dd>
            <dt>Služba</dt><dd>{{ reservation.massage_name || '–' }}</dd>
            <dt>Klient</dt><dd>{{ reservation.name_surname }}</dd>
            <dt>Telefón</dt><dd><a v-if="reservation.phone_number" :href="'tel:' + reservation.phone_number">{{ reservation.phone_number }}</a><span v-else>–</span></dd>
            <dt>E-mail</dt><dd><a v-if="reservation.email" :href="'mailto:' + reservation.email">{{ reservation.email }}</a><span v-else>–</span></dd>
            <dt>Poznámka klienta</dt><dd>{{ reservation.special_request || '–' }}</dd>
            <dt>Interná poznámka</dt><dd>{{ reservation.personal_note || '–' }} <button class="adm-icon-btn" title="Upraviť poznámku" @click="editNote"><i class="fa-solid fa-pen"></i></button></dd>
            <template v-if="reservation.cancellation_reason"><dt>Dôvod zrušenia</dt><dd>{{ reservation.cancellation_reason }}</dd></template>
            <dt>Vytvorená</dt><dd>{{ fmtDateTime(reservation.created_at) }}</dd>
            <template v-if="reservation.updated_at && reservation.updated_at !== reservation.created_at"><dt>Upravená</dt><dd>{{ fmtDateTime(reservation.updated_at) }}</dd></template>
            <template v-if="reservation.consent_at"><dt>Súhlas s podmienkami</dt><dd>{{ fmtDateTime(reservation.consent_at) }}</dd></template>
          </dl>

          <template v-if="history.length">
            <hr class="adm-divider" />
            <p class="adm-subtitle">Ďalšie rezervácie tohto klienta ({{ history.length }})</p>
            <div class="adm-rows">
              <div v-for="h in history" :key="h.id" class="adm-row">
                <div class="adm-row-time">{{ fmtDate(h.date) }}<small>{{ h.time_from }}</small></div>
                <div class="adm-row-main"><span>{{ h.worker }} · {{ h.massage_name || 'Masáž' }}</span></div>
                <span class="adm-badge" :class="STATUS_META[h.status_key].cls">{{ STATUS_META[h.status_key].label }}</span>
              </div>
            </div>
          </template>
        </template>

        <template v-else>
          <div v-if="conflicts.length" class="adm-alert is-warning">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <div>
              V tomto čase (vrátane prestávky medzi masážami) už je iná rezervácia:
              <div v-for="c in conflicts" :key="c.id"><b>{{ c.time_from }}–{{ c.time_to }}</b> {{ c.name_surname }} ({{ c.worker }})</div>
              <button class="adm-btn is-warning is-sm" style="margin-top:.5rem" @click="save(true)">Uložiť napriek tomu</button>
            </div>
          </div>
          <div class="adm-grid-3">
            <a-field label="Dátum"><date-input v-model="form.date" /></a-field>
            <a-field label="Začiatok"><time-input v-model="form.time_from" /></a-field>
            <a-field label="Dĺžka">
              <select v-model.number="form.duration">
                <option v-for="d in (durations.includes(Number(form.duration)) ? durations : [Number(form.duration), ...durations])" :key="d" :value="d">{{ minutesLabel(d) }}</option>
              </select>
            </a-field>
          </div>
          <div class="adm-grid-2">
            <a-field label="Terapeut">
              <select v-model="form.worker"><option v-for="w in ['Roman', 'Evka']" :key="w" :value="w">{{ w }}</option></select>
            </a-field>
            <a-field label="Služba" hint="Výberom zo zoznamu sa nastaví aj dĺžka.">
              <input v-model="form.massage_name" type="text" list="adm-service-list" maxlength="250" />
              <datalist id="adm-service-list"><option v-for="s in services" :key="s.id" :value="s.backend_name">{{ s.duration }} min</option></datalist>
            </a-field>
          </div>
          <div class="adm-chip-row" style="margin:-.4rem 0 1rem">
            <button v-for="s in services.filter(s => s.workers.includes(form.worker))" :key="s.id" type="button" class="adm-chip" :class="{ active: form.massage_name === s.backend_name }"
                    @click="form.massage_name = s.backend_name; form.duration = s.duration">{{ s.name.sk || s.backend_name }}</button>
          </div>
          <div class="adm-grid-3">
            <a-field label="Meno a priezvisko" required><input v-model="form.name_surname" type="text" maxlength="150" /></a-field>
            <a-field label="E-mail"><input v-model.trim="form.email" type="email" maxlength="254" /></a-field>
            <a-field label="Telefón"><input v-model.trim="form.phone_number" type="tel" maxlength="20" /></a-field>
          </div>
          <div class="adm-grid-2">
            <a-field label="Poznámka klienta"><textarea v-model="form.special_request" rows="2" maxlength="200"></textarea></a-field>
            <a-field label="Interná poznámka"><textarea v-model="form.personal_note" rows="2" maxlength="200"></textarea></a-field>
          </div>
          <a-toggle v-if="moved && form.email" v-model="form.notify" label="Poslať klientovi e-mail o zmene termínu" hint="E-mail obsahuje nový termín a pozvánku do kalendára." />
        </template>
      </template>

      <template #footer>
        <template v-if="reservation && !editing">
          <button class="adm-btn is-ghost is-danger" @click="remove"><i class="fa-solid fa-trash"></i><span class="hide-sm"> Vymazať</span></button>
          <span style="flex:1"></span>
          <button v-if="reservation.email && reservation.status_key !== 'cancelled'" class="adm-btn is-soft" @click="resend" title="Znovu odoslať potvrdzovací e-mail"><i class="fa-solid fa-paper-plane"></i><span class="hide-sm"> Poslať potvrdenie</span></button>
          <button v-if="reservation.status_key !== 'cancelled'" class="adm-btn is-soft is-danger" @click="cancel"><i class="fa-solid fa-ban"></i> Zrušiť</button>
          <button class="adm-btn is-soft" @click="startEdit"><i class="fa-solid fa-pen"></i> Upraviť</button>
          <button v-if="reservation.status_key === 'pending'" class="adm-btn is-primary" @click="approve"><i class="fa-solid fa-check"></i> Schváliť</button>
        </template>
        <template v-else-if="editing">
          <button class="adm-btn is-soft" @click="editing = false">Späť</button>
          <button class="adm-btn is-primary" :disabled="saving" @click="save(false)"><i class="fa-solid" :class="saving ? 'fa-spinner fa-spin' : 'fa-floppy-disk'"></i> Uložiť</button>
        </template>
      </template>
    </a-modal>
  `,
});

/* ------------------------------------------------------------ new booking */
const NewReservation = defineComponent({
  name: 'NewReservation',
  components: { ...adminComponents },
  emits: ['close', 'created'],
  setup(props, { emit }) {
    const route = VueRouter.useRoute();
    const preset = route.query || {};
    const form = reactive({
      worker: ['Roman', 'Evka'].includes(preset.worker) ? preset.worker : 'Roman',
      date: /^\d{4}-\d{2}-\d{2}$/.test(preset.date || '') ? preset.date : todayISO(),
      time: '', serviceId: '', massage_name: '', duration: 60,
      name_surname: '', email: '', phone: '', note: '',
    });
    const slots = ref([]);
    const slotsLoading = ref(false);
    const clients = ref([]);
    const clientQuery = ref('');
    const clientOpen = ref(false);
    const saving = ref(false);
    const error = ref('');

    const services = computed(() => (contentState.content?.services || []).filter((s) => s.workers.includes(form.worker)));
    const filteredClients = computed(() => {
      const q = normalizeText(clientQuery.value);
      if (!q) return clients.value.slice(0, 8);
      return clients.value.filter((c) => normalizeText(`${c.name_surname} ${c.email} ${c.phone_number}`).includes(q)).slice(0, 8);
    });
    const timeEnd = computed(() => {
      if (!/^\d{2}:\d{2}$/.test(form.time)) return '';
      const [h, m] = form.time.split(':').map(Number);
      const total = h * 60 + m + Number(form.duration || 0);
      return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
    });

    async function loadSlots() {
      if (!form.date || !form.worker) return;
      slotsLoading.value = true;
      try {
        const data = await api.post('/check_available_slots/', { worker: form.worker, selectedDate: form.date });
        slots.value = data.available_slots || [];
      } catch (e) {
        slots.value = [];
      } finally {
        slotsLoading.value = false;
      }
    }

    function pickService(service) {
      form.serviceId = service.id;
      form.massage_name = service.backend_name;
      form.duration = service.duration;
    }

    function pickClient(c) {
      form.name_surname = c.name_surname;
      form.email = c.email;
      form.phone = c.phone_number;
      clientQuery.value = '';
      clientOpen.value = false;
    }

    async function submit() {
      error.value = '';
      if (!form.time) { error.value = 'Vyberte čas začiatku.'; return; }
      if (!form.massage_name) { error.value = 'Vyberte službu.'; return; }
      if (!form.name_surname.trim()) { error.value = 'Zadajte meno klienta.'; return; }
      saving.value = true;
      try {
        await api.post('/create_reservation/', {
          selectedDate: form.date, timeSlot: form.time, duration: Number(form.duration), massageName: form.massage_name,
          nameSurname: form.name_surname.trim(), email: form.email.trim(), phone: form.phone.trim(), worker: form.worker, note: form.note.trim(),
        });
        toast(form.email ? 'Rezervácia bola vytvorená a klientovi bolo odoslané potvrdenie.' : 'Rezervácia bola vytvorená.');
        emit('created');
        emit('close');
      } catch (err) {
        error.value = errorMessage(err, 'Rezerváciu sa nepodarilo vytvoriť.');
      } finally {
        saving.value = false;
      }
    }

    watch(() => [form.worker, form.date], () => { form.time = ''; loadSlots(); });
    if (/^\d{2}:\d{2}$/.test(preset.time || '')) {
      setTimeout(() => { form.time = preset.time; }, 0);
    }
    watch(() => form.worker, () => {
      if (!services.value.find((s) => s.id === form.serviceId)) { form.serviceId = ''; form.massage_name = ''; }
    });

    onMounted(async () => {
      await loadContent().catch(() => null);
      loadSlots();
      try {
        clients.value = (await api.get('/api/admin/clients/')).clients || [];
      } catch (e) { /* ignore */ }
    });

    return { form, slots, slotsLoading, services, filteredClients, clientQuery, clientOpen, saving, error, timeEnd, pickService, pickClient, submit, minutesLabel, fmtDate, relativeDay, todayISO, durations: [30, 45, 60, 90, 120] };
  },
  template: `
    <a-modal title="Nová rezervácia" wide @close="$emit('close')">
      <div class="adm-grid-2">
        <a-field label="Terapeut">
          <div class="adm-btn-group">
            <button v-for="w in ['Roman', 'Evka']" :key="w" type="button" :class="{ active: form.worker === w }" @click="form.worker = w">{{ w }}</button>
          </div>
        </a-field>
        <a-field label="Dátum" :hint="relativeDay(form.date)"><date-input v-model="form.date" :min="todayISO()" /></a-field>
      </div>

      <a-field label="Služba" required>
        <div class="adm-chip-row">
          <button v-for="s in services" :key="s.id" type="button" class="adm-chip" :class="{ active: form.serviceId === s.id }" @click="pickService(s)">
            {{ s.name.sk || s.backend_name }} · {{ s.price }}
          </button>
        </div>
      </a-field>

      <a-field label="Začiatok" required :hint="form.time && timeEnd ? 'Koniec o ' + timeEnd + ' (' + minutesLabel(form.duration) + ')' : 'Vyberte voľný čas alebo zadajte vlastný.'">
        <div v-if="slotsLoading" class="adm-muted adm-small"><i class="fa-solid fa-spinner fa-spin"></i> Hľadám voľné časy…</div>
        <div v-else class="adm-chip-row" style="margin-bottom:.5rem">
          <button v-for="slot in slots" :key="slot" type="button" class="adm-chip" :class="{ active: form.time === slot }" @click="form.time = slot">{{ slot }}</button>
          <span v-if="!slots.length" class="adm-muted adm-small">V tento deň podľa rozvrhu nie je voľný čas – môžete zadať vlastný čas nižšie.</span>
        </div>
        <div style="display:flex;gap:.5rem;align-items:center;flex-wrap:wrap">
          <time-input v-model="form.time" />
          <select v-model.number="form.duration" style="width:auto">
            <option v-for="d in durations" :key="d" :value="d">{{ minutesLabel(d) }}</option>
          </select>
        </div>
      </a-field>

      <hr class="adm-divider" />
      <a-field label="Vyhľadať uloženého klienta">
        <div style="position:relative">
          <input v-model="clientQuery" type="search" placeholder="Meno, e-mail alebo telefón…" @focus="clientOpen = true" @blur="setTimeout(() => clientOpen = false, 150)" />
          <div v-if="clientOpen && filteredClients.length" class="adm-menu is-down" style="left:0;right:0;max-height:260px;overflow:auto">
            <button v-for="c in filteredClients" :key="c.id" type="button" @mousedown.prevent="pickClient(c)">
              <i class="fa-solid fa-user"></i>
              <span><b>{{ c.name_surname }}</b><br><small class="adm-muted">{{ [c.phone_number, c.email].filter(Boolean).join(' · ') }}</small></span>
            </button>
          </div>
        </div>
      </a-field>
      <div class="adm-grid-3">
        <a-field label="Meno a priezvisko" required><input v-model="form.name_surname" type="text" maxlength="150" /></a-field>
        <a-field label="E-mail" hint="Ak vyplníte, klientovi príde potvrdenie."><input v-model.trim="form.email" type="email" maxlength="254" /></a-field>
        <a-field label="Telefón"><input v-model.trim="form.phone" type="tel" maxlength="20" /></a-field>
      </div>
      <a-field label="Interná poznámka"><textarea v-model="form.note" rows="2" maxlength="200"></textarea></a-field>
      <p v-if="error" class="adm-alert is-error"><i class="fa-solid fa-circle-exclamation"></i> {{ error }}</p>

      <template #footer>
        <button class="adm-btn is-soft" @click="$emit('close')">Zrušiť</button>
        <button class="adm-btn is-primary" :disabled="saving" @click="submit">
          <i class="fa-solid" :class="saving ? 'fa-spinner fa-spin' : 'fa-check'"></i> Vytvoriť rezerváciu
        </button>
      </template>
    </a-modal>
  `,
  methods: { setTimeout: (fn, ms) => window.setTimeout(fn, ms) },
});

/* -------------------------------------------------------------------- list */
export const ReservationsView = defineComponent({
  name: 'ReservationsView',
  components: { ...adminComponents, ReservationDetail, NewReservation },
  setup() {
    const route = VueRouter.useRoute();
    const router = VueRouter.useRouter();
    const loading = ref(true);
    const rows = ref([]);
    const meta = reactive({ page: 1, pages: 1, total: 0, per_page: 25 });
    const filters = reactive({
      q: '', worker: '', status: route.query.status || '', when: route.query.status === 'pending' ? 'upcoming' : 'upcoming',
      date_from: '', date_to: '', order: 'asc',
    });
    let timer = null;

    const detailId = computed(() => (route.params.id && route.params.id !== 'nova' ? route.params.id : null));
    const creating = computed(() => route.path.endsWith('/nova'));
    const workerColors = computed(() => Object.fromEntries((store.content?.therapists || []).map((t) => [t.key, t.color])));

    const groups = computed(() => {
      const result = [];
      let current = null;
      for (const r of rows.value) {
        if (!current || current.date !== r.date) {
          current = { date: r.date, items: [] };
          result.push(current);
        }
        current.items.push(r);
      }
      return result;
    });

    function query(page = meta.page) {
      const params = new URLSearchParams({ page: String(page), per_page: String(meta.per_page) });
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      return params;
    }

    async function load(page = 1) {
      loading.value = true;
      try {
        const data = await api.get(`/api/admin/reservations/?${query(page)}`);
        rows.value = data.reservations;
        Object.assign(meta, { page: data.page, pages: data.pages, total: data.total, per_page: data.per_page });
        ui.pendingCount = data.pending_count;
      } catch (error) {
        toastError(error, 'Rezervácie sa nepodarilo načítať.');
      } finally {
        loading.value = false;
      }
    }

    function setWhen(value) {
      filters.when = value;
      filters.order = value === 'upcoming' ? 'asc' : 'desc';
    }

    function quickRange(kind) {
      const today = todayISO();
      filters.when = 'all';
      filters.order = 'asc';
      if (kind === 'today') { filters.date_from = today; filters.date_to = today; }
      if (kind === 'tomorrow') { const t = addDaysISO(today, 1); filters.date_from = t; filters.date_to = t; }
      if (kind === 'week') {
        const [y, m, d] = today.split('-').map(Number);
        const dow = (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
        filters.date_from = addDaysISO(today, -dow);
        filters.date_to = addDaysISO(today, 6 - dow);
      }
    }

    function clearFilters() {
      Object.assign(filters, { q: '', worker: '', status: '', when: 'upcoming', date_from: '', date_to: '', order: 'asc' });
    }

    const hasFilters = computed(() => !!(filters.q || filters.worker || filters.status || filters.date_from || filters.date_to || filters.when !== 'upcoming'));

    function exportCsv() {
      window.location.href = `/api/admin/reservations/export/?${query(1)}`;
    }

    function openDetail(r) { router.push(`/sprava/rezervacie/${r.id}`); }
    function closeModal() { router.push({ path: '/sprava/rezervacie', query: route.query }); }

    async function approve(r) {
      if (!(await confirmDialog({ title: 'Schváliť rezerváciu?', html: `<b>${escapeHtml(r.name_surname)}</b><br>${relativeDay(r.date)}, ${r.time_from}–${r.time_to}`, confirm: 'Schváliť' }))) return;
      try {
        await api.post('/approve_reservation/', { id: r.id });
        toast('Rezervácia bola schválená.');
        load(meta.page);
      } catch (error) { toastError(error); }
    }

    watch(filters, () => {
      clearTimeout(timer);
      timer = setTimeout(() => load(1), 250);
    }, { deep: true });

    onMounted(() => load(1));

    return {
      loading, rows, meta, filters, groups, detailId, creating, workerColors, hasFilters,
      load, setWhen, quickRange, clearFilters, exportCsv, openDetail, closeModal, approve,
      fmtDate, relativeDay, weekday, plural, formatPrice, STATUS_META, todayISO,
    };
  },
  template: `
    <div>
      <a-page-head title="Rezervácie" :subtitle="meta.total + ' ' + plural(meta.total, 'rezervácia', 'rezervácie', 'rezervácií') + (hasFilters ? ' podľa filtra' : ' – nadchádzajúce')">
        <button class="adm-btn is-soft" @click="exportCsv" title="Stiahnuť ako tabuľku pre Excel"><i class="fa-solid fa-file-csv"></i><span class="hide-sm"> Export</span></button>
        <router-link class="adm-btn is-primary" to="/sprava/rezervacie/nova"><i class="fa-solid fa-plus"></i> Nová rezervácia</router-link>
      </a-page-head>

      <div class="adm-card" style="padding:1rem 1rem .2rem">
        <div class="adm-toolbar">
          <div class="adm-search"><i class="fa-solid fa-magnifying-glass"></i><input v-model.trim="filters.q" type="search" placeholder="Hľadať meno, telefón, e-mail, poznámku…" /></div>
          <div class="adm-btn-group">
            <button :class="{ active: filters.when === 'upcoming' }" @click="setWhen('upcoming')">Nadchádzajúce</button>
            <button :class="{ active: filters.when === 'past' }" @click="setWhen('past')">Minulé</button>
            <button :class="{ active: filters.when === 'all' }" @click="setWhen('all')">Všetky</button>
          </div>
        </div>
        <div class="adm-toolbar">
          <select v-model="filters.status">
            <option value="">Všetky stavy</option>
            <option value="pending">Čakajúce na schválenie</option>
            <option value="approved">Schválené</option>
            <option value="active">Nezrušené</option>
            <option value="cancelled">Zrušené</option>
          </select>
          <select v-model="filters.worker">
            <option value="">Obaja terapeuti</option>
            <option value="Roman">Roman</option>
            <option value="Evka">Evka</option>
          </select>
          <date-input v-model="filters.date_from" placeholder="Od dátumu" />
          <date-input v-model="filters.date_to" placeholder="Do dátumu" />
          <button class="adm-btn is-ghost is-sm" @click="quickRange('today')">Dnes</button>
          <button class="adm-btn is-ghost is-sm" @click="quickRange('tomorrow')">Zajtra</button>
          <button class="adm-btn is-ghost is-sm" @click="quickRange('week')">Tento týždeň</button>
          <button v-if="hasFilters" class="adm-btn is-ghost is-sm is-danger" @click="clearFilters"><i class="fa-solid fa-xmark"></i> Zrušiť filtre</button>
        </div>
      </div>

      <div v-if="loading && !rows.length" class="adm-loading"><i class="fa-solid fa-spinner fa-spin"></i> Načítavam…</div>
      <div v-else-if="!rows.length" class="adm-card"><a-empty icon="fa-calendar-xmark" text="Žiadne rezervácie nezodpovedajú filtru." /></div>
      <template v-else>
        <div v-for="g in groups" :key="g.date" class="adm-card" :style="{ opacity: loading ? .6 : 1 }">
          <div class="adm-card-head" style="padding-bottom:.2rem">
            <h2 style="text-transform:capitalize">{{ relativeDay(g.date) === 'Dnes' || relativeDay(g.date) === 'Zajtra' || relativeDay(g.date) === 'Včera' ? relativeDay(g.date) + ' · ' + weekday(g.date) + ' ' + fmtDate(g.date) : weekday(g.date) + ' ' + fmtDate(g.date) }}</h2>
            <span class="adm-badge">{{ g.items.length }}</span>
          </div>
          <div class="adm-card-body" style="padding-top:.4rem">
            <table class="adm-table adm-table-cards" style="border:0">
              <tbody>
                <tr v-for="r in g.items" :key="r.id" class="is-clickable" :class="{ 'is-cancelled': r.status_key === 'cancelled' }" @click="openDetail(r)">
                  <td class="adm-nowrap" style="width:110px"><span class="adm-strong">{{ r.time_from }}</span> <span class="adm-muted">– {{ r.time_to }}</span></td>
                  <td>
                    <span class="adm-strong">{{ r.name_surname }}</span>
                    <span class="adm-sub">{{ [r.phone_number, r.email].filter(Boolean).join(' · ') || 'bez kontaktu' }}</span>
                  </td>
                  <td class="adm-nowrap"><span class="adm-dot" :style="{ background: workerColors[r.worker] }"></span> {{ r.worker }}</td>
                  <td>{{ r.massage_name || '–' }}</td>
                  <td>
                    <span class="adm-badge" :class="STATUS_META[r.status_key].cls">{{ STATUS_META[r.status_key].label }}</span>
                    <span v-if="r.special_request || r.personal_note" class="adm-sub" :title="[r.special_request, r.personal_note].filter(Boolean).join(' | ')"><i class="fa-regular fa-comment"></i> poznámka</span>
                  </td>
                  <td class="adm-td-actions" @click.stop>
                    <button v-if="r.status_key === 'pending'" class="adm-btn is-success is-sm" @click="approve(r)"><i class="fa-solid fa-check"></i> Schváliť</button>
                    <button class="adm-icon-btn" title="Detail" @click="openDetail(r)"><i class="fa-solid fa-chevron-right"></i></button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="adm-pagination">
          <span>Strana {{ meta.page }} z {{ meta.pages }} · {{ meta.total }} spolu</span>
          <div style="display:flex;gap:.5rem;align-items:center">
            <select v-model.number="meta.per_page" @change="load(1)" style="width:auto">
              <option :value="25">25 na stranu</option><option :value="50">50 na stranu</option><option :value="100">100 na stranu</option>
            </select>
            <button class="adm-btn is-soft is-sm" :disabled="meta.page <= 1" @click="load(meta.page - 1)"><i class="fa-solid fa-chevron-left"></i></button>
            <button class="adm-btn is-soft is-sm" :disabled="meta.page >= meta.pages" @click="load(meta.page + 1)"><i class="fa-solid fa-chevron-right"></i></button>
          </div>
        </div>
      </template>

      <reservation-detail v-if="detailId" :key="detailId" :id="detailId" @close="closeModal" @changed="load(meta.page)" />
      <new-reservation v-if="creating" @close="closeModal" @created="load(1)" />
    </div>
  `,
});
