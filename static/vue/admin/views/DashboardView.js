const { defineComponent, ref, computed, onMounted } = Vue;

import { api, ui, toast, toastError, confirmDialog, promptDialog, fmtDate, fmtDateTime, relativeDay, plural, formatPrice, MONTHS, STATUS_META, todayISO } from '../ui.js';
import { adminComponents } from '../components.js';
import { store } from '../../store.js';

export const DashboardView = defineComponent({
  name: 'DashboardView',
  components: { ...adminComponents },
  setup() {
    const router = VueRouter.useRouter();
    const loading = ref(true);
    const data = ref(null);

    const greeting = computed(() => {
      const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Bratislava', hour: '2-digit', hourCycle: 'h23' }).format(new Date()));
      if (hour < 10) return 'Dobré ráno';
      if (hour < 18) return 'Dobrý deň';
      return 'Dobrý večer';
    });

    const workerColors = computed(() => {
      const map = {};
      (store.content?.therapists || []).forEach((t) => { map[t.key] = t.color; });
      return map;
    });

    const trendMax = computed(() => Math.max(1, ...(data.value?.trend || []).map((m) => m.count)));

    async function load() {
      try {
        data.value = await api.get('/api/admin/dashboard/');
        ui.pendingCount = data.value.pending_count;
      } catch (error) {
        toastError(error, 'Nástenku sa nepodarilo načítať.');
      } finally {
        loading.value = false;
      }
    }

    async function approve(r) {
      if (!(await confirmDialog({ title: 'Schváliť rezerváciu?', html: `<b>${escapeHtml(r.name_surname)}</b><br>${relativeDay(r.date)}, ${r.time_from}–${r.time_to}${r.email ? '<br><small>Klientovi príde potvrdzovací e-mail.</small>' : ''}`, confirm: 'Schváliť' }))) return;
      try {
        await api.post('/approve_reservation/', { id: r.id });
        toast('Rezervácia bola schválená.');
        load();
      } catch (error) { toastError(error); }
    }

    async function reject(r) {
      const note = await promptDialog({ title: 'Zamietnuť / zrušiť rezerváciu?', label: 'Správa pre klienta (nepovinné, príde e-mailom)', confirm: 'Zrušiť rezerváciu', textarea: true });
      if (note === null) return;
      try {
        await api.del('/deactivate_reservation_by_admin/', { id: r.id, note });
        toast('Rezervácia bola zrušená.');
        load();
      } catch (error) { toastError(error); }
    }

    function open(r) {
      router.push(`/sprava/rezervacie/${r.id}`);
    }

    function monthLabel(ym) {
      const [y, m] = ym.split('-').map(Number);
      return `${MONTHS[m - 1].slice(0, 3)} ${String(y).slice(2)}`;
    }

    function escapeHtml(value) {
      return String(value || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    onMounted(load);

    return { loading, data, greeting, store, workerColors, trendMax, approve, reject, open, monthLabel, fmtDate, fmtDateTime, relativeDay, plural, formatPrice, STATUS_META, todayISO };
  },
  template: `
    <div>
      <a-page-head :title="greeting + (store.user.name ? ', ' + store.user.name : '') + '!'" :subtitle="'Prehľad prevádzky – ' + relativeDay(todayISO()).toLowerCase() + ', ' + fmtDate(todayISO())">
        <router-link class="adm-btn is-soft" to="/sprava/kalendar"><i class="fa-solid fa-calendar-days"></i> Kalendár</router-link>
        <router-link class="adm-btn is-primary" to="/sprava/rezervacie/nova"><i class="fa-solid fa-plus"></i> Nová rezervácia</router-link>
      </a-page-head>

      <div v-if="loading" class="adm-loading"><i class="fa-solid fa-spinner fa-spin"></i> Načítavam…</div>
      <template v-else-if="data">
        <div class="adm-stats">
          <router-link to="/sprava/rezervacie?status=pending" class="adm-stat">
            <span class="adm-stat-icon is-amber"><i class="fa-solid fa-hourglass-half"></i></span>
            <div><strong>{{ data.pending_count }}</strong><span>čaká na schválenie</span></div>
          </router-link>
          <div class="adm-stat">
            <span class="adm-stat-icon"><i class="fa-solid fa-calendar-day"></i></span>
            <div><strong>{{ data.today.length }}</strong><span>{{ plural(data.today.length, 'masáž', 'masáže', 'masáží') }} dnes</span></div>
          </div>
          <div class="adm-stat">
            <span class="adm-stat-icon is-blue"><i class="fa-solid fa-calendar-week"></i></span>
            <div><strong>{{ data.stats.next7 }}</strong><span>najbližších 7 dní</span></div>
          </div>
          <router-link to="/sprava/kalendar" class="adm-stat">
            <span class="adm-stat-icon"><i class="fa-solid fa-calendar-check"></i></span>
            <div><strong>{{ data.tomorrow.length }}</strong><span>{{ plural(data.tomorrow.length, 'masáž', 'masáže', 'masáží') }} zajtra</span></div>
          </router-link>
        </div>

        <div class="adm-cols">
          <div>
            <a-card v-if="data.pending.length" title="Čaká na schválenie" icon="fa-hourglass-half" description="Nové rezervácie od klientov. Termín je pre ostatných zablokovaný, kým ho neschválite alebo nezrušíte.">
              <div class="adm-rows">
                <div v-for="r in data.pending" :key="r.id" class="adm-row">
                  <div class="adm-row-time">{{ r.time_from }}<small>{{ relativeDay(r.date) }}</small></div>
                  <div class="adm-row-main" style="cursor:pointer" @click="open(r)">
                    <strong>{{ r.name_surname }}</strong>
                    <span><span class="adm-dot" :style="{ background: workerColors[r.worker] }"></span> {{ r.worker }} · {{ r.massage_name || 'Masáž' }}<template v-if="r.special_request"> · „{{ r.special_request }}“</template></span>
                  </div>
                  <div class="adm-row-actions">
                    <button class="adm-btn is-success is-sm" @click="approve(r)"><i class="fa-solid fa-check"></i><span class="hide-sm"> Schváliť</span></button>
                    <button class="adm-icon-btn is-danger" title="Zamietnuť" @click="reject(r)"><i class="fa-solid fa-xmark"></i></button>
                  </div>
                </div>
              </div>
            </a-card>

            <a-card v-for="day in [{ key: 'today', label: 'Dnes', list: data.today }, { key: 'tomorrow', label: 'Zajtra', list: data.tomorrow }]" :key="day.key"
                    :title="day.label + ' – ' + day.list.length + ' ' + plural(day.list.length, 'rezervácia', 'rezervácie', 'rezervácií')"
                    :icon="day.key === 'today' ? 'fa-sun' : 'fa-forward'">
              <a-empty v-if="!day.list.length" icon="fa-mug-hot" :text="day.key === 'today' ? 'Dnes nie sú žiadne rezervácie.' : 'Na zajtra zatiaľ nie sú žiadne rezervácie.'" />
              <div v-else class="adm-rows">
                <div v-for="r in day.list" :key="r.id" class="adm-row is-clickable" @click="open(r)">
                  <div class="adm-row-time">{{ r.time_from }}<small>do {{ r.time_to }}</small></div>
                  <div class="adm-row-main">
                    <strong>{{ r.name_surname }}</strong>
                    <span><span class="adm-dot" :style="{ background: workerColors[r.worker] }"></span> {{ r.worker }} · {{ r.massage_name || 'Masáž' }}<template v-if="r.phone_number"> · {{ r.phone_number }}</template></span>
                  </div>
                  <span class="adm-badge" :class="STATUS_META[r.status_key].cls">{{ STATUS_META[r.status_key].label }}</span>
                </div>
              </div>
            </a-card>
          </div>

          <div>
            <a-card title="Tento mesiac" icon="fa-chart-simple">
              <p class="adm-small adm-muted" style="margin:0 0 .2rem">
                Spolu {{ data.stats.month }} {{ plural(data.stats.month, 'rezervácia', 'rezervácie', 'rezervácií') }},
                zrušených {{ data.stats.month_cancelled }}. Tento týždeň {{ data.stats.week }}.
              </p>
              <div class="adm-bars" aria-label="Počet rezervácií za posledných 6 mesiacov">
                <div v-for="m in data.trend" :key="m.month" class="adm-bar" :title="m.count + ' rezervácií'">
                  <b>{{ m.count }}</b>
                  <div class="adm-bar-stack" :style="{ height: Math.max(4, m.count / trendMax * 100) + '%' }">
                    <div style="height:100%;background:#0f7e7a"></div>
                  </div>
                  <small>{{ monthLabel(m.month) }}</small>
                </div>
              </div>
            </a-card>

            <a-card title="Voľno a obmedzenia" icon="fa-umbrella-beach" description="Najbližších 14 dní">
              <template #actions><router-link to="/sprava/rozvrh" class="adm-btn is-ghost is-sm">Upraviť</router-link></template>
              <a-empty v-if="!data.upcoming_off.length" icon="fa-calendar-check" text="Žiadne naplánované voľno." />
              <div v-else class="adm-rows">
                <div v-for="o in data.upcoming_off" :key="o.id" class="adm-row">
                  <div class="adm-row-main">
                    <strong>{{ relativeDay(o.date) }}</strong>
                    <span><span class="adm-dot" :style="{ background: workerColors[o.worker] }"></span> {{ o.worker }} · {{ o.whole_day ? 'celý deň' : o.time_from + '–' + o.time_to }}</span>
                  </div>
                </div>
              </div>
            </a-card>

            <a-card title="Posledné hodnotenia" icon="fa-star">
              <template #actions><router-link to="/sprava/hodnotenia" class="adm-btn is-ghost is-sm">Všetky</router-link></template>
              <p class="adm-small adm-muted" style="margin-top:0">Priemer {{ data.stats.reviews_avg || '–' }} ★ z {{ data.stats.reviews }} {{ plural(data.stats.reviews, 'hodnotenia', 'hodnotení', 'hodnotení') }}</p>
              <a-empty v-if="!data.latest_reviews.length" icon="fa-star" text="Zatiaľ žiadne hodnotenia." />
              <div v-else class="adm-rows">
                <div v-for="r in data.latest_reviews" :key="r.id" class="adm-row">
                  <div class="adm-row-main">
                    <strong>{{ r.name_surname }} <span style="color:#f59e0b">{{ '★'.repeat(r.stars) }}</span></strong>
                    <span>{{ r.message }}</span>
                  </div>
                </div>
              </div>
            </a-card>
          </div>
        </div>
      </template>
    </div>
  `,
});
