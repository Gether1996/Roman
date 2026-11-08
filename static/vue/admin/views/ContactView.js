// Kontaktné údaje, sociálne siete a identifikácia prevádzkovateľa.
const { defineComponent, computed } = Vue;

import { adminComponents } from '../components.js';
import { useSections } from '../useContent.js';
import { moveItem } from '../ui.js';

export const ContactView = defineComponent({
  name: 'ContactView',
  components: { ...adminComponents },
  setup() {
    const editor = useSections(['contact']);
    const { draft } = editor;

    const missingCompany = computed(() => !!draft.contact && (!draft.contact.company_name || !draft.contact.company_ico));

    function addPhone() {
      draft.contact.phones.push({ label: '', number: '' });
    }

    return { ...editor, missingCompany, addPhone, moveItem };
  },
  template: `
    <div>
      <a-page-head title="Kontakt a firma" subtitle="Adresa, telefóny, e-mail a sociálne siete zobrazené na webe, a údaje o prevádzkovateľovi." />

      <div v-if="!ready" class="adm-loading"><i class="fa-solid fa-spinner fa-spin"></i> Načítavam…</div>
      <template v-else>
        <div class="adm-cols">
          <div>
            <a-card title="Adresa a e-mail" icon="fa-location-dot">
              <div class="adm-grid-2">
                <a-field label="Ulica a časť mesta" hint="Napr. Matice Slovenskej 6, Vlčince">
                  <input type="text" v-model.trim="draft.contact.address" maxlength="150" />
                </a-field>
                <a-field label="PSČ a mesto" hint="Napr. 010 08 Žilina">
                  <input type="text" v-model.trim="draft.contact.city" maxlength="100" />
                </a-field>
              </div>
              <a-field label="Odkaz na mapu" hint="Odkaz z Google Máp (Zdieľať → Kopírovať odkaz). Otvorí sa po kliknutí na adresu.">
                <input type="url" v-model.trim="draft.contact.maps_url" placeholder="https://maps.google.com/…" />
              </a-field>
              <a-field label="Kontaktný e-mail" hint="Zobrazuje sa na webe a v obchodných podmienkach.">
                <input type="email" v-model.trim="draft.contact.email" />
              </a-field>
              <bi-input v-model="draft.contact.note" label="Doplňujúca poznámka" multiline :rows="2" hint="Napr. parkovanie, vchod z dvora, otváracie hodiny. Nepovinné." />
            </a-card>

            <a-card title="Telefónne čísla" icon="fa-phone">
              <template #actions>
                <button type="button" class="adm-btn is-soft is-sm" @click="addPhone"><i class="fa-solid fa-plus"></i> Pridať číslo</button>
              </template>
              <a-empty v-if="!draft.contact.phones.length" icon="fa-phone-slash" text="Žiadne telefónne čísla." />
              <div v-for="(phone, index) in draft.contact.phones" :key="index" class="adm-phone-row">
                <a-field label="Popis">
                  <input type="text" v-model.trim="phone.label" placeholder="Napr. Roman" maxlength="60" />
                </a-field>
                <a-field label="Číslo">
                  <input type="tel" v-model.trim="phone.number" placeholder="+421 9xx xxx xxx" maxlength="30" />
                </a-field>
                <list-actions :index="index" :length="draft.contact.phones.length"
                              @up="moveItem(draft.contact.phones, index, -1)" @down="moveItem(draft.contact.phones, index, 1)" @remove="draft.contact.phones.splice(index, 1)" />
              </div>
            </a-card>

            <a-card title="Sociálne siete" icon="fa-share-nodes" description="Ikony v hornej lište webu. Ak necháte pole prázdne, ikona sa skryje.">
              <a-field label="Instagram">
                <input type="url" v-model.trim="draft.contact.instagram" placeholder="https://www.instagram.com/…" />
              </a-field>
              <a-field label="Facebook">
                <input type="url" v-model.trim="draft.contact.facebook" placeholder="https://www.facebook.com/…" />
              </a-field>
            </a-card>
          </div>

          <div>
            <a-card title="Údaje o prevádzkovateľovi" icon="fa-building" description="Zobrazia sa v pätičke webu a v obchodných podmienkach.">
              <p v-if="missingCompany" class="adm-alert is-warning">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <span>Doplňte prosím obchodné meno a IČO. Podľa zákona o elektronickom obchode a zákona o ochrane spotrebiteľa musí web uvádzať identifikačné údaje prevádzkovateľa (meno/obchodné meno, sídlo, IČO, zápis v registri).</span>
              </p>
              <a-field label="Obchodné meno / meno a priezvisko" hint="Napr. Roman Zelník alebo názov s.r.o.">
                <input type="text" v-model.trim="draft.contact.company_name" maxlength="150" />
              </a-field>
              <a-field label="Sídlo / miesto podnikania">
                <input type="text" v-model.trim="draft.contact.company_address" maxlength="200" />
              </a-field>
              <div class="adm-grid-2">
                <a-field label="IČO">
                  <input type="text" v-model.trim="draft.contact.company_ico" maxlength="20" />
                </a-field>
                <a-field label="DIČ / IČ DPH" hint="Nepovinné.">
                  <input type="text" v-model.trim="draft.contact.company_dic" maxlength="20" />
                </a-field>
              </div>
              <a-field label="Zápis v registri" hint="Napr. Zapísaný v Živnostenskom registri OÚ Žilina, č. 580-12345">
                <input type="text" v-model.trim="draft.contact.company_register" maxlength="200" />
              </a-field>
            </a-card>
          </div>
        </div>
      </template>

      <save-bar :dirty="dirty" :saving="saving" @save="save()" @discard="discard()" @history="showHistory()" @reset="resetToDefaults()" />
    </div>
  `,
});
