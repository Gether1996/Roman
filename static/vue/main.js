const { createApp, defineComponent, h, computed, watch } = Vue;

import { store } from './store.js';
import { messages } from './messages.js';
import { AppNavbar } from './components/AppNavbar.js';
import { AuthModal } from './components/AuthModal.js';
import { SiteFooter } from './components/SiteFooter.js';
import { CookieBanner } from './components/CookieBanner.js';
import { HomeView } from './views/HomeView.js';
import { ReservationView } from './views/ReservationView.js';
import { ProfileView } from './views/ProfileView.js';
import { LegalView } from './views/LegalView.js';

const i18n = VueI18n.createI18n({
  legacy: false,
  locale: 'sk',
  fallbackLocale: 'sk',
  messages: JSON.parse(JSON.stringify(messages)),
});

/** Apply label overrides edited in the admin panel (Texty a preklady). */
function applyTextOverrides(texts) {
  for (const lang of ['sk', 'en']) {
    const merged = JSON.parse(JSON.stringify(messages[lang]));
    const overrides = (texts && texts[lang]) || {};
    for (const [path, value] of Object.entries(overrides)) {
      if (typeof value !== 'string' || !value.trim()) continue;
      const parts = path.split('.');
      let node = merged;
      for (let i = 0; i < parts.length - 1; i += 1) {
        if (typeof node[parts[i]] !== 'object' || node[parts[i]] === null) break;
        node = node[parts[i]];
      }
      const last = parts[parts.length - 1];
      if (node && Object.prototype.hasOwnProperty.call(node, last)) {
        node[last] = value.replace(/[{}@|$]/g, '');
      }
    }
    i18n.global.setLocaleMessage(lang, merged);
  }
}

// Admin panel views are loaded lazily – regular visitors never download them.
const admin = (file, name) => () => import(`./admin/views/${file}.js`).then((m) => m[name]);
const AdminLayout = () => import('./admin/AdminLayout.js').then((m) => m.AdminLayout);

const routes = [
  { path: '/', component: HomeView, meta: { title: null } },
  { path: '/reservation/', component: ReservationView, meta: { title: { sk: 'Rezervácia', en: 'Reservation' } } },
  { path: '/profile/', component: ProfileView, meta: { title: { sk: 'Môj profil', en: 'My profile' } } },
  { path: '/obchodne-podmienky/', component: LegalView, props: { page: 'terms' }, meta: { title: { sk: 'Obchodné podmienky', en: 'Terms' } } },
  { path: '/ochrana-osobnych-udajov/', component: LegalView, props: { page: 'privacy' }, meta: { title: { sk: 'Ochrana osobných údajov', en: 'Privacy policy' } } },
  { path: '/cookies/', component: LegalView, props: { page: 'cookies' }, meta: { title: { sk: 'Cookies', en: 'Cookies' } } },
  // Old admin URLs (used in e-mails / bookmarks) → new admin panel
  { path: '/all_reservations/', redirect: '/sprava/rezervacie' },
  { path: '/calendar_view_admin/', redirect: '/sprava/kalendar' },
  { path: '/settings_view/', redirect: '/sprava/rozvrh' },
  {
    path: '/sprava',
    component: AdminLayout,
    meta: { admin: true },
    children: [
      { path: '', component: admin('DashboardView', 'DashboardView'), meta: { admin: true, title: 'Nástenka' } },
      { path: 'rezervacie', component: admin('ReservationsView', 'ReservationsView'), meta: { admin: true, title: 'Rezervácie' } },
      { path: 'rezervacie/nova', component: admin('ReservationsView', 'ReservationsView'), meta: { admin: true, title: 'Nová rezervácia' } },
      { path: 'rezervacie/:id', component: admin('ReservationsView', 'ReservationsView'), meta: { admin: true, title: 'Rezervácia' } },
      { path: 'kalendar', component: admin('CalendarView', 'CalendarView'), meta: { admin: true, title: 'Kalendár' } },
      { path: 'rozvrh', component: admin('ScheduleView', 'ScheduleView'), meta: { admin: true, title: 'Rozvrh a voľno' } },
      { path: 'sluzby', component: admin('ServicesView', 'ServicesView'), meta: { admin: true, title: 'Služby a cenník' } },
      { path: 'terapeuti', component: admin('TherapistsView', 'TherapistsView'), meta: { admin: true, title: 'Terapeuti' } },
      { path: 'uvod', component: admin('HomepageView', 'HomepageView'), meta: { admin: true, title: 'Úvodná stránka' } },
      { path: 'banner', component: admin('BannerView', 'BannerView'), meta: { admin: true, title: 'Banner a akcie' } },
      { path: 'techniky', component: admin('TechniquesView', 'TechniquesView'), meta: { admin: true, title: 'Techniky' } },
      { path: 'galeria', component: admin('MediaView', 'MediaView'), meta: { admin: true, title: 'Galéria a poukážky' } },
      { path: 'kontakt', component: admin('ContactView', 'ContactView'), meta: { admin: true, title: 'Kontakt a firma' } },
      { path: 'pravne', component: admin('LegalAdminView', 'LegalAdminView'), meta: { admin: true, title: 'Podmienky a GDPR' } },
      { path: 'texty', component: admin('TextsView', 'TextsView'), meta: { admin: true, title: 'Texty a preklady' } },
      { path: 'hodnotenia', component: admin('ReviewsView', 'ReviewsView'), meta: { admin: true, title: 'Hodnotenia' } },
      { path: 'klienti', component: admin('ClientsView', 'ClientsView'), meta: { admin: true, title: 'Klienti a účty' } },
      { path: 'nastavenia', component: admin('SettingsAdminView', 'SettingsAdminView'), meta: { admin: true, title: 'Nastavenia' } },
      { path: 'historia', component: admin('HistoryView', 'HistoryView'), meta: { admin: true, title: 'História zmien' } },
      { path: ':pathMatch(.*)*', redirect: '/sprava' },
    ],
  },
  { path: '/:pathMatch(.*)*', component: HomeView, meta: { title: null } },
];

const router = VueRouter.createRouter({
  history: VueRouter.createWebHistory(),
  routes,
  scrollBehavior(to, from, saved) {
    if (saved) return saved;
    if (to.path !== from.path) return { top: 0 };
    return undefined;
  },
});

function updateTitle(route) {
  const general = store.content?.general || {};
  const siteName = general.site_name || 'Masáže Vlčince';
  const title = route.meta?.title;
  if (route.meta?.admin) {
    document.title = `${title || 'Administrácia'} · Správa webu`;
  } else if (title) {
    document.title = `${typeof title === 'string' ? title : (title[store.language] || title.sk)} · ${siteName}`;
  } else {
    const seo = general.seo_title || {};
    document.title = seo[store.language] || seo.sk || siteName;
  }
}

router.afterEach((to) => updateTitle(to));

const AppRoot = defineComponent({
  name: 'AppRoot',
  components: { AppNavbar, AuthModal, SiteFooter, CookieBanner },
  setup() {
    const route = VueRouter.useRoute();
    const isAdmin = computed(() => route.path.startsWith('/sprava'));
    watch(() => store.content?.texts, (texts) => applyTextOverrides(texts), { deep: true });
    watch(() => store.language, () => updateTitle(route));
    return { isAdmin };
  },
  template: `
    <router-view v-if="isAdmin" />
    <div v-else class="app-shell">
      <app-navbar />
      <main class="app-main">
        <router-view />
      </main>
      <site-footer />
      <auth-modal />
      <cookie-banner />
    </div>
  `,
});

const app = createApp({
  render: () => h(AppRoot),
});

app.directive('reveal', {
  mounted(el) {
    el.classList.add('reveal-block');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    observer.observe(el);
  },
});

app.use(router);
app.use(i18n);

store.bootstrap()
  .catch(() => null)
  .finally(() => {
    applyTextOverrides(store.content?.texts);
    i18n.global.locale.value = store.language;
    document.documentElement.lang = store.language;
    app.mount('#app');
  });
