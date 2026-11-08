// Informational cookie notice. The site uses only strictly necessary cookies,
// so no consent choice is needed – just a dismissable notice with a link.
const { defineComponent, ref, computed } = Vue;

import { store, tr, section } from '../store.js';

const STORAGE_KEY = 'cookie_notice';

export const CookieBanner = defineComponent({
  name: 'CookieBanner',
  setup() {
    let dismissed = false;
    try { dismissed = localStorage.getItem(STORAGE_KEY) === '1'; } catch (e) { dismissed = false; }
    const visible = ref(!dismissed);
    const config = computed(() => section('legal').cookie_banner || {});
    function close() {
      visible.value = false;
      try { localStorage.setItem(STORAGE_KEY, '1'); } catch (e) { /* ignore */ }
    }
    return { store, tr, visible, config, close };
  },
  template: `
    <div v-if="visible && config.enabled !== false && tr(config.text)" class="cookie-banner" role="region" aria-label="Cookies">
      <i class="fa-solid fa-cookie-bite"></i>
      <p>
        {{ tr(config.text) }}
        <router-link to="/cookies/">{{ store.language === 'en' ? 'More information' : 'Viac informácií' }}</router-link>
      </p>
      <button type="button" class="btn btn-primary-strong" @click="close">{{ tr(config.button) || 'OK' }}</button>
    </div>
  `,
});
