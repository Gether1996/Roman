// Shell of the superadmin panel: login gate, sidebar navigation, toasts.
const { defineComponent, ref, computed, onMounted, onBeforeUnmount, watch } = Vue;

import { store } from '../store.js';
import { fetchJSON } from '../utils/api.js';
import { api, ui, confirmDialog, errorMessage, setShowEnglish, todayISO, relativeDay } from './ui.js';
import { dirtyEditors } from './useContent.js';

export const ADMIN_NAV = [
  {
    group: 'Prehľad',
    items: [
      { to: '/sprava', label: 'Nástenka', icon: 'fa-gauge-high', exact: true },
      { to: '/sprava/rezervacie', label: 'Rezervácie', icon: 'fa-list-check', badge: 'pending' },
      { to: '/sprava/kalendar', label: 'Kalendár', icon: 'fa-calendar-days' },
    ],
  },
  {
    group: 'Prevádzka',
    items: [
      { to: '/sprava/rozvrh', label: 'Rozvrh a voľno', icon: 'fa-clock' },
      { to: '/sprava/sluzby', label: 'Služby a cenník', icon: 'fa-tags' },
      { to: '/sprava/terapeuti', label: 'Terapeuti', icon: 'fa-user-doctor' },
    ],
  },
  {
    group: 'Obsah webu',
    items: [
      { to: '/sprava/uvod', label: 'Úvodná stránka', icon: 'fa-house' },
      { to: '/sprava/banner', label: 'Banner a akcie', icon: 'fa-bullhorn' },
      { to: '/sprava/techniky', label: 'Techniky', icon: 'fa-spa' },
      { to: '/sprava/galeria', label: 'Galéria a poukážky', icon: 'fa-images' },
      { to: '/sprava/kontakt', label: 'Kontakt a firma', icon: 'fa-address-card' },
      { to: '/sprava/pravne', label: 'Podmienky a GDPR', icon: 'fa-scale-balanced' },
      { to: '/sprava/texty', label: 'Texty a preklady', icon: 'fa-language' },
    ],
  },
  {
    group: 'Klienti',
    items: [
      { to: '/sprava/hodnotenia', label: 'Hodnotenia', icon: 'fa-star' },
      { to: '/sprava/klienti', label: 'Klienti a účty', icon: 'fa-users' },
    ],
  },
  {
    group: 'Systém',
    items: [
      { to: '/sprava/historia', label: 'História zmien', icon: 'fa-clock-rotate-left' },
      { to: '/sprava/nastavenia', label: 'Nastavenia', icon: 'fa-gear' },
    ],
  },
];

const AdminLogin = defineComponent({
  name: 'AdminLogin',
  setup() {
    const email = ref('');
    const password = ref('');
    const error = ref('');
    const loading = ref(false);
    async function submit() {
      error.value = '';
      if (!email.value || !password.value) {
        error.value = 'Zadajte e-mail a heslo.';
        return;
      }
      loading.value = true;
      try {
        await fetchJSON('/login_api/', { method: 'POST', body: JSON.stringify({ email: email.value, password: password.value }) });
        await store.bootstrap();
        if (!store.isSuperuser) {
          error.value = 'Tento účet nemá prístup do administrácie.';
        }
      } catch (err) {
        error.value = errorMessage(err, 'Prihlásenie zlyhalo.');
      } finally {
        loading.value = false;
      }
    }
    return { email, password, error, loading, submit, store };
  },
  template: `
    <div class="adm-login">
      <form class="adm-login-card" @submit.prevent="submit">
        <img src="/static/images/mandala.png" alt="" class="adm-login-logo" />
        <h1>Administrácia</h1>
        <p>Masáže Vlčince – prihlásenie pre správcu webu</p>
        <p v-if="store.isAuthenticated && !store.isSuperuser" class="adm-alert is-warning">
          Ste prihlásený ako {{ store.user.email }}, tento účet však nemá oprávnenie správcu.
        </p>
        <label class="adm-field"><span class="adm-label">E-mail</span><input v-model.trim="email" type="email" autocomplete="username" /></label>
        <label class="adm-field"><span class="adm-label">Heslo</span><input v-model="password" type="password" autocomplete="current-password" /></label>
        <p v-if="error" class="adm-alert is-error">{{ error }}</p>
        <button class="adm-btn is-primary is-block" :disabled="loading">
          <i class="fa-solid" :class="loading ? 'fa-spinner fa-spin' : 'fa-right-to-bracket'"></i> Prihlásiť sa
        </button>
        <router-link to="/" class="adm-login-back"><i class="fa-solid fa-arrow-left"></i> Späť na web</router-link>
      </form>
    </div>
  `,
});

export const AdminLayout = defineComponent({
  name: 'AdminLayout',
  components: { AdminLogin },
  setup() {
    const route = VueRouter.useRoute();
    const router = VueRouter.useRouter();
    let pendingTimer = null;

    const currentItem = computed(() => {
      const items = ADMIN_NAV.flatMap((g) => g.items);
      return items.filter((i) => (i.exact ? route.path.replace(/\/$/, '') === i.to : route.path.startsWith(i.to)))
        .sort((a, b) => b.to.length - a.to.length)[0];
    });

    function isActive(item) {
      return currentItem.value === item;
    }

    async function refreshPending() {
      if (!store.isSuperuser) return;
      try {
        const data = await api.get('/api/admin/reservations/?status=pending&when=upcoming&per_page=5');
        ui.pendingCount = data.pending_count || 0;
      } catch (e) { /* ignore */ }
    }

    async function logout() {
      if (!(await confirmDialog({ title: 'Odhlásiť sa z administrácie?', confirm: 'Odhlásiť sa' }))) return;
      window.location.href = '/logout/';
    }

    function beforeUnload(event) {
      if (dirtyEditors.size) {
        event.preventDefault();
        event.returnValue = '';
      }
    }

    const removeGuard = router.beforeEach(async (to, from) => {
      if (!from.path.startsWith('/sprava') || to.path === from.path) return true;
      if (dirtyEditors.size) {
        const ok = await confirmDialog({ title: 'Máte neuložené zmeny', text: 'Ak odídete, zmeny sa stratia.', confirm: 'Odísť bez uloženia', danger: true, icon: 'warning' });
        if (!ok) return false;
        dirtyEditors.clear();
      }
      return true;
    });

    watch(() => route.path, () => { ui.sidebarOpen = false; window.scrollTo({ top: 0 }); });
    watch(() => store.isSuperuser, (value) => { if (value) refreshPending(); });

    onMounted(() => {
      document.body.classList.add('adm-body');
      window.addEventListener('beforeunload', beforeUnload);
      refreshPending();
      pendingTimer = setInterval(refreshPending, 60000);
    });
    onBeforeUnmount(() => {
      document.body.classList.remove('adm-body');
      window.removeEventListener('beforeunload', beforeUnload);
      clearInterval(pendingTimer);
      removeGuard();
    });

    const todayLabel = computed(() => relativeDay(todayISO()).replace(/^Dnes$/, `Dnes, ${todayISO().split('-').reverse().join('. ')}`));

    return { store, ui, nav: ADMIN_NAV, isActive, currentItem, logout, setShowEnglish, todayLabel, refreshPending };
  },
  template: `
    <div v-if="!store.isSuperuser" class="adm-root"><admin-login /></div>
    <div v-else class="adm-root adm-shell" :class="{ 'is-sidebar-open': ui.sidebarOpen }">
      <aside class="adm-sidebar">
        <div class="adm-brand">
          <img src="/static/images/mandala.png" alt="" />
          <div><strong>Masáže Vlčince</strong><span>Administrácia</span></div>
        </div>
        <nav class="adm-nav">
          <div v-for="group in nav" :key="group.group" class="adm-nav-group">
            <span class="adm-nav-title">{{ group.group }}</span>
            <router-link v-for="item in group.items" :key="item.to" :to="item.to" class="adm-nav-link" :class="{ active: isActive(item) }">
              <i class="fa-solid" :class="item.icon"></i>
              <span>{{ item.label }}</span>
              <b v-if="item.badge === 'pending' && ui.pendingCount" class="adm-nav-badge">{{ ui.pendingCount }}</b>
            </router-link>
          </div>
        </nav>
        <div class="adm-sidebar-foot">
          <a href="/" target="_blank" class="adm-nav-link"><i class="fa-solid fa-arrow-up-right-from-square"></i><span>Zobraziť web</span></a>
          <a href="/admin/" target="_blank" class="adm-nav-link is-muted"><i class="fa-solid fa-database"></i><span>Pokročilá správa dát</span></a>
        </div>
      </aside>
      <div class="adm-sidebar-backdrop" @click="ui.sidebarOpen = false"></div>

      <div class="adm-main">
        <header class="adm-topbar">
          <button class="adm-icon-btn adm-burger" @click="ui.sidebarOpen = !ui.sidebarOpen" aria-label="Menu"><i class="fa-solid fa-bars"></i></button>
          <div class="adm-topbar-title">
            <i v-if="currentItem" class="fa-solid" :class="currentItem.icon"></i>
            <span>{{ currentItem ? currentItem.label : 'Administrácia' }}</span>
          </div>
          <div class="adm-topbar-right">
            <span class="adm-today hide-sm"><i class="fa-regular fa-calendar"></i> {{ todayLabel }}</span>
            <label class="adm-mini-toggle hide-sm" title="Zobraziť polia pre anglickú verziu webu">
              <input type="checkbox" :checked="ui.showEnglish" @change="setShowEnglish($event.target.checked)" />
              <span class="adm-toggle-track"><span class="adm-toggle-thumb"></span></span>
              <span>EN preklady</span>
            </label>
            <router-link to="/sprava/rezervacie/nova" class="adm-btn is-primary is-sm"><i class="fa-solid fa-plus"></i><span class="hide-sm"> Nová rezervácia</span></router-link>
            <router-link to="/" class="adm-btn is-soft is-sm adm-back-web" title="Späť na web">
              <i class="fa-solid fa-arrow-left"></i><span class="hide-sm"> Späť na web</span>
            </router-link>
            <button class="adm-user" @click="logout" title="Odhlásiť sa">
              <span class="adm-avatar">{{ (store.user.name || store.user.email || 'A').slice(0, 1).toUpperCase() }}</span>
              <i class="fa-solid fa-right-from-bracket"></i>
            </button>
          </div>
        </header>
        <main class="adm-content">
          <router-view :key="$route.path.startsWith('/sprava/rezervacie') ? 'res' : $route.path" @pending-changed="refreshPending" />
        </main>
      </div>

      <div class="adm-toasts" aria-live="polite">
        <div v-for="t in ui.toasts" :key="t.id" class="adm-toast" :class="'is-' + t.type">
          <i class="fa-solid" :class="t.type === 'error' ? 'fa-circle-exclamation' : t.type === 'info' ? 'fa-circle-info' : 'fa-circle-check'"></i>
          <span>{{ t.message }}</span>
        </div>
      </div>
    </div>
  `,
});
