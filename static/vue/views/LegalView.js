const { defineComponent, computed } = Vue;

import { store, tr, section } from '../store.js';
import { RichText } from '../components/RichText.js';

function fmtDate(iso) {
  const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}. ${m[2]}. ${m[1]}` : '';
}

export const LegalView = defineComponent({
  name: 'LegalView',
  components: { RichText },
  props: { page: { type: String, required: true } },
  setup(props) {
    const doc = computed(() => section('legal')[props.page] || {});
    const contact = computed(() => section('contact'));
    const general = computed(() => section('general'));
    const isEn = computed(() => store.language === 'en');
    return { store, tr, doc, contact, general, isEn, fmtDate };
  },
  template: `
    <section class="page-section container-shell legal-page">
      <div class="glass-panel legal-card">
        <span class="section-kicker">{{ general.site_name || 'Masáže Vlčince' }}</span>
        <h1>{{ tr(doc.title) }}</h1>
        <p v-if="doc.updated" class="legal-updated">{{ isEn ? 'Effective from' : 'Platné od' }}: {{ fmtDate(doc.updated) }}</p>

        <div class="legal-operator">
          <strong>{{ isEn ? 'Operator' : 'Prevádzkovateľ' }}</strong>
          <span>{{ contact.company_name || general.site_name || 'Masáže Vlčince' }}</span>
          <span v-if="contact.company_address">{{ contact.company_address }}</span>
          <span v-else-if="contact.address">{{ contact.address }}{{ contact.city ? ', ' + contact.city : '' }}</span>
          <span v-if="contact.company_ico">IČO: {{ contact.company_ico }}<template v-if="contact.company_dic"> · DIČ: {{ contact.company_dic }}</template></span>
          <span v-if="contact.company_register">{{ contact.company_register }}</span>
          <span v-if="contact.email">E-mail: <a :href="'mailto:' + contact.email">{{ contact.email }}</a></span>
          <span v-if="contact.phones && contact.phones.length">{{ isEn ? 'Phone' : 'Telefón' }}: {{ contact.phones.map(p => p.number).join(', ') }}</span>
        </div>

        <rich-text :text="tr(doc.body)" />

        <div class="legal-links">
          <router-link v-if="page !== 'terms'" to="/obchodne-podmienky/">{{ isEn ? 'Terms & conditions' : 'Obchodné podmienky' }}</router-link>
          <router-link v-if="page !== 'privacy'" to="/ochrana-osobnych-udajov/">{{ isEn ? 'Privacy policy' : 'Ochrana osobných údajov' }}</router-link>
          <router-link v-if="page !== 'cookies'" to="/cookies/">Cookies</router-link>
        </div>
      </div>
    </section>
  `,
});
