// Techniky – popisy masážnych techník na úvodnej stránke.
const { defineComponent, ref, computed } = Vue;

import { adminComponents } from '../components.js';
import { useSections } from '../useContent.js';
import { confirmDialog, moveItem, slugify } from '../ui.js';

export const TechniquesView = defineComponent({
  name: 'TechniquesView',
  components: { ...adminComponents },
  setup() {
    const { draft, dirty, saving, ready, save, discard, resetToDefaults, showHistory } = useSections(['techniques']);
    const open = ref(null);
    const newIds = ref(new Set());

    const techniques = computed(() => draft.techniques || []);

    function uniqueId(base) {
      const root = slugify(base) || 'technika';
      let id = root;
      let n = 2;
      while (techniques.value.some((t) => t.id === id)) {
        id = `${root}-${n}`;
        n += 1;
      }
      return id;
    }

    function addTechnique() {
      const id = uniqueId('nova-technika');
      draft.techniques.push({
        id,
        icon: 'fa-spa',
        image: '',
        visible: true,
        title: { sk: 'Nová technika', en: '' },
        short: { sk: '', en: '' },
        body: { sk: '', en: '' },
      });
      newIds.value.add(id);
      open.value = draft.techniques.length - 1;
    }

    async function removeTechnique(index) {
      const item = draft.techniques[index];
      const ok = await confirmDialog({
        title: 'Odstrániť techniku?',
        text: `„${item.title?.sk || item.id}“ zmizne z webu aj zo zoznamu techník pri terapeutoch.`,
        confirm: 'Odstrániť',
        danger: true,
        icon: 'warning',
      });
      if (!ok) return;
      draft.techniques.splice(index, 1);
      if (open.value === index) open.value = null;
    }

    function setId(item, value) {
      const oldId = item.id;
      item.id = slugify(value);
      newIds.value.delete(oldId);
      newIds.value.add(item.id);
    }

    function toggle(index) {
      open.value = open.value === index ? null : index;
    }

    function move(index, delta) {
      moveItem(draft.techniques, index, delta);
      if (open.value === index) open.value = index + delta;
    }

    async function saveAll() {
      if (await save()) newIds.value.clear();
    }

    return { saveAll, draft, dirty, saving, ready, save, discard, resetToDefaults, showHistory, techniques, open, newIds, addTechnique, removeTechnique, setId, toggle, move };
  },
  template: `
    <div>
      <a-page-head title="Techniky" subtitle="Masážne techniky v sekcii „Naše služby“ na úvodnej stránke. Kliknutím na techniku sa zákazníkovi otvorí jej podrobný popis.">
        <button class="adm-btn is-primary" @click="addTechnique" :disabled="!ready"><i class="fa-solid fa-plus"></i> Pridať techniku</button>
      </a-page-head>

      <div v-if="!ready" class="adm-loading"><i class="fa-solid fa-spinner fa-spin"></i> Načítavam…</div>
      <template v-else>
        <div class="adm-alert is-info"><i class="fa-solid fa-circle-info"></i>
          <span>Ktoré techniky poskytuje ktorý terapeut, nastavíte v sekcii <router-link to="/sprava/terapeuti"><strong>Terapeuti</strong></router-link>. Odstránená technika sa pri terapeutoch automaticky prestane zobrazovať.</span>
        </div>

        <a-card>
          <a-empty v-if="!techniques.length" icon="fa-spa" text="Zatiaľ nemáte žiadne techniky.">
            <button class="adm-btn is-primary" @click="addTechnique"><i class="fa-solid fa-plus"></i> Pridať techniku</button>
          </a-empty>
          <div v-for="(item, index) in techniques" :key="index" class="adm-list-item" :class="{ 'is-collapsed': open !== index, 'is-off': !item.visible }">
            <div class="adm-list-item-head">
              <button type="button" class="adm-handle-btn" @click="toggle(index)">
                <i class="fa-solid" :class="open === index ? 'fa-chevron-down' : 'fa-chevron-right'"></i>
              </button>
              <i class="fa-solid" :class="item.icon || 'fa-spa'" style="color:var(--a-brand);width:1.2rem;text-align:center"></i>
              <strong @click="toggle(index)" style="cursor:pointer">{{ item.title?.sk || item.id }}</strong>
              <span class="adm-small adm-muted hide-sm" style="max-width:40%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ item.short?.sk }}</span>
              <span v-if="!item.visible" class="adm-badge is-muted">Skrytá</span>
              <list-actions :index="index" :length="techniques.length" @up="move(index, -1)" @down="move(index, 1)" @remove="removeTechnique(index)" />
            </div>
            <div v-if="open === index" class="adm-list-item-body">
              <div class="adm-grid-2">
                <a-field label="Identifikátor" :hint="newIds.has(item.id) ? 'Krátky kód bez diakritiky, napr. „lymfaticka“. Po uložení sa už nemení.' : 'Identifikátor existujúcej techniky sa nemení (používa sa pri terapeutoch).'">
                  <input type="text" :value="item.id" :disabled="!newIds.has(item.id)" @change="setId(item, $event.target.value)" maxlength="40" />
                </a-field>
                <icon-picker v-model="item.icon" />
              </div>
              <a-toggle v-model="item.visible" label="Zobraziť na webe" />
              <bi-input v-model="item.title" label="Názov" required maxlength="120" />
              <bi-input v-model="item.short" label="Krátky popis" hint="Zobrazí sa na karte techniky pod názvom." maxlength="200" />
              <bi-input v-model="item.body" label="Podrobný popis" multiline :rows="8"
                hint="Formátovanie: prázdny riadok = nový odsek, riadok začínajúci „- “ = odrážka, riadok začínajúci „## “ = nadpis." />
              <image-input v-model="item.image" label="Obrázok (nepovinné)" aspect="4 / 3" hint="Zobrazí sa v okne s podrobným popisom." />
            </div>
          </div>
          <button v-if="techniques.length" type="button" class="adm-btn is-soft" @click="addTechnique"><i class="fa-solid fa-plus"></i> Pridať techniku</button>
        </a-card>

        <save-bar :dirty="dirty" :saving="saving" @save="saveAll()" @discard="discard" @history="showHistory" @reset="resetToDefaults" />
      </template>
    </div>
  `,
});
