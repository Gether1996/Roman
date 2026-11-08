// Banner pod hlavným nadpisom + sezónne akcie (napr. Vianoce), ktoré sa opakujú každý rok.
const { defineComponent, computed, ref } = Vue;

import { adminComponents } from '../components.js';
import { useSections } from '../useContent.js';
import { confirmDialog, fmtMonthDay, isMonthDayActive, moveItem, slugify } from '../ui.js';

const TARGETS = [
  { value: '#vouchers', label: 'Poukážky' },
  { value: '#techniques', label: 'Techniky' },
  { value: '#gallery', label: 'Galéria' },
  { value: '#pricing', label: 'Cenník' },
  { value: '#contact', label: 'Kontakt' },
  { value: '/reservation/', label: 'Rezervácia' },
];

const STYLES = [
  { value: 'default', label: 'Štandardný' },
  { value: 'festive', label: 'Vianočný (stromčeky a sneh)', icon: 'fa-tree' },
  { value: 'highlight', label: 'Výrazný' },
];

const PRESETS = {
  vianoce: {
    name: 'Vianoce', date_from: '11-15', date_to: '12-24', icon: 'fa-gifts', style: 'festive', target: '#vouchers',
    text: { sk: 'Hľadáte vianočný darček? Darčeková poukážka na masáž je ideálny darček pre vašich blízkych.', en: 'Looking for a Christmas gift? A massage gift voucher is the perfect present for your loved ones.' },
    button: { sk: 'Vybrať poukážku', en: 'Choose a voucher' },
  },
  valentin: {
    name: 'Valentín', date_from: '02-01', date_to: '02-14', icon: 'fa-heart', style: 'highlight', target: '#vouchers',
    text: { sk: 'Darujte na Valentína chvíľu pohody – darčeková poukážka na masáž poteší každého.', en: 'Give the gift of relaxation this Valentine’s Day – a massage voucher always pleases.' },
    button: { sk: 'Darčekové poukážky', en: 'Gift vouchers' },
  },
  matky: {
    name: 'Deň matiek', date_from: '04-20', date_to: '05-10', icon: 'fa-hand-holding-heart', style: 'highlight', target: '#vouchers',
    text: { sk: 'Poďakujte mame relaxom – darčeková poukážka na masáž ku Dňu matiek.', en: 'Thank your mum with relaxation – a massage gift voucher for Mother’s Day.' },
    button: { sk: 'Vybrať poukážku', en: 'Choose a voucher' },
  },
  empty: {
    name: 'Nová akcia', date_from: '01-01', date_to: '01-31', icon: 'fa-gift', style: 'default', target: '#vouchers',
    text: { sk: '', en: '' }, button: { sk: '', en: '' },
  },
};

/** Select of common targets + custom value input. */
const TargetInput = defineComponent({
  name: 'TargetInput',
  components: { ...adminComponents },
  props: { modelValue: String },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const forcedCustom = ref(false);
    const isKnown = computed(() => TARGETS.some((t) => t.value === props.modelValue));
    const selectValue = computed(() => (forcedCustom.value || (!isKnown.value && props.modelValue) ? '__custom' : (props.modelValue || '#vouchers')));
    function onSelect(value) {
      if (value === '__custom') {
        forcedCustom.value = true;
        if (isKnown.value) emit('update:modelValue', '');
      } else {
        forcedCustom.value = false;
        emit('update:modelValue', value);
      }
    }
    return { TARGETS, selectValue, onSelect };
  },
  template: `
    <a-field label="Kam tlačidlo vedie" hint="Sekcia na úvodnej stránke, stránka webu alebo vlastný odkaz (https://…, mailto:…).">
      <a-select :model-value="selectValue" :options="[...TARGETS, { value: '__custom', label: 'Vlastný odkaz…' }]" @update:model-value="onSelect" />
      <input v-if="selectValue === '__custom'" type="text" style="margin-top:.4rem" :value="modelValue" placeholder="https://… alebo #sekcia" @input="$emit('update:modelValue', $event.target.value.trim())" />
    </a-field>
  `,
});

export const BannerView = defineComponent({
  name: 'BannerView',
  components: { ...adminComponents, TargetInput },
  setup() {
    const editor = useSections(['promo']);
    const { draft } = editor;

    const activeCampaign = computed(() => {
      const list = draft.promo?.campaigns || [];
      return list.find((c) => c.enabled && isMonthDayActive(c.date_from, c.date_to)) || null;
    });

    const preview = computed(() => {
      if (!draft.promo) return null;
      const source = activeCampaign.value || draft.promo;
      if (!activeCampaign.value && !draft.promo.enabled) return null;
      return {
        text: source.text?.sk || '',
        button: source.button?.sk || '',
        icon: source.icon || 'fa-gift',
        style: source.style || 'default',
        from: activeCampaign.value ? activeCampaign.value.name : 'Predvolený banner',
      };
    });

    function uniqueId(name) {
      const base = slugify(name) || 'akcia';
      const ids = new Set((draft.promo.campaigns || []).map((c) => c.id));
      let id = base;
      let n = 2;
      while (ids.has(id)) { id = `${base}-${n}`; n += 1; }
      return id;
    }

    function addCampaign(key) {
      const preset = JSON.parse(JSON.stringify(PRESETS[key]));
      draft.promo.campaigns.push({ id: uniqueId(preset.name), enabled: true, ...preset });
    }

    async function removeCampaign(index) {
      const campaign = draft.promo.campaigns[index];
      if (!(await confirmDialog({ title: `Odstrániť akciu „${campaign.name || 'bez názvu'}“?`, confirm: 'Odstrániť', danger: true, icon: 'warning' }))) return;
      draft.promo.campaigns.splice(index, 1);
    }

    function onNameChange(campaign) {
      if (!campaign.id) campaign.id = uniqueId(campaign.name);
    }

    return {
      ...editor, STYLES, activeCampaign, preview, addCampaign, removeCampaign, moveItem, fmtMonthDay, isMonthDayActive, onNameChange,
    };
  },
  template: `
    <div>
      <a-page-head title="Banner a akcie" subtitle="Pás pod hlavným nadpisom úvodnej stránky. Sezónne akcie (napr. Vianoce) sa každý rok zapnú a vypnú automaticky." />

      <div v-if="!ready" class="adm-loading"><i class="fa-solid fa-spinner fa-spin"></i> Načítavam…</div>
      <template v-else>
        <a-card title="Ako to teraz vyzerá na webe" icon="fa-eye">
          <div class="adm-preview">
            <span class="adm-preview-label">Náhľad – {{ preview ? preview.from : 'banner je skrytý' }}</span>
            <div v-if="preview" class="promo-banner adm-promo-preview" :class="'promo-style-' + (preview.style || 'default')">
              <span v-if="preview.style === 'festive'" class="promo-xmas" aria-hidden="true">
            <i class="fa-solid fa-tree promo-tree is-small"></i><span class="promo-tree-main"><i class="fa-solid fa-star promo-star"></i><i class="fa-solid fa-tree promo-tree"></i></span><i class="fa-solid fa-tree promo-tree is-small"></i>
          </span>
              <span class="promo-text"><i v-if="preview.icon && preview.style !== 'festive'" class="fa-solid" :class="preview.icon"></i> {{ preview.text || '(bez textu)' }}</span>
              <span v-if="preview.button" class="btn btn-secondary-soft">{{ preview.button }}</span>
            </div>
            <p v-else class="adm-muted adm-small" style="margin:0">Banner sa momentálne na webe nezobrazuje.</p>
          </div>
          <p v-if="activeCampaign" class="adm-alert is-info" style="margin:1rem 0 0">
            <i class="fa-solid fa-circle-info"></i>
            <span>Práve beží akcia <strong>{{ activeCampaign.name }}</strong> ({{ fmtMonthDay(activeCampaign.date_from) }} – {{ fmtMonthDay(activeCampaign.date_to) }}), preto sa namiesto predvoleného banneru zobrazuje jej text.</span>
          </p>
        </a-card>

        <a-card title="Predvolený banner" icon="fa-bullhorn" description="Zobrazuje sa vždy, keď práve neprebieha žiadna sezónna akcia.">
          <a-toggle v-model="draft.promo.enabled" label="Zobraziť banner na webe" />
          <bi-input v-model="draft.promo.text" label="Text" multiline :rows="2" />
          <div class="adm-grid-2">
            <bi-input v-model="draft.promo.button" label="Text tlačidla" hint="Ak je prázdne, tlačidlo sa nezobrazí." />
            <target-input v-model="draft.promo.target" />
          </div>
          <div class="adm-grid-2">
            <icon-picker v-model="draft.promo.icon" />
            <a-field label="Vzhľad">
              <a-select v-model="draft.promo.style" :options="STYLES" />
            </a-field>
          </div>
        </a-card>

        <a-card title="Sezónne akcie – opakujú sa každý rok automaticky" icon="fa-calendar-check"
                description="Nastavte raz a banner sa v danom období každý rok zmení sám. Keď je akcia aktívna, jej text nahradí predvolený banner. Ak sa obdobia prekrývajú, použije sa prvá aktívna akcia v zozname.">
          <template #actions>
            <div class="adm-chip-row">
              <button type="button" class="adm-btn is-soft is-sm" @click="addCampaign('vianoce')"><i class="fa-solid fa-gifts"></i> Vianoce</button>
              <button type="button" class="adm-btn is-soft is-sm" @click="addCampaign('valentin')"><i class="fa-solid fa-heart"></i> Valentín</button>
              <button type="button" class="adm-btn is-soft is-sm" @click="addCampaign('matky')"><i class="fa-solid fa-hand-holding-heart"></i> Deň matiek</button>
              <button type="button" class="adm-btn is-primary is-sm" @click="addCampaign('empty')"><i class="fa-solid fa-plus"></i> Prázdna akcia</button>
            </div>
          </template>

          <a-empty v-if="!draft.promo.campaigns.length" icon="fa-calendar-plus" text="Zatiaľ nemáte žiadne sezónne akcie. Pridajte ich tlačidlami vyššie." />

          <div v-for="(campaign, index) in draft.promo.campaigns" :key="campaign.id || index" class="adm-list-item" :class="{ 'is-off': !campaign.enabled }">
            <div class="adm-list-item-head">
              <i class="fa-solid" :class="campaign.icon || 'fa-gift'" style="color:var(--a-brand)"></i>
              <strong>{{ campaign.name || 'Bez názvu' }}</strong>
              <span class="adm-badge hide-sm">{{ fmtMonthDay(campaign.date_from) }} – {{ fmtMonthDay(campaign.date_to) }}</span>
              <span v-if="campaign.enabled && isMonthDayActive(campaign.date_from, campaign.date_to)" class="adm-badge is-live"><i class="fa-solid fa-circle" style="font-size:.5rem"></i> Práve aktívna</span>
              <span v-else-if="!campaign.enabled" class="adm-badge is-muted">Vypnutá</span>
              <list-actions :index="index" :length="draft.promo.campaigns.length"
                            @up="moveItem(draft.promo.campaigns, index, -1)" @down="moveItem(draft.promo.campaigns, index, 1)" @remove="removeCampaign(index)" />
            </div>
            <div class="adm-list-item-body">
              <div class="adm-grid-2">
                <a-field label="Názov akcie (len pre vás)">
                  <input type="text" v-model.trim="campaign.name" maxlength="80" @change="onNameChange(campaign)" />
                </a-field>
                <div class="adm-field">
                  <span class="adm-label">Stav</span>
                  <a-toggle v-model="campaign.enabled" label="Akcia je zapnutá" />
                </div>
              </div>
              <div class="adm-grid-2">
                <a-field label="Zobrazovať od" :hint="'Každý rok od ' + fmtMonthDay(campaign.date_from)">
                  <month-day-input v-model="campaign.date_from" />
                </a-field>
                <a-field label="Zobrazovať do (vrátane)" :hint="'Každý rok do ' + fmtMonthDay(campaign.date_to)">
                  <month-day-input v-model="campaign.date_to" />
                </a-field>
              </div>
              <bi-input v-model="campaign.text" label="Text banneru" multiline :rows="2" />
              <div class="adm-grid-2">
                <bi-input v-model="campaign.button" label="Text tlačidla" />
                <target-input v-model="campaign.target" />
              </div>
              <div class="adm-grid-2">
                <icon-picker v-model="campaign.icon" />
                <a-field label="Vzhľad">
                  <a-select v-model="campaign.style" :options="STYLES" />
                </a-field>
              </div>
            </div>
          </div>
        </a-card>
      </template>

      <save-bar :dirty="dirty" :saving="saving" @save="save()" @discard="discard()" @history="showHistory()" @reset="resetToDefaults()" />
    </div>
  `,
});
