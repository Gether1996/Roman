const { defineComponent, ref, computed, watch, onMounted, onBeforeUnmount } = Vue;

import { api, toastError, nowISO, todayISO, fmtDate } from '../ui.js';
import { adminComponents } from '../components.js';
import { store } from '../../store.js';

const VIEW_KEY = 'adm_calendar_view';
const WORKER_KEY = 'adm_calendar_worker';

function readPref(key, fallback) {
  try { return localStorage.getItem(key) || fallback; } catch (e) { return fallback; }
}
function writePref(key, value) {
  try { localStorage.setItem(key, value); } catch (e) { /* ignore */ }
}

export const CalendarView = defineComponent({
  name: 'CalendarView',
  components: { ...adminComponents },
  setup() {
    const router = VueRouter.useRouter();
    const root = ref(null);
    const worker = ref(readPref(WORKER_KEY, ''));
    const showCancelled = ref(false);
    const title = ref('');
    const view = ref('');
    let calendar = null;

    const isMobile = () => window.innerWidth < 720;
    const therapists = computed(() => store.content?.therapists || []);

    const views = [
      { key: 'timeGridDay', label: 'Deň' },
      { key: 'timeGridWeek', label: 'Týždeň' },
      { key: 'dayGridMonth', label: 'Mesiac' },
      { key: 'listWeek', label: 'Agenda' },
    ];

    function changeView(key) {
      calendar?.changeView(key);
      writePref(VIEW_KEY, key);
    }

    function refetch() {
      calendar?.refetchEvents();
    }

    async function fetchEvents(info, success, failure) {
      const params = new URLSearchParams({ start: info.startStr.slice(0, 10), end: info.endStr.slice(0, 10) });
      if (worker.value) params.set('worker', worker.value);
      if (showCancelled.value) params.set('cancelled', '1');
      try {
        const data = await api.get(`/api/admin/calendar/?${params}`);
        success(data.events || []);
      } catch (error) {
        toastError(error, 'Kalendár sa nepodarilo načítať.');
        failure(error);
      }
    }

    function init() {
      const initial = readPref(VIEW_KEY, isMobile() ? 'listWeek' : 'timeGridWeek');
      calendar = new window.FullCalendar.Calendar(root.value, {
        locale: 'sk',
        firstDay: 1,
        // Always show Slovak wall-clock time, even if the device is set to another time zone:
        // events are naive local times and "now" is computed for Europe/Bratislava.
        now: () => nowISO(),
        initialView: initial,
        headerToolbar: false,
        height: 'auto',
        contentHeight: isMobile() ? 'auto' : 720,
        slotMinTime: '07:00:00',
        slotMaxTime: '22:00:00',
        slotDuration: '00:30:00',
        slotLabelFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
        eventTimeFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
        scrollTime: '08:00:00',
        allDaySlot: true,
        allDayText: 'celý deň',
        nowIndicator: true,
        dayMaxEvents: 4,
        navLinks: true,
        noEventsText: 'V tomto období nie sú žiadne rezervácie.',
        buttonText: { today: 'Dnes' },
        events: fetchEvents,
        selectable: true,
        selectMirror: true,
        datesSet(info) {
          title.value = info.view.title;
          view.value = info.view.type;
        },
        eventClassNames(arg) {
          return arg.event.extendedProps.status_key === 'cancelled' ? ['is-cancelled'] : [];
        },
        eventContent(arg) {
          const props = arg.event.extendedProps;
          if (props.type === 'off' || arg.view.type === 'dayGridMonth' || arg.view.type.startsWith('list')) {
            if (arg.view.type.startsWith('list') && props.type === 'reservation') {
              const span = document.createElement('span');
              span.textContent = `${arg.event.title} · ${props.worker} · ${props.massage_name || 'Masáž'}${props.status_key === 'pending' ? ' (čaká na schválenie)' : props.status_key === 'cancelled' ? ' (zrušená)' : ''}`;
              return { domNodes: [span] };
            }
            return undefined;
          }
          const wrap = document.createElement('div');
          wrap.className = 'adm-cal-event';
          const name = document.createElement('strong');
          name.textContent = arg.event.title;
          const meta = document.createElement('span');
          meta.textContent = `${arg.timeText} · ${props.worker}`;
          wrap.append(name, meta);
          return { domNodes: [wrap] };
        },
        eventClick(info) {
          if (info.event.extendedProps.type === 'reservation') {
            router.push(`/sprava/rezervacie/${info.event.id}`);
          }
        },
        select(info) {
          if (info.view.type === 'dayGridMonth') {
            calendar.changeView('timeGridDay', info.startStr);
            return;
          }
          const date = info.startStr.slice(0, 10);
          const time = info.allDay ? '' : info.startStr.slice(11, 16);
          if (date < todayISO()) return;
          router.push({ path: '/sprava/rezervacie/nova', query: { date, ...(time ? { time } : {}), ...(worker.value ? { worker: worker.value } : {}) } });
        },
      });
      calendar.render();
    }

    watch([worker, showCancelled], () => {
      writePref(WORKER_KEY, worker.value);
      refetch();
    });

    onMounted(init);
    onBeforeUnmount(() => calendar?.destroy());

    return { root, worker, showCancelled, title, view, views, therapists, changeView, fmtDate,
      prev: () => calendar?.prev(), next: () => calendar?.next(), today: () => calendar?.today() };
  },
  template: `
    <div>
      <a-page-head title="Kalendár" subtitle="Kliknutím na rezerváciu otvoríte detail, kliknutím (alebo potiahnutím) do voľného miesta vytvoríte novú rezerváciu.">
        <router-link class="adm-btn is-primary" to="/sprava/rezervacie/nova"><i class="fa-solid fa-plus"></i> Nová rezervácia</router-link>
      </a-page-head>

      <div class="adm-card" style="padding:1rem">
        <div class="adm-toolbar" style="margin-bottom:.8rem">
          <div class="adm-btn-group">
            <button @click="prev" aria-label="Predchádzajúce"><i class="fa-solid fa-chevron-left"></i></button>
            <button @click="today">Dnes</button>
            <button @click="next" aria-label="Nasledujúce"><i class="fa-solid fa-chevron-right"></i></button>
          </div>
          <strong style="font-size:1.1rem;text-transform:capitalize;flex:1;min-width:180px">{{ title }}</strong>
          <div class="adm-btn-group">
            <button v-for="v in views" :key="v.key" :class="{ active: view === v.key }" @click="changeView(v.key)">{{ v.label }}</button>
          </div>
        </div>
        <div class="adm-toolbar" style="margin-bottom:.8rem">
          <div class="adm-btn-group">
            <button :class="{ active: !worker }" @click="worker = ''">Obaja</button>
            <button v-for="t in therapists" :key="t.key" :class="{ active: worker === t.key }" @click="worker = t.key">
              <span class="adm-dot" :style="{ background: t.color }"></span> {{ t.key }}
            </button>
          </div>
          <a-checkbox v-model="showCancelled">Zobraziť zrušené</a-checkbox>
          <div class="adm-legend" style="margin-left:auto">
            <span v-for="t in therapists" :key="t.key"><span class="adm-dot" :style="{ background: t.color }"></span> {{ t.key }}</span>
            <span><span class="adm-dot" style="background:#d97706"></span> čaká na schválenie</span>
            <span><span class="adm-dot" style="background:#94a3b8;opacity:.6"></span> voľno</span>
          </div>
        </div>
        <div class="adm-calendar"><div ref="root"></div></div>
      </div>
    </div>
  `,
});
