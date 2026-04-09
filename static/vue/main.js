const { createApp, defineComponent, h } = Vue;

import { store } from './store.js';
import { messages } from './messages.js';
import { AppNavbar } from './components/AppNavbar.js';
import { AuthModal } from './components/AuthModal.js';
import { HomeView } from './views/HomeView.js';
import { ReservationView } from './views/ReservationView.js';
import { ProfileView } from './views/ProfileView.js';
import { AllReservationsView } from './views/AllReservationsView.js';
import { SettingsView } from './views/SettingsView.js';
import { CalendarAdminView } from './views/CalendarAdminView.js';

const i18n = VueI18n.createI18n({
  legacy: false,
  locale: 'sk',
  fallbackLocale: 'sk',
  messages,
});

const routes = [
  { path: '/', component: HomeView, meta: { title: 'Masáže Vlčince' } },
  { path: '/reservation/', component: ReservationView, meta: { title: 'Reservation' } },
  { path: '/profile/', component: ProfileView, meta: { title: 'Profile' } },
  { path: '/all_reservations/', component: AllReservationsView, meta: { title: 'Reservations' } },
  { path: '/settings_view/', component: SettingsView, meta: { title: 'Settings' } },
  { path: '/calendar_view_admin/', component: CalendarAdminView, meta: { title: 'Calendar' } },
  { path: '/:pathMatch(.*)*', component: HomeView, meta: { title: 'Masáže Vlčince' } },
];

const router = VueRouter.createRouter({
  history: VueRouter.createWebHistory(),
  routes,
});

router.afterEach((to) => {
  document.title = to.meta?.title || 'Masáže Vlčince';
});

const AppRoot = defineComponent({
  name: 'AppRoot',
  components: {
    AppNavbar,
    AuthModal,
  },
  template: `
    <div class="app-shell">
      <app-navbar />
      <main class="app-main">
        <router-view />
      </main>
      <footer class="app-footer">
        <div class="container-shell footer-inner">
          <span class="footer-brand">Masáže Vlčince</span>
          <span class="footer-copy">© 2026</span>
        </div>
      </footer>
      <auth-modal />
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
    i18n.global.locale.value = store.language;
    document.documentElement.lang = store.language;
    app.mount('#app');
  });
