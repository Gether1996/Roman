// Prepisy textov rozhrania (tlačidlá, popisky formulárov, hlásenia) v SK aj EN.
const { defineComponent, ref, computed } = Vue;

import { adminComponents } from '../components.js';
import { useSections } from '../useContent.js';
import { ui } from '../ui.js';
import { messages } from '../../messages.js';

const GROUPS = [
  { key: 'nav', label: 'Navigácia' },
  { key: 'home', label: 'Úvodná stránka' },
  { key: 'reservation', label: 'Rezervácia' },
  { key: 'profile', label: 'Profil klienta' },
  { key: 'auth', label: 'Prihlásenie a registrácia' },
  { key: 'common', label: 'Spoločné' },
];

function flatten(obj, prefix) {
  const rows = [];
  Object.entries(obj || {}).forEach(([key, value]) => {
    const path = `${prefix}.${key}`;
    if (value && typeof value === 'object') rows.push(...flatten(value, path));
    else rows.push(path);
  });
  return rows;
}

function lookup(obj, path) {
  return path.split('.').reduce((node, part) => (node && typeof node === 'object' ? node[part] : undefined), obj);
}

function normalize(value) {
  return String(value || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export const TextsView = defineComponent({
  name: 'TextsView',
  components: { ...adminComponents },
  setup() {
    const editor = useSections(['texts']);
    const { draft } = editor;
    const search = ref('');
    const group = ref('all');
    const onlyChanged = ref(false);

    const allRows = GROUPS.flatMap((g) => flatten(messages.sk[g.key], g.key).map((path) => ({
      path,
      group: g.key,
      sk: lookup(messages.sk, path) || '',
      en: lookup(messages.en, path) || '',
    })));

    function override(lang, path) {
      return draft.texts?.[lang]?.[path] || '';
    }

    function setOverride(lang, path, value) {
      if (!draft.texts[lang]) draft.texts[lang] = {};
      if (value && value.trim()) draft.texts[lang][path] = value;
      else delete draft.texts[lang][path];
    }

    function resetRow(path) {
      delete draft.texts.sk[path];
      delete draft.texts.en[path];
    }

    const changedCount = computed(() => {
      if (!draft.texts) return 0;
      return new Set([...Object.keys(draft.texts.sk || {}), ...Object.keys(draft.texts.en || {})]).size;
    });

    const rows = computed(() => {
      if (!draft.texts) return [];
      const q = normalize(search.value.trim());
      return allRows.filter((row) => {
        if (group.value !== 'all' && row.group !== group.value) return false;
        const changed = override('sk', row.path) || override('en', row.path);
        if (onlyChanged.value && !changed) return false;
        if (!q) return true;
        return [row.path, row.sk, row.en, override('sk', row.path), override('en', row.path)].some((v) => normalize(v).includes(q));
      });
    });

    return { ...editor, ui, GROUPS, search, group, onlyChanged, rows, override, setOverride, resetRow, changedCount };
  },
  template: `
    <div>
      <a-page-head title="Texty a preklady" subtitle="Popisky tlačidiel, formulárov a hlásenia na webe. Ak pole necháte prázdne, použije sa pôvodný text (zobrazený šedou)." />

      <div v-if="!ready" class="adm-loading"><i class="fa-solid fa-spinner fa-spin"></i> Načítavam…</div>
      <template v-else>
        <p class="adm-alert is-info">
          <i class="fa-solid fa-circle-info"></i>
          <span>Väčšinu textov úvodnej stránky (nadpisy sekcií, banner, techniky, cenník, kontakt) upravíte v príslušných sekciách vľavo. Tu sú zvyšné popisky – tlačidlá, polia formulárov a hlásenia.</span>
        </p>

        <div class="adm-toolbar">
          <div class="adm-search">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input type="search" v-model="search" placeholder="Hľadať text…" />
          </div>
          <a-select v-model="group" :options="[{ value: 'all', label: 'Všetky časti' }, ...GROUPS.map(g => ({ value: g.key, label: g.label }))]" />
          <a-checkbox v-model="onlyChanged">Len upravené ({{ changedCount }})</a-checkbox>
        </div>

        <a-card>
          <a-empty v-if="!rows.length" icon="fa-magnifying-glass" text="Nenašli sa žiadne texty." />
          <div v-for="row in rows" :key="row.path" class="adm-texts-row" :style="ui.showEnglish ? null : { gridTemplateColumns: '1fr' }">
            <div class="adm-texts-key">
              <span>{{ row.path }}</span>
              <button v-if="override('sk', row.path) || override('en', row.path)" type="button" class="adm-btn is-ghost is-sm" @click="resetRow(row.path)" title="Vrátiť pôvodný text">
                <i class="fa-solid fa-rotate-left"></i> Pôvodný
              </button>
            </div>
            <div class="adm-bi-row">
              <span class="adm-lang">SK</span>
              <input type="text" :class="{ 'is-overridden': override('sk', row.path) }" :value="override('sk', row.path)" :placeholder="row.sk"
                     @input="setOverride('sk', row.path, $event.target.value)" />
            </div>
            <div v-if="ui.showEnglish" class="adm-bi-row is-en">
              <span class="adm-lang">EN</span>
              <input type="text" :class="{ 'is-overridden': override('en', row.path) }" :value="override('en', row.path)" :placeholder="row.en"
                     @input="setOverride('en', row.path, $event.target.value)" />
            </div>
          </div>
        </a-card>
      </template>

      <save-bar :dirty="dirty" :saving="saving" @save="save()" @discard="discard()" @history="showHistory()" @reset="resetToDefaults()" />
    </div>
  `,
});
