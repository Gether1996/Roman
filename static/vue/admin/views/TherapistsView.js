// Terapeuti – dvaja pevní terapeuti (Roman, Evka), dajú sa iba upravovať.
const { defineComponent, computed } = Vue;

import { adminComponents } from '../components.js';
import { useSections, contentState } from '../useContent.js';

export const TherapistsView = defineComponent({
  name: 'TherapistsView',
  components: { ...adminComponents },
  setup() {
    const { draft, dirty, saving, ready, save, discard, resetToDefaults, showHistory } = useSections(['therapists']);

    const therapists = computed(() => draft.therapists || []);
    const techniques = computed(() => (contentState.content?.techniques || []).map((t) => ({ id: t.id, title: t.title?.sk || t.id, icon: t.icon })));

    function toggleTechnique(person, id) {
      const list = person.techniques || (person.techniques = []);
      const idx = list.indexOf(id);
      if (idx >= 0) list.splice(idx, 1); else list.push(id);
    }

    function techniqueTitle(id) {
      return techniques.value.find((t) => t.id === id)?.title || id;
    }

    function isValidHex(value) {
      return /^#[0-9a-fA-F]{6}$/.test(value || '');
    }

    return { draft, dirty, saving, ready, save, discard, resetToDefaults, showHistory, therapists, techniques, toggleTechnique, techniqueTitle, isValidHex };
  },
  template: `
    <div>
      <a-page-head title="Terapeuti" subtitle="Mená, fotky, popis a techniky terapeutov. Tu viete aj dočasne vypnúť online rezervácie pre jedného z terapeutov." />

      <div v-if="!ready" class="adm-loading"><i class="fa-solid fa-spinner fa-spin"></i> Načítavam…</div>
      <template v-else>
        <div class="adm-alert is-info"><i class="fa-solid fa-circle-info"></i>
          <span>Pracovný čas a dni voľna terapeutov nastavíte v sekcii <router-link to="/sprava/rozvrh"><strong>Rozvrh a voľno</strong></router-link>.</span>
        </div>

        <a-card v-for="person in therapists" :key="person.key" :title="person.name || person.key" icon="fa-user-doctor">
          <template #actions>
            <span class="adm-badge" :class="person.booking_enabled ? 'is-live' : 'is-pending'">
              <i class="fa-solid" :class="person.booking_enabled ? 'fa-calendar-check' : 'fa-calendar-xmark'"></i>
              {{ person.booking_enabled ? 'Prijíma rezervácie' : 'Rezervácie vypnuté' }}
            </span>
            <span v-if="!person.visible" class="adm-badge is-muted">Skrytý na webe</span>
          </template>

          <div class="adm-grid-2">
            <div>
              <a-field label="Meno a priezvisko" required>
                <input type="text" v-model="person.name" maxlength="120" />
              </a-field>
              <a-field label="Instagram" hint="Celý odkaz, napr. https://www.instagram.com/…">
                <input type="url" v-model="person.instagram" placeholder="https://www.instagram.com/…" />
              </a-field>
              <div class="adm-field">
                <span class="adm-label">Farba v kalendári a prehľadoch</span>
                <div class="adm-catalog-color">
                  <input type="color" :value="isValidHex(person.color) ? person.color : '#0f7e7a'" @input="person.color = $event.target.value" />
                  <input type="text" v-model="person.color" maxlength="7" placeholder="#0f7e7a" />
                </div>
                <small v-if="person.color && !isValidHex(person.color)" class="adm-hint" style="color:var(--a-red)">Farba musí byť v tvare #RRGGBB.</small>
              </div>
              <a-toggle v-model="person.visible" label="Zobraziť na úvodnej stránke" hint="Skrytý terapeut sa nezobrazí v sekcii terapeutov na webe." />
              <a-toggle v-model="person.booking_enabled" label="Prijíma online rezervácie" hint="Ak je vypnuté, zákazníci si u tohto terapeuta nemôžu rezervovať termín cez web (napr. dovolenka, PN). Vy ako administrátor môžete rezervácie vytvárať aj naďalej." />
            </div>
            <div>
              <image-input v-model="person.photo" label="Hlavná fotka" aspect="3 / 4" hint="Zobrazuje sa na úvodnej stránke. Ideálne na výšku." />
              <image-input v-model="person.photo_small" label="Malá fotka" aspect="1 / 1" hint="Používa sa v rezervácii pri výbere terapeuta (štvorec)." />
            </div>
          </div>

          <bi-input v-model="person.bio" label="Krátky popis" multiline :rows="3" hint="Nepovinné. Zobrazí sa pod menom terapeuta na úvodnej stránke." />

          <div class="adm-field">
            <span class="adm-label">Techniky, ktoré terapeut poskytuje</span>
            <div class="adm-chip-row">
              <button v-for="t in techniques" :key="t.id" type="button" class="adm-chip" :class="{ active: (person.techniques || []).includes(t.id) }" @click="toggleTechnique(person, t.id)">
                <i class="fa-solid" :class="t.icon || 'fa-spa'"></i> {{ t.title }}
              </button>
            </div>
            <small class="adm-hint" v-if="(person.techniques || []).length">
              Poradie na webe: {{ (person.techniques || []).map(techniqueTitle).join(', ') }}
            </small>
            <small class="adm-hint">Techniky (popisy, ikony) upravíte v sekcii <router-link to="/sprava/techniky">Techniky</router-link>.</small>
          </div>

          <bi-input v-model="person.booking_note" label="Poznámka pri rezervácii" multiline :rows="2" hint="Nepovinné. Zobrazí sa zákazníkovi po výbere tohto terapeuta v rezervácii (napr. „Od 1. 12. nová adresa“)." />
        </a-card>

        <save-bar :dirty="dirty" :saving="saving" @save="save()" @discard="discard" @history="showHistory" @reset="resetToDefaults" />
      </template>
    </div>
  `,
});
