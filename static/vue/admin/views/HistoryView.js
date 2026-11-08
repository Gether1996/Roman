const { defineComponent, ref, reactive, computed, watch, onMounted } = Vue;

import { api, toastError, fmtDate, fmtDateTime, relativeDay, weekday, plural } from '../ui.js';
import { adminComponents } from '../components.js';

export const ACTION_META = {
  create: { icon: 'fa-plus', cls: 'is-green' },
  update: { icon: 'fa-pen', cls: 'is-blue' },
  delete: { icon: 'fa-trash', cls: 'is-red' },
  approve: { icon: 'fa-check', cls: 'is-green' },
  cancel: { icon: 'fa-ban', cls: 'is-amber' },
  restore: { icon: 'fa-clock-rotate-left', cls: 'is-blue' },
  reset: { icon: 'fa-rotate', cls: 'is-amber' },
  reorder: { icon: 'fa-arrow-down-short-wide', cls: 'is-blue' },
  hide: { icon: 'fa-eye-slash', cls: 'is-amber' },
  show: { icon: 'fa-eye', cls: 'is-green' },
  email: { icon: 'fa-paper-plane', cls: 'is-blue' },
  login: { icon: 'fa-right-to-bracket', cls: 'is-muted' },
  import: { icon: 'fa-file-import', cls: 'is-blue' },
};

export const ACTOR_LABELS = { admin: 'Administrátor', client: 'Klient', visitor: 'Návštevník', system: 'Systém' };

/** One history entry with expandable list of changed values. Reused in reservation detail. */
export const HistoryEntry = defineComponent({
  name: 'HistoryEntry',
  props: { entry: { type: Object, required: true }, compact: Boolean, showDate: Boolean },
  emits: ['open-reservation'],
  setup(props) {
    const open = ref(false);
    const meta = computed(() => ACTION_META[props.entry.action] || { icon: 'fa-circle', cls: 'is-muted' });
    const canOpenReservation = computed(() => props.entry.object_type === 'Reservation' && props.entry.action !== 'delete' && props.entry.object_id);
    return { open, meta, canOpenReservation, fmtDateTime, ACTOR_LABELS };
  },
  template: `
    <div class="adm-hist" :class="{ 'is-compact': compact }">
      <span class="adm-hist-icon" :class="meta.cls"><i class="fa-solid" :class="meta.icon"></i></span>
      <div class="adm-hist-body">
        <div class="adm-hist-top">
          <strong class="adm-hist-summary">{{ entry.summary }}</strong>
          <span class="adm-hist-time">{{ showDate ? fmtDateTime(entry.created_at) : entry.created_at.slice(11, 16) }}</span>
        </div>
        <div class="adm-hist-meta">
          <span><i class="fa-solid" :class="entry.actor_type === 'admin' ? 'fa-user-shield' : entry.actor_type === 'system' ? 'fa-gear' : 'fa-user'"></i> {{ entry.actor || ACTOR_LABELS[entry.actor_type] }}</span>
          <span v-if="!compact" class="adm-badge">{{ entry.area_label }}</span>
          <button v-if="entry.changes.length" type="button" class="adm-hist-toggle" @click="open = !open">
            <i class="fa-solid" :class="open ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
            {{ open ? 'Skryť detail' : 'Detail zmien (' + entry.changes.length + ')' }}
          </button>
          <button v-if="canOpenReservation && !compact" type="button" class="adm-hist-toggle" @click="$emit('open-reservation', entry.object_id)">
            <i class="fa-solid fa-arrow-up-right-from-square"></i> Otvoriť rezerváciu
          </button>
        </div>
        <div v-if="open" class="adm-hist-changes">
          <div class="adm-hist-change adm-hist-change-head"><span>Položka</span><span>Predtým</span><span>Teraz</span></div>
          <div v-for="(c, i) in entry.changes" :key="i" class="adm-hist-change">
            <span class="adm-hist-field">{{ c.label || c.field }}</span>
            <span class="adm-hist-old">{{ c.old === '' || c.old == null ? '–' : c.old }}</span>
            <span class="adm-hist-new">{{ c.new === '' || c.new == null ? '–' : c.new }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
});

export const HistoryView = defineComponent({
  name: 'HistoryView',
  components: { ...adminComponents, HistoryEntry },
  setup() {
    const router = VueRouter.useRouter();
    const loading = ref(true);
    const loadingMore = ref(false);
    const entries = ref([]);
    const meta = reactive({ page: 1, pages: 1, total: 0 });
    const areas = ref([]);
    const filters = reactive({ q: '', area: '', actor_type: '', date_from: '', date_to: '' });
    let timer = null;

    const areaOptions = computed(() => [{ value: '', label: 'Všetky oblasti' }, ...areas.value]);
    const actorOptions = [
      { value: '', label: 'Všetci' },
      { value: 'admin', label: 'Administrátori', icon: 'fa-user-shield' },
      { value: 'client', label: 'Prihlásení klienti', icon: 'fa-user' },
      { value: 'visitor', label: 'Návštevníci webu', icon: 'fa-user' },
      { value: 'system', label: 'Systém', icon: 'fa-gear' },
    ];
    const hasFilters = computed(() => Object.values(filters).some(Boolean));

    const groups = computed(() => {
      const out = [];
      for (const entry of entries.value) {
        const day = entry.created_at.slice(0, 10);
        if (!out.length || out[out.length - 1].day !== day) out.push({ day, items: [] });
        out[out.length - 1].items.push(entry);
      }
      return out;
    });

    async function load(page = 1) {
      const params = new URLSearchParams({ page: String(page), per_page: '50' });
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      if (page === 1) loading.value = true; else loadingMore.value = true;
      try {
        const data = await api.get(`/api/admin/history/?${params}`);
        entries.value = page === 1 ? data.entries : [...entries.value, ...data.entries];
        Object.assign(meta, { page: data.page, pages: data.pages, total: data.total });
        areas.value = data.areas || [];
      } catch (error) {
        toastError(error, 'Históriu sa nepodarilo načítať.');
      } finally {
        loading.value = false;
        loadingMore.value = false;
      }
    }

    function clearFilters() {
      Object.assign(filters, { q: '', area: '', actor_type: '', date_from: '', date_to: '' });
    }

    function openReservation(id) {
      router.push(`/sprava/rezervacie/${id}`);
    }

    watch(filters, () => { clearTimeout(timer); timer = setTimeout(() => load(1), 250); }, { deep: true });
    onMounted(() => load(1));

    return { loading, loadingMore, entries, meta, filters, groups, areaOptions, actorOptions, hasFilters, load, clearFilters, openReservation, relativeDay, weekday, fmtDate, plural };
  },
  template: `
    <div>
      <a-page-head title="História zmien" subtitle="Kto, kedy a čo zmenil – rezervácie, obsah webu, rozvrh, voľno, galéria, hodnotenia, klienti aj nastavenia. Záznamy sa uchovávajú 2 roky." />

      <div class="adm-card" style="padding:1rem 1rem .2rem">
        <div class="adm-toolbar">
          <div class="adm-search"><i class="fa-solid fa-magnifying-glass"></i><input v-model.trim="filters.q" type="search" placeholder="Hľadať v histórii (meno, text, hodnota)…" /></div>
          <a-select v-model="filters.area" :options="areaOptions" aria-label="Oblasť" />
          <a-select v-model="filters.actor_type" :options="actorOptions" aria-label="Kto" />
        </div>
        <div class="adm-toolbar">
          <date-input v-model="filters.date_from" placeholder="Od dátumu" />
          <date-input v-model="filters.date_to" placeholder="Do dátumu" />
          <button v-if="hasFilters" class="adm-btn is-ghost is-sm is-danger" @click="clearFilters"><i class="fa-solid fa-xmark"></i> Zrušiť filtre</button>
          <span class="adm-muted adm-small" style="margin-left:auto">{{ meta.total }} {{ plural(meta.total, 'záznam', 'záznamy', 'záznamov') }}</span>
        </div>
      </div>

      <div v-if="loading" class="adm-loading"><i class="fa-solid fa-spinner fa-spin"></i> Načítavam…</div>
      <div v-else-if="!entries.length" class="adm-card"><a-empty icon="fa-clock-rotate-left" :text="hasFilters ? 'Filtru nezodpovedá žiadny záznam.' : 'Zatiaľ nie sú zaznamenané žiadne zmeny.'" /></div>
      <template v-else>
        <section v-for="g in groups" :key="g.day" class="adm-card">
          <header class="adm-card-head" style="padding-bottom:.3rem">
            <h2 style="text-transform:capitalize">{{ ['Dnes', 'Včera'].includes(relativeDay(g.day)) ? relativeDay(g.day) + ' · ' : '' }}{{ weekday(g.day) }} {{ fmtDate(g.day) }}</h2>
            <span class="adm-badge">{{ g.items.length }}</span>
          </header>
          <div class="adm-card-body" style="padding-top:.3rem">
            <history-entry v-for="entry in g.items" :key="entry.id" :entry="entry" @open-reservation="openReservation" />
          </div>
        </section>
        <div v-if="meta.page < meta.pages" style="text-align:center;margin-top:1rem">
          <button class="adm-btn is-soft" :disabled="loadingMore" @click="load(meta.page + 1)">
            <i class="fa-solid" :class="loadingMore ? 'fa-spinner fa-spin' : 'fa-angles-down'"></i> Načítať staršie
          </button>
        </div>
      </template>
    </div>
  `,
});
