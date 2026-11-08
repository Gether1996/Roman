// Úvodná stránka – hero a texty jednotlivých sekcií.
const { defineComponent } = Vue;

import { adminComponents } from '../components.js';
import { useSections } from '../useContent.js';

export const HomepageView = defineComponent({
  name: 'HomepageView',
  components: { ...adminComponents },
  setup() {
    const editor = useSections(['hero', 'sections']);
    return { ...editor };
  },
  template: `
    <div>
      <a-page-head title="Úvodná stránka" subtitle="Hlavný nadpis a texty jednotlivých sekcií na úvodnej stránke. Zmeny sa na webe prejavia hneď po uložení.">
        <a href="/" target="_blank" class="adm-btn is-soft"><i class="fa-solid fa-arrow-up-right-from-square"></i> Zobraziť web</a>
      </a-page-head>

      <div v-if="!ready" class="adm-loading"><i class="fa-solid fa-spinner fa-spin"></i> Načítavam…</div>
      <template v-else>
        <a-card title="Hlavný nadpis (hero)" icon="fa-heading" description="Prvá vec, ktorú návštevník uvidí po otvorení webu.">
          <bi-input v-model="draft.hero.title" label="Nadpis" required />
          <bi-input v-model="draft.hero.subtitle" label="Podnadpis" multiline :rows="2" />
          <div class="adm-grid-2">
            <bi-input v-model="draft.hero.cta_primary" label="Hlavné tlačidlo (rezervácia)" />
            <bi-input v-model="draft.hero.cta_secondary" label="Druhé tlačidlo (služby)" />
          </div>
        </a-card>

        <a-card title="Terapeuti" icon="fa-user-doctor" description="Karty terapeutov s fotkou a zoznamom techník. Mená, fotky a techniky upravíte v sekcii Terapeuti.">
          <a-toggle v-model="draft.sections.therapists.visible" label="Zobraziť sekciu na webe" />
          <router-link to="/sprava/terapeuti" class="adm-btn is-soft is-sm"><i class="fa-solid fa-pen"></i> Upraviť terapeutov</router-link>
        </a-card>

        <a-card title="Masážne techniky" icon="fa-spa">
          <a-toggle v-model="draft.sections.techniques.visible" label="Zobraziť sekciu na webe" />
          <div class="adm-grid-2">
            <bi-input v-model="draft.sections.techniques.kicker" label="Malý nadpis nad sekciou" />
            <bi-input v-model="draft.sections.techniques.title" label="Nadpis" />
          </div>
          <bi-input v-model="draft.sections.techniques.text" label="Popis" multiline :rows="2" />
          <router-link to="/sprava/techniky" class="adm-btn is-soft is-sm"><i class="fa-solid fa-pen"></i> Upraviť jednotlivé techniky</router-link>
        </a-card>

        <a-card title="Cenník" icon="fa-tags" description="Cenník sa na webe vytvára automaticky zo zoznamu služieb a permanentiek – ceny teda meníte len na jednom mieste.">
          <a-toggle v-model="draft.sections.pricing.visible" label="Zobraziť sekciu na webe" />
          <div class="adm-grid-2">
            <bi-input v-model="draft.sections.pricing.kicker" label="Malý nadpis nad sekciou" />
            <bi-input v-model="draft.sections.pricing.title" label="Nadpis" />
          </div>
          <bi-input v-model="draft.sections.pricing.text" label="Popis" multiline :rows="2" />
          <bi-input v-model="draft.sections.pricing.note" label="Poznámka pod cenníkom" multiline :rows="2" hint="Napríklad informácia o DPH alebo spôsobe platby. Ak je prázdne, nezobrazí sa." />
          <router-link to="/sprava/sluzby" class="adm-btn is-soft is-sm"><i class="fa-solid fa-pen"></i> Upraviť služby, ceny a permanentky</router-link>
        </a-card>

        <a-card title="Galéria" icon="fa-images">
          <a-toggle v-model="draft.sections.gallery.visible" label="Zobraziť sekciu na webe" />
          <bi-input v-model="draft.sections.gallery.title" label="Nadpis" />
          <bi-input v-model="draft.sections.gallery.text" label="Popis" multiline :rows="2" hint="Nepovinné." />
          <router-link to="/sprava/galeria" class="adm-btn is-soft is-sm"><i class="fa-solid fa-images"></i> Spravovať fotky</router-link>
        </a-card>

        <a-card title="Darčekové poukážky" icon="fa-gift">
          <a-toggle v-model="draft.sections.vouchers.visible" label="Zobraziť sekciu na webe" />
          <bi-input v-model="draft.sections.vouchers.title" label="Nadpis" />
          <bi-input v-model="draft.sections.vouchers.text" label="Popis" multiline :rows="2" />
          <bi-input v-model="draft.sections.vouchers.download_label" label="Text tlačidla na stiahnutie" />
          <router-link to="/sprava/galeria" class="adm-btn is-soft is-sm"><i class="fa-solid fa-gift"></i> Spravovať poukážky</router-link>
        </a-card>

        <a-card title="Hodnotenia" icon="fa-star">
          <a-toggle v-model="draft.sections.reviews.visible" label="Zobraziť sekciu na webe" />
          <a-toggle v-model="draft.sections.reviews.allow_new" label="Návštevníci môžu pridávať hodnotenia" hint="Ak vypnete, tlačidlo „Pridať hodnotenie“ sa na webe skryje." />
          <bi-input v-model="draft.sections.reviews.title" label="Nadpis" />
          <bi-input v-model="draft.sections.reviews.text" label="Popis" multiline :rows="2" />
          <router-link to="/sprava/hodnotenia" class="adm-btn is-soft is-sm"><i class="fa-solid fa-star"></i> Spravovať hodnotenia</router-link>
        </a-card>

        <a-card title="Pre firmy" icon="fa-briefcase">
          <a-toggle v-model="draft.sections.business.visible" label="Zobraziť sekciu na webe" />
          <bi-input v-model="draft.sections.business.title" label="Nadpis" />
          <bi-input v-model="draft.sections.business.text" label="Text" multiline :rows="5" />
          <div class="adm-grid-2">
            <bi-input v-model="draft.sections.business.button" label="Text tlačidla" hint="Ak je prázdne, tlačidlo sa nezobrazí." />
            <a-field label="Kam tlačidlo vedie" hint="Napr. #contact (sekcia Kontakt) alebo mailto:vas@email.sk">
              <input type="text" v-model.trim="draft.sections.business.button_link" placeholder="#contact" />
            </a-field>
          </div>
        </a-card>

        <a-card title="Kontakt" icon="fa-address-card" description="Adresu, telefóny a e-mail upravíte v sekcii Kontakt a firma.">
          <a-toggle v-model="draft.sections.contact.visible" label="Zobraziť sekciu na webe" />
          <bi-input v-model="draft.sections.contact.title" label="Nadpis" />
          <bi-input v-model="draft.sections.contact.text" label="Text pod nadpisom" multiline :rows="2" hint="Nepovinné." />
          <router-link to="/sprava/kontakt" class="adm-btn is-soft is-sm"><i class="fa-solid fa-pen"></i> Upraviť kontaktné údaje</router-link>
        </a-card>
      </template>

      <save-bar :dirty="dirty" :saving="saving" @save="save()" @discard="discard()" @history="showHistory()" @reset="resetToDefaults()" />
    </div>
  `,
});
