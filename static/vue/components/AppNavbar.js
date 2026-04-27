const { defineComponent, ref, computed } = Vue;
const { useI18n } = VueI18n;

import { store } from '../store.js';
import { fetchJSON } from '../utils/api.js';

export const AppNavbar = defineComponent({
  name: 'AppNavbar',
  setup() {
    const { t, locale } = useI18n();
    const router = VueRouter.useRouter();
    const route = VueRouter.useRoute();
    const menuOpen = ref(false);
    const userMenuOpen = ref(false);

    const isHome = computed(() => route.path === '/');

    async function switchLanguage(language) {
      await fetchJSON(`/switch_language/${language}/`, { method: 'POST' });
      store.language = language;
      locale.value = language;
      document.documentElement.lang = language;
    }

    function openAuth(mode) {
      store.openAuth(mode);
      menuOpen.value = false;
      userMenuOpen.value = false;
    }

    async function goToSection(sectionId) {
      menuOpen.value = false;

      if (route.path !== '/') {
        await router.push('/');
        await new Promise(resolve => setTimeout(resolve, 80));
      }

      const target = document.getElementById(sectionId);
      if (target) {
        const top = target.getBoundingClientRect().top + window.scrollY - 104;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    }

    function goToPath(path) {
      menuOpen.value = false;
      userMenuOpen.value = false;
      router.push(path);
    }

    function toggleUserMenu() {
      userMenuOpen.value = !userMenuOpen.value;
    }

    function closeMenus() {
      menuOpen.value = false;
      userMenuOpen.value = false;
    }

    function handleBrandClick() {
      if (isHome.value) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        goToPath('/');
      }
    }

    async function confirmLogout() {
      const result = await window.Swal.fire({
        title: t('auth.confirmLogout'),
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: t('nav.logout'),
        cancelButtonText: t('common.cancel'),
        confirmButtonColor: '#0f7e7a',
      });

      if (result.isConfirmed) {
        window.location.href = '/logout/';
      }
    }

    return {
      store,
      isHome,
      handleBrandClick,
      menuOpen,
      userMenuOpen,
      openAuth,
      switchLanguage,
      goToSection,
      goToPath,
      confirmLogout,
      toggleUserMenu,
      closeMenus,
      t,
    };
  },
  template: `
    <header class="app-nav-wrap">
      <nav class="app-nav container-shell">
        <button class="brand-button" @click="handleBrandClick">
          <img src="/static/images/mandala.png" alt="Masáže Vlčince" class="brand-logo" />
        </button>

        <button class="menu-button" @click="menuOpen = !menuOpen" :aria-label="menuOpen ? t('nav.closeMenu') : t('nav.openMenu')">
          <i class="fa-solid fa-lg" :class="menuOpen ? 'fa-xmark' : 'fa-bars'"></i>
        </button>

        <div class="nav-panel" :class="{ open: menuOpen }">
          <div class="nav-links">
            <button class="nav-link-button" @click="goToSection('techniques')">{{ t('nav.techniques') }}</button>
            <button class="nav-link-button" @click="goToSection('gallery')">{{ store.language === 'sk' ? 'Galéria/Cenník' : 'Gallery/Pricing' }}</button>
            <button class="nav-link-button" @click="goToSection('reviews')">{{ t('nav.reviews') }}</button>
            <button class="nav-link-button" @click="goToSection('contact')">{{ t('nav.contact') }}</button>
          </div>

          <div class="nav-actions">
            <button class="btn btn-primary-strong nav-reserve-button" @click="goToPath('/reservation/')">
              <i class="fa-solid fa-calendar-check"></i>
              <span>{{ t('nav.reserve') }}</span>
            </button>

            <div class="nav-quick-row">
              <a href="https://www.instagram.com/masazevlcince/" target="_blank" rel="noopener" class="social-pill" aria-label="Instagram">
                <i class="fa-brands fa-instagram"></i>
              </a>
              <a href="https://www.facebook.com/salonAminaSK" target="_blank" rel="noopener" class="social-pill" aria-label="Facebook">
                <i class="fa-brands fa-facebook-f"></i>
              </a>

              <button class="lang-pill" @click="switchLanguage(store.language === 'sk' ? 'en' : 'sk')">
                <img :src="store.language === 'sk' ? '/static/images/slovakia.png' : '/static/images/united-kingdom.png'" alt="" />
                <span>{{ store.language.toUpperCase() }}</span>
              </button>
            </div>

            <div class="user-menu-wrapper">
              <button class="user-menu-trigger nav-account-trigger" @click="toggleUserMenu()">
                <i class="fa-solid fa-user-circle"></i>
                <span class="nav-account-label">{{ store.isAuthenticated ? (store.user.name || t('nav.account')) : t('nav.account') }}</span>
                <i class="fa-solid fa-chevron-down" :class="{ rotated: userMenuOpen }"></i>
              </button>
              <div class="user-menu-dropdown" v-if="userMenuOpen" @click.stop>
                <template v-if="store.isAuthenticated">
                  <div class="user-menu-header">
                    <strong>{{ store.user.name }} {{ store.user.surname }}</strong>
                    <span>{{ store.user.email }}</span>
                  </div>
                  <div class="user-menu-divider"></div>
                  <button v-if="!store.isSuperuser" class="user-menu-item" @click="goToPath('/profile/')">
                    <i class="fa-solid fa-user"></i>
                    <span>{{ t('nav.profile') }}</span>
                  </button>
                  <template v-if="store.isSuperuser">
                    <button class="user-menu-item" @click="goToPath('/all_reservations/')">
                      <i class="fa-solid fa-list"></i>
                      <span>{{ t('nav.reservations') }}</span>
                    </button>
                    <button class="user-menu-item" @click="goToPath('/calendar_view_admin/')">
                      <i class="fa-solid fa-calendar"></i>
                      <span>{{ t('nav.calendar') }}</span>
                    </button>
                    <button class="user-menu-item" @click="goToPath('/settings_view/')">
                      <i class="fa-solid fa-cog"></i>
                      <span>{{ t('nav.settings') }}</span>
                    </button>
                  </template>
                  <div class="user-menu-divider"></div>
                  <button class="user-menu-item danger" @click="confirmLogout()">
                    <i class="fa-solid fa-right-from-bracket"></i>
                    <span>{{ t('nav.logout') }}</span>
                  </button>
                </template>
                <template v-else>
                  <button class="user-menu-item" @click="openAuth('login')">
                    <i class="fa-solid fa-right-to-bracket"></i>
                    <span>{{ t('nav.login') }}</span>
                  </button>
                  <button class="user-menu-item" @click="openAuth('register')">
                    <i class="fa-solid fa-user-plus"></i>
                    <span>{{ t('nav.register') }}</span>
                  </button>
                </template>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div class="nav-backdrop" v-if="menuOpen || userMenuOpen" @click="closeMenus()"></div>
    </header>
  `,
});
