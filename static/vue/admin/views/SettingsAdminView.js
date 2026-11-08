// Všeobecné nastavenia webu, SEO, notifikácie a rezervačné pravidlá.
const { defineComponent, ref, reactive, onMounted } = Vue;

import { adminComponents } from '../components.js';
import { useSections } from '../useContent.js';
import { api, toast, toastError } from '../ui.js';

export const SettingsAdminView = defineComponent({
  name: 'SettingsAdminView',
  components: { ...adminComponents },
  setup() {
    const editor = useSections(['general']);

    const rules = reactive({ break_minutes: 15, public_lead_days: 2, admin_days_ahead: 180 });
    const rulesOriginal = ref('');
    const rulesLoading = ref(true);
    const rulesSaving = ref(false);

    async function loadRules() {
      rulesLoading.value = true;
      try {
        const data = await api.get('/api/settings-bootstrap/');
        Object.assign(rules, data.rules || {});
        rulesOriginal.value = JSON.stringify(rules);
      } catch (error) {
        toastError(error, 'Rezervačné pravidlá sa nepodarilo načítať.');
      } finally {
        rulesLoading.value = false;
      }
    }

    async function saveRules() {
      rulesSaving.value = true;
      try {
        await api.post('/save_settings/', {
          break_minutes: Number(rules.break_minutes),
          public_lead_days: Number(rules.public_lead_days),
          admin_days_ahead: Number(rules.admin_days_ahead),
        });
        rulesOriginal.value = JSON.stringify(rules);
        toast('Rezervačné pravidlá boli uložené.');
      } catch (error) {
        toastError(error, 'Pravidlá sa nepodarilo uložiť.');
      } finally {
        rulesSaving.value = false;
      }
    }

    function leadLabel(n) {
      const days = Number(n);
      if (days <= 0) return 'Klienti môžu rezervovať aj na dnešok.';
      if (days === 1) return 'Online rezervácia na dnešok je zatvorená, od zajtra je otvorená.';
      if (days === 2) return 'Dnes a zajtra je online rezervácia zatvorená (klient musí zavolať).';
      return `Najbližších ${days} dní (vrátane dneška) je online rezervácia zatvorená.`;
    }

    onMounted(loadRules);

    return { ...editor, rules, rulesOriginal, rulesLoading, rulesSaving, saveRules, leadLabel };
  },
  template: `
    <div>
      <a-page-head title="Nastavenia" subtitle="Názov webu, vyhľadávače, notifikácie a rezervačné pravidlá." />

      <div v-if="!ready" class="adm-loading"><i class="fa-solid fa-spinner fa-spin"></i> Načítavam…</div>
      <template v-else>
        <div class="adm-cols">
          <div>
            <a-card title="Základné údaje" icon="fa-globe">
              <a-field label="Názov webu / prevádzky">
                <input type="text" v-model.trim="draft.general.site_name" maxlength="100" />
              </a-field>
              <bi-input v-model="draft.general.footer_text" label="Text v pätičke" />
              <bi-input v-model="draft.general.maintenance_notice" label="Oznam na webe" multiline :rows="2"
                        hint="Ak vyplníte, zobrazí sa navrchu webu ako upozornenie (napr. „Od 20. 12. do 2. 1. máme dovolenku.“). Pre skrytie nechajte prázdne." />
            </a-card>

            <a-card title="Vyhľadávače (Google) a zdieľanie" icon="fa-magnifying-glass" description="Takto sa web zobrazuje vo výsledkoch vyhľadávania a pri zdieľaní odkazu (Facebook, Messenger…).">
              <bi-input v-model="draft.general.seo_title" label="Titulok stránky" hint="Odporúčaná dĺžka do 60 znakov." />
              <bi-input v-model="draft.general.seo_description" label="Popis stránky" multiline :rows="3"
                        :hint="'Odporúčaná dĺžka približne 155 znakov. Aktuálne (SK): ' + (draft.general.seo_description?.sk || '').length + ' znakov.'" />
              <div class="adm-preview">
                <span class="adm-preview-label">Náhľad vo vyhľadávaní</span>
                <div class="adm-serp">
                  <span class="adm-serp-url">masazevlcince.sk</span>
                  <strong class="adm-serp-title">{{ draft.general.seo_title?.sk || draft.general.site_name }}</strong>
                  <span class="adm-serp-desc">{{ draft.general.seo_description?.sk }}</span>
                </div>
              </div>
            </a-card>

            <a-card title="Notifikácie" icon="fa-envelope">
              <a-field label="E-mail pre upozornenia o nových rezerváciách"
                       hint="Kam chodia upozornenia o nových rezerváciách a zrušeniach od klientov. Ak je prázdne, použije sa e-mail zo serverovej konfigurácie.">
                <input type="email" v-model.trim="draft.general.notification_email" placeholder="napr. salon@email.sk" />
              </a-field>
            </a-card>
          </div>

          <div>
            <a-card title="Rezervačné pravidlá" icon="fa-sliders">
              <template #actions>
                <button type="button" class="adm-btn is-primary is-sm" :disabled="rulesLoading || rulesSaving || JSON.stringify(rules) === rulesOriginal" @click="saveRules">
                  <i class="fa-solid" :class="rulesSaving ? 'fa-spinner fa-spin' : 'fa-floppy-disk'"></i> Uložiť pravidlá
                </button>
              </template>
              <div v-if="rulesLoading" class="adm-loading"><i class="fa-solid fa-spinner fa-spin"></i></div>
              <template v-else>
                <a-field label="Prestávka medzi rezerváciami (minúty)" hint="Čas na upratanie a prípravu medzi dvoma klientmi. Platí pre oboch terapeutov (spoločná miestnosť).">
                  <a-number v-model="rules.break_minutes" :min="0" :max="120" :step="5" suffix="min" />
                </a-field>
                <a-field label="Koľko dní dopredu je online rezervácia zatvorená" :hint="leadLabel(rules.public_lead_days)">
                  <a-number v-model="rules.public_lead_days" :min="0" :max="30" suffix="dní" />
                </a-field>
                <a-field label="Koľko dní dopredu vidí administrátor voľné termíny" hint="Pre klientov sa počet dní nastavuje pri každom terapeutovi v sekcii Rozvrh a voľno.">
                  <a-number v-model="rules.admin_days_ahead" :min="7" :max="730" :step="10" suffix="dní" />
                </a-field>
              </template>
            </a-card>

            <a-card title="Údržba a záloha" icon="fa-shield-halved">
              <div class="adm-rows">
                <div class="adm-row">
                  <div class="adm-row-main">
                    <strong>Export rezervácií</strong>
                    <span>Stiahne všetky rezervácie ako tabuľku (CSV pre Excel).</span>
                  </div>
                  <a href="/api/admin/reservations/export/" class="adm-btn is-soft is-sm"><i class="fa-solid fa-file-csv"></i> Stiahnuť</a>
                </div>
                <div class="adm-row">
                  <div class="adm-row-main">
                    <strong>Pokročilá správa dát</strong>
                    <span>Priamy prístup k databáze (Django administrácia) – len pre pokročilých.</span>
                  </div>
                  <a href="/admin/" target="_blank" class="adm-btn is-soft is-sm"><i class="fa-solid fa-database"></i> Otvoriť</a>
                </div>
              </div>
            </a-card>
          </div>
        </div>
      </template>

      <save-bar :dirty="dirty" :saving="saving" @save="save()" @discard="discard()" @history="showHistory()" @reset="resetToDefaults()" />
    </div>
  `,
});
