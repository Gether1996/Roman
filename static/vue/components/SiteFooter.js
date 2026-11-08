const { defineComponent, computed } = Vue;

import { store, tr, section } from '../store.js';

export const SiteFooter = defineComponent({
  name: 'SiteFooter',
  setup() {
    const general = computed(() => section('general'));
    const contact = computed(() => section('contact'));
    const year = new Date().getFullYear();
    const company = computed(() => {
      const c = contact.value;
      return [c.company_name, c.company_address, c.company_ico ? `IČO: ${c.company_ico}` : '', c.company_dic ? `DIČ: ${c.company_dic}` : '']
        .filter(Boolean).join(' · ');
    });
    const labels = computed(() => (store.language === 'en'
      ? { terms: 'Terms & conditions', privacy: 'Privacy policy', cookies: 'Cookies' }
      : { terms: 'Obchodné podmienky', privacy: 'Ochrana osobných údajov', cookies: 'Cookies' }));
    return { store, tr, general, contact, company, year, labels };
  },
  template: `
    <footer class="app-footer">
      <div class="container-shell footer-inner footer-inner-rich">
        <div class="footer-col">
          <span class="footer-brand">{{ tr(general.footer_text) || general.site_name || 'Masáže Vlčince' }}</span>
          <span class="footer-copy">© {{ year }}</span>
          <span v-if="company" class="footer-company">{{ company }}</span>
          <span v-if="contact.company_register" class="footer-company">{{ contact.company_register }}</span>
        </div>
        <nav class="footer-links">
          <router-link to="/obchodne-podmienky/">{{ labels.terms }}</router-link>
          <router-link to="/ochrana-osobnych-udajov/">{{ labels.privacy }}</router-link>
          <router-link to="/cookies/">{{ labels.cookies }}</router-link>
        </nav>
      </div>
    </footer>
  `,
});
