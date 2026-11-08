// Obchodné podmienky, ochrana osobných údajov, cookies a texty rezervácie.
const { defineComponent, ref } = Vue;

import { adminComponents } from '../components.js';
import { useSections } from '../useContent.js';

const DOCS = [
  { key: 'terms', label: 'Obchodné podmienky', icon: 'fa-file-contract', url: '/obchodne-podmienky/' },
  { key: 'privacy', label: 'Ochrana osobných údajov', icon: 'fa-user-shield', url: '/ochrana-osobnych-udajov/' },
  { key: 'cookies', label: 'Cookies', icon: 'fa-cookie-bite', url: '/cookies/' },
];

export const LegalAdminView = defineComponent({
  name: 'LegalAdminView',
  components: { ...adminComponents },
  setup() {
    const editor = useSections(['legal', 'booking']);
    const tab = ref('terms');
    return { ...editor, DOCS, tab };
  },
  template: `
    <div>
      <a-page-head title="Podmienky a GDPR" subtitle="Obchodné podmienky, ochrana osobných údajov, informácie o cookies a texty rezervačného formulára." />

      <div v-if="!ready" class="adm-loading"><i class="fa-solid fa-spinner fa-spin"></i> Načítavam…</div>
      <template v-else>
        <p class="adm-alert is-info">
          <i class="fa-solid fa-circle-info"></i>
          <span>Pripravili sme vzorové texty podľa slovenských predpisov (GDPR, ochrana spotrebiteľa). Skontrolujte ich prosím a doplňte údaje o prevádzkovateľovi v sekcii
          <router-link to="/sprava/kontakt">Kontakt a firma</router-link> – tie sa do dokumentov doplnia automaticky.</span>
        </p>

        <a-card title="Právne dokumenty" icon="fa-scale-balanced">
          <div class="adm-btn-group" style="margin-bottom:1.1rem">
            <button v-for="doc in DOCS" :key="doc.key" type="button" :class="{ active: tab === doc.key }" @click="tab = doc.key">
              <i class="fa-solid" :class="doc.icon"></i> {{ doc.label }}
            </button>
          </div>

          <template v-for="doc in DOCS" :key="doc.key">
            <div v-if="tab === doc.key">
              <div class="adm-grid-2">
                <bi-input v-model="draft.legal[doc.key].title" label="Nadpis" />
                <a-field label="Platné od" hint="Pri väčšej zmene dokumentu aktualizujte dátum.">
                  <date-input v-model="draft.legal[doc.key].updated" />
                </a-field>
              </div>
              <bi-input v-model="draft.legal[doc.key].body" label="Text dokumentu" multiline :rows="18"
                        hint="Formátovanie: riadok začínajúci „## “ je nadpis, riadok začínajúci „- “ je odrážka, prázdny riadok oddeľuje odseky." />
              <a :href="doc.url" target="_blank" class="adm-btn is-soft is-sm"><i class="fa-solid fa-arrow-up-right-from-square"></i> Zobraziť na webe</a>
            </div>
          </template>
        </a-card>

        <a-card title="Cookie lišta" icon="fa-cookie" description="Web používa iba nevyhnutné cookies (prihlásenie, bezpečnosť formulárov, jazyk), preto nie je potrebný súhlas – stačí informačná lišta s odkazom na zásady cookies.">
          <a-toggle v-model="draft.legal.cookie_banner.enabled" label="Zobrazovať informačnú lištu o cookies" hint="Návštevník ju zavrie tlačidlom a viac sa mu nezobrazí." />
          <bi-input v-model="draft.legal.cookie_banner.text" label="Text lišty" multiline :rows="3" />
          <bi-input v-model="draft.legal.cookie_banner.button" label="Text tlačidla" />
        </a-card>

        <a-card title="Rezervačný formulár" icon="fa-calendar-check">
          <div class="adm-grid-2">
            <bi-input v-model="draft.booking.title" label="Nadpis stránky rezervácie" />
            <bi-input v-model="draft.booking.subtitle" label="Podnadpis" />
          </div>
          <bi-input v-model="draft.booking.notice" label="Oznam nad formulárom" multiline :rows="2"
                    hint="Napr. „Od 20. 12. do 2. 1. máme dovolenku.“ Ak je prázdne, oznam sa nezobrazí." />
          <bi-input v-model="draft.booking.success_message" label="Správa po odoslaní rezervácie" multiline :rows="2" />
          <a-toggle v-model="draft.booking.require_consent" label="Vyžadovať súhlas s podmienkami pri rezervácii"
                    hint="Odporúčame nechať zapnuté – klient potvrdí, že súhlasí s obchodnými podmienkami a berie na vedomie spracovanie osobných údajov." />
        </a-card>
      </template>

      <save-bar :dirty="dirty" :saving="saving" @save="save()" @discard="discard()" @history="showHistory()" @reset="resetToDefaults()" />
    </div>
  `,
});
