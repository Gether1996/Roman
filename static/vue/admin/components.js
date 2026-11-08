// Reusable form components for the admin panel.
const { defineComponent, ref, computed } = Vue;

import { api, ui, toast, toastError } from './ui.js';
import { contentState } from './useContent.js';
import { controlComponents, DateInput, TimeInput, MonthDayInput } from './controls.js';

export { DateInput, TimeInput, MonthDayInput };

/** Card with a title, optional description and actions slot. */
export const ACard = defineComponent({
  name: 'ACard',
  props: { title: String, description: String, icon: String },
  template: `
    <section class="adm-card">
      <header v-if="title || $slots.actions" class="adm-card-head">
        <div>
          <h2 v-if="title"><i v-if="icon" class="fa-solid" :class="icon"></i> {{ title }}</h2>
          <p v-if="description">{{ description }}</p>
        </div>
        <div class="adm-card-actions"><slot name="actions" /></div>
      </header>
      <div class="adm-card-body"><slot /></div>
    </section>
  `,
});

/** Label + control + hint. */
export const AField = defineComponent({
  name: 'AField',
  props: { label: String, hint: String, required: Boolean, wide: Boolean },
  template: `
    <label class="adm-field" :class="{ wide }">
      <span v-if="label" class="adm-label">{{ label }}<em v-if="required">*</em></span>
      <slot />
      <small v-if="hint" class="adm-hint">{{ hint }}</small>
    </label>
  `,
});

/** Switch toggle. */
export const AToggle = defineComponent({
  name: 'AToggle',
  props: { modelValue: Boolean, label: String, hint: String },
  emits: ['update:modelValue'],
  template: `
    <label class="adm-toggle">
      <input type="checkbox" :checked="modelValue" @change="$emit('update:modelValue', $event.target.checked)" />
      <span class="adm-toggle-track"><span class="adm-toggle-thumb"></span></span>
      <span class="adm-toggle-text">
        <strong v-if="label">{{ label }}</strong>
        <small v-if="hint">{{ hint }}</small>
      </span>
    </label>
  `,
});

/** Bilingual text input {sk, en}. English field can be hidden globally. */
export const BiInput = defineComponent({
  name: 'BiInput',
  props: {
    modelValue: { type: Object, default: () => ({ sk: '', en: '' }) },
    label: String,
    hint: String,
    multiline: Boolean,
    rows: { type: Number, default: 3 },
    placeholder: String,
    required: Boolean,
    maxlength: Number,
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    function update(lang, value) {
      emit('update:modelValue', { ...(props.modelValue || {}), [lang]: value });
    }
    const missingEn = computed(() => !!(props.modelValue?.sk && !props.modelValue?.en));
    return { ui, update, missingEn };
  },
  template: `
    <div class="adm-field adm-bi">
      <span v-if="label" class="adm-label">
        {{ label }}<em v-if="required">*</em>
        <span v-if="!ui.showEnglish && missingEn" class="adm-badge is-muted" title="Anglický preklad chýba – na anglickej verzii sa zobrazí slovenský text.">EN chýba</span>
      </span>
      <div class="adm-bi-row">
        <span class="adm-lang">SK</span>
        <textarea v-if="multiline" :rows="rows" :value="modelValue?.sk || ''" :placeholder="placeholder" :maxlength="maxlength" @input="update('sk', $event.target.value)"></textarea>
        <input v-else type="text" :value="modelValue?.sk || ''" :placeholder="placeholder" :maxlength="maxlength" @input="update('sk', $event.target.value)" />
      </div>
      <div v-if="ui.showEnglish" class="adm-bi-row is-en">
        <span class="adm-lang">EN</span>
        <textarea v-if="multiline" :rows="rows" :value="modelValue?.en || ''" placeholder="(anglická verzia – ak je prázdna, zobrazí sa slovenský text)" :maxlength="maxlength" @input="update('en', $event.target.value)"></textarea>
        <input v-else type="text" :value="modelValue?.en || ''" placeholder="(anglická verzia)" :maxlength="maxlength" @input="update('en', $event.target.value)" />
      </div>
      <small v-if="hint" class="adm-hint">{{ hint }}</small>
    </div>
  `,
});

/** Image URL with upload + preview. */
export const ImageInput = defineComponent({
  name: 'ImageInput',
  props: { modelValue: String, label: String, hint: String, aspect: { type: String, default: '4 / 3' } },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const uploading = ref(false);
    const fileInput = ref(null);
    async function onFile(event) {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) return;
      uploading.value = true;
      try {
        const data = await api.upload('/api/admin/upload/', file);
        emit('update:modelValue', data.url);
        toast('Obrázok bol nahraný. Nezabudnite uložiť zmeny.');
      } catch (error) {
        toastError(error, 'Obrázok sa nepodarilo nahrať.');
      } finally {
        uploading.value = false;
      }
    }
    return { uploading, fileInput, onFile };
  },
  template: `
    <div class="adm-field adm-image-input">
      <span v-if="label" class="adm-label">{{ label }}</span>
      <div class="adm-image-row">
        <div class="adm-image-preview" :style="{ aspectRatio: aspect }">
          <img v-if="modelValue" :src="modelValue" alt="" />
          <span v-else><i class="fa-regular fa-image"></i> Bez obrázka</span>
        </div>
        <div class="adm-image-actions">
          <button type="button" class="adm-btn is-soft" :disabled="uploading" @click="fileInput.click()">
            <i class="fa-solid" :class="uploading ? 'fa-spinner fa-spin' : 'fa-upload'"></i>
            {{ uploading ? 'Nahrávam…' : (modelValue ? 'Nahradiť obrázok' : 'Nahrať obrázok') }}
          </button>
          <button v-if="modelValue" type="button" class="adm-btn is-ghost is-danger" @click="$emit('update:modelValue', '')">
            <i class="fa-solid fa-trash"></i> Odstrániť
          </button>
          <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden @change="onFile" />
          <small v-if="hint" class="adm-hint">{{ hint }}</small>
        </div>
      </div>
    </div>
  `,
});

/** FontAwesome icon picker. */
export const IconPicker = defineComponent({
  name: 'IconPicker',
  props: { modelValue: String, label: { type: String, default: 'Ikona' } },
  emits: ['update:modelValue'],
  setup() {
    const open = ref(false);
    const icons = computed(() => contentState.icons.length ? contentState.icons : ['fa-spa']);
    return { open, icons };
  },
  template: `
    <div class="adm-field">
      <span class="adm-label">{{ label }}</span>
      <div class="adm-icon-picker">
        <button type="button" class="adm-icon-current" @click="open = !open">
          <i class="fa-solid" :class="modelValue || 'fa-spa'"></i>
          <span>Zmeniť</span>
          <i class="fa-solid fa-chevron-down"></i>
        </button>
        <div v-if="open" class="adm-icon-grid">
          <button v-for="icon in icons" :key="icon" type="button" :class="{ active: icon === modelValue }" @click="$emit('update:modelValue', icon); open = false" :title="icon">
            <i class="fa-solid" :class="icon"></i>
          </button>
        </div>
      </div>
    </div>
  `,
});




/** Sticky bar with save / discard + history & reset menu. */
export const SaveBar = defineComponent({
  name: 'SaveBar',
  props: { dirty: Boolean, saving: Boolean, history: { type: Boolean, default: true } },
  emits: ['save', 'discard', 'history', 'reset'],
  setup() {
    const menu = ref(false);
    return { menu };
  },
  template: `
    <div class="adm-savebar" :class="{ 'is-dirty': dirty }">
      <div class="adm-savebar-inner">
        <span class="adm-savebar-status">
          <template v-if="dirty"><i class="fa-solid fa-circle-exclamation"></i> Máte neuložené zmeny</template>
          <template v-else><i class="fa-solid fa-circle-check"></i> Všetko je uložené</template>
        </span>
        <div class="adm-savebar-actions">
          <div v-if="history" class="adm-menu-wrap">
            <button type="button" class="adm-btn is-ghost" @click="menu = !menu" title="Ďalšie možnosti"><i class="fa-solid fa-clock-rotate-left"></i><span class="hide-sm"> História</span></button>
            <div v-if="menu" class="adm-menu" @click="menu = false">
              <button type="button" @click="$emit('history')"><i class="fa-solid fa-clock-rotate-left"></i> Obnoviť staršiu verziu</button>
              <button type="button" class="is-danger" @click="$emit('reset')"><i class="fa-solid fa-rotate"></i> Obnoviť pôvodný obsah</button>
            </div>
          </div>
          <button type="button" class="adm-btn is-soft" :disabled="!dirty || saving" @click="$emit('discard')">Zahodiť</button>
          <button type="button" class="adm-btn is-primary" :disabled="!dirty || saving" @click="$emit('save')">
            <i class="fa-solid" :class="saving ? 'fa-spinner fa-spin' : 'fa-floppy-disk'"></i> {{ saving ? 'Ukladám…' : 'Uložiť zmeny' }}
          </button>
        </div>
      </div>
    </div>
  `,
});

/** Simple modal dialog. */
export const AModal = defineComponent({
  name: 'AModal',
  props: { title: String, wide: Boolean },
  emits: ['close'],
  template: `
    <teleport to="body">
      <div class="adm-modal-backdrop" @mousedown.self="$emit('close')">
        <div class="adm-modal" :class="{ 'is-wide': wide }" role="dialog" aria-modal="true">
          <header class="adm-modal-head">
            <h3>{{ title }}</h3>
            <button type="button" class="adm-icon-btn" @click="$emit('close')" aria-label="Zavrieť"><i class="fa-solid fa-xmark"></i></button>
          </header>
          <div class="adm-modal-body"><slot /></div>
          <footer v-if="$slots.footer" class="adm-modal-foot"><slot name="footer" /></footer>
        </div>
      </div>
    </teleport>
  `,
});

/** Empty state. */
export const AEmpty = defineComponent({
  name: 'AEmpty',
  props: { icon: { type: String, default: 'fa-inbox' }, text: String },
  template: `<div class="adm-empty"><i class="fa-solid" :class="icon"></i><p>{{ text }}</p><slot /></div>`,
});

/** Header of an admin page. */
export const APageHead = defineComponent({
  name: 'APageHead',
  props: { title: String, subtitle: String },
  template: `
    <div class="adm-page-head">
      <div>
        <h1>{{ title }}</h1>
        <p v-if="subtitle">{{ subtitle }}</p>
      </div>
      <div class="adm-page-actions"><slot /></div>
    </div>
  `,
});

/** Small row actions for ordered lists (up / down / delete). */
export const ListActions = defineComponent({
  name: 'ListActions',
  props: { index: Number, length: Number, removable: { type: Boolean, default: true } },
  emits: ['up', 'down', 'remove'],
  template: `
    <div class="adm-list-actions">
      <button type="button" class="adm-icon-btn" :disabled="index === 0" @click="$emit('up')" title="Posunúť vyššie"><i class="fa-solid fa-arrow-up"></i></button>
      <button type="button" class="adm-icon-btn" :disabled="index === length - 1" @click="$emit('down')" title="Posunúť nižšie"><i class="fa-solid fa-arrow-down"></i></button>
      <button v-if="removable" type="button" class="adm-icon-btn is-danger" @click="$emit('remove')" title="Odstrániť"><i class="fa-solid fa-trash"></i></button>
    </div>
  `,
});

export const adminComponents = {
  ACard, AField, AToggle, BiInput, ImageInput, IconPicker, SaveBar, AModal, AEmpty, APageHead, ListActions,
  ...controlComponents,
};
