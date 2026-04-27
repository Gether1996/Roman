const { defineComponent, ref, onMounted, onBeforeUnmount, nextTick } = Vue;
const { useI18n } = VueI18n;

import { fetchJSON } from '../utils/api.js';
import { store } from '../store.js';

export const CalendarAdminView = defineComponent({
  name: 'CalendarAdminView',
  setup() {
    const { t, locale } = useI18n();
    const calendarRoot = ref(null);
    const loading = ref(true);
    let calendar = null;

    function isMobileCalendar() {
      return window.innerWidth < 720;
    }

    function getHeaderToolbar() {
      if (isMobileCalendar()) {
        return {
          left: 'prev,next',
          center: 'title',
          right: 'today',
        };
      }

      return {
        left: 'prev,next today',
        center: 'title',
        right: 'timeGridDay,timeGridWeek,dayGridMonth',
      };
    }

    async function loadCalendar() {
      if (!store.isSuperuser) {
        loading.value = false;
        return;
      }

      const data = await fetchJSON('/api/admin-calendar/');
      loading.value = false;

      // C2 FIX: Wait for Vue to flush DOM before calendarRoot.value is available
      await nextTick();

      calendar = new window.FullCalendar.Calendar(calendarRoot.value, {
        initialView: isMobileCalendar() ? 'timeGridDay' : 'timeGridWeek',
        headerToolbar: getHeaderToolbar(),
        slotDuration: '01:00:00',
        slotMinTime: '07:00',
        slotMaxTime: '22:00',
        slotLabelFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
        slotLabelInterval: '01:00',
        allDaySlot: false,
        firstDay: 1,
        expandRows: !isMobileCalendar(),
        nowIndicator: true,
        height: isMobileCalendar() ? 'calc(100vh - 14rem)' : 'calc(100vh - 22rem)',
        scrollTime: '14:00:00',
        eventMinHeight: isMobileCalendar() ? 54 : 28,
        eventShortHeight: isMobileCalendar() ? 48 : 28,
        slotEventOverlap: false,
        eventOverlap: false,
        locale: locale.value,
        events: data.events || [],
        eventContent(arg) {
          if (arg.view.type === 'dayGridMonth') {
            return undefined;
          }

          const mobile = isMobileCalendar();
          const wrapper = document.createElement('div');
          wrapper.className = `fc-admin-event${mobile ? ' is-mobile' : ''}`;

          const title = document.createElement('strong');
          title.textContent = arg.event.title;
          wrapper.appendChild(title);

          const time = document.createElement('span');
          time.className = 'fc-admin-event-time';
          time.textContent = arg.timeText;
          wrapper.appendChild(time);

          return { domNodes: [wrapper] };
        },
        windowResize() {
          const mobile = isMobileCalendar();
          calendar.setOption('headerToolbar', getHeaderToolbar());
          calendar.setOption('height', mobile ? 'calc(100vh - 14rem)' : 'calc(100vh - 22rem)');
          calendar.setOption('expandRows', !mobile);
          calendar.setOption('eventMinHeight', mobile ? 54 : 28);
          calendar.setOption('eventShortHeight', mobile ? 48 : 28);
          if (mobile && calendar.view.type !== 'timeGridDay') {
            calendar.changeView('timeGridDay');
          } else if (!mobile && calendar.view.type === 'timeGridDay') {
            calendar.changeView('timeGridWeek');
          }
        },
        eventClick(info) {
          const p = info.event.extendedProps;
          const lines = [
            `<strong>${info.event.title}</strong>`,
            `🕐 ${info.event.startStr.slice(11,16)} – ${info.event.endStr.slice(11,16)}`,
            p.phone ? `📞 ${p.phone}` : '',
            p.email ? `✉️ ${p.email}` : '',
            `Status: ${p.active === 'True' ? t('admin.approved') : t('admin.pending')}`,
          ].filter(Boolean).join('<br>');
          window.Swal.fire({ html: lines, confirmButtonColor: '#0f7e7a', showConfirmButton: true });
        },
      });

      calendar.render();
    }

    onMounted(loadCalendar);
    onBeforeUnmount(() => {
      if (calendar) {
        calendar.destroy();
      }
    });

    return {
      store,
      calendarRoot,
      loading,
      t,
    };
  },
  template: `
    <section class="page-section container-shell">
      <div class="section-header">
        <span class="section-kicker">Admin</span>
        <h1>{{ t('admin.calendarTitle') }}</h1>
      </div>

      <div v-if="!store.isSuperuser" class="glass-panel centered-copy">
        <p>{{ t('common.unauthorized') }}</p>
        <router-link class="btn btn-primary-strong" to="/">{{ t('common.backHome') }}</router-link>
      </div>

      <div v-else-if="loading" class="glass-panel centered-copy">{{ t('common.loading') }}</div>

      <div v-else>
        <div class="cal-legend">
          <span class="cal-dot" style="background:#0f7e7a"></span> Roman
          <span class="cal-dot" style="background:#db2777"></span> Evka
          <span class="cal-dot" style="background:#d97706"></span> {{ t('admin.pending') }}
          <span class="cal-dot" style="background:#9ca3af"></span> {{ t('admin.cancelledLabel') }}
        </div>
        <div class="glass-panel calendar-shell calendar-shell-admin">
          <div ref="calendarRoot"></div>
        </div>
      </div>
    </section>
  `,
});
