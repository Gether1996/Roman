// Custom form controls for the admin panel – replacements for native
// <select>, date/time pickers, number spinners and colour pickers, so they look
// the same on every device and match the panel design.
const { defineComponent, ref, computed, watch, nextTick, onBeforeUnmount } = Vue;

import { fmtDate, todayISO, MONTHS, addDaysISO } from './ui.js';

/* --------------------------------------------------------------- floating */
/**
 * Positions a teleported popup under (or above) an anchor element and keeps it
 * there while scrolling. Closes on outside click / Escape.
 */
function useFloating(anchor, popup, open, { minWidth = true, onClose } = {}) {
  const style = ref({});

  function place() {
    if (!anchor.value || !popup.value) return;
    const rect = anchor.value.getBoundingClientRect();
    const pop = popup.value.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const below = vh - rect.bottom;
    const height = Math.min(pop.height || 300, vh - 16);
    const top = below < height + 8 && rect.top > below ? Math.max(8, rect.top - height - 6) : rect.bottom + 6;
    const width = Math.max(pop.width || 0, minWidth ? rect.width : 0);
    const left = Math.min(Math.max(8, rect.left), Math.max(8, vw - width - 8));
    style.value = {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      ...(minWidth ? { minWidth: `${rect.width}px` } : {}),
      maxHeight: `${vh - 16}px`,
    };
  }

  function onDocDown(event) {
    if (anchor.value?.contains(event.target) || popup.value?.contains(event.target)) return;
    onClose?.();
  }
  function onKey(event) {
    if (event.key === 'Escape') { onClose?.(); anchor.value?.focus?.(); }
  }
  function onScroll(event) {
    if (popup.value?.contains(event.target)) return;
    place();
  }

  function bind() {
    document.addEventListener('mousedown', onDocDown, true);
    document.addEventListener('touchstart', onDocDown, true);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', place);
  }
  function unbind() {
    document.removeEventListener('mousedown', onDocDown, true);
    document.removeEventListener('touchstart', onDocDown, true);
    document.removeEventListener('keydown', onKey);
    window.removeEventListener('scroll', onScroll, true);
    window.removeEventListener('resize', place);
  }

  watch(open, async (value) => {
    if (value) {
      style.value = { position: 'fixed', top: '-9999px', left: '-9999px' };
      await nextTick();
      place();
      bind();
    } else {
      unbind();
    }
  });
  onBeforeUnmount(unbind);

  return { style, place };
}

/* ----------------------------------------------------------------- select */
/**
 * <a-select v-model="x" :options="[{ value, label, icon?, color? }] | ['a','b']" />
 */
export const ASelect = defineComponent({
  name: 'ASelect',
  props: {
    modelValue: { default: null },
    options: { type: Array, default: () => [] },
    placeholder: { type: String, default: 'Vyberte…' },
    size: { type: String, default: '' },
    disabled: Boolean,
    ariaLabel: String,
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { emit }) {
    const open = ref(false);
    const anchor = ref(null);
    const popup = ref(null);
    const active = ref(-1);
    let typed = '';
    let typedTimer = null;

    const items = computed(() => props.options.map((o) => (o !== null && typeof o === 'object' ? o : { value: o, label: String(o) })));
    const selectedIndex = computed(() => items.value.findIndex((o) => o.value === props.modelValue || String(o.value) === String(props.modelValue ?? '')));
    const selected = computed(() => items.value[selectedIndex.value] || null);

    const { style } = useFloating(anchor, popup, open, { onClose: () => { open.value = false; } });

    function toggle() {
      if (props.disabled) return;
      open.value = !open.value;
      if (open.value) {
        active.value = selectedIndex.value >= 0 ? selectedIndex.value : 0;
        nextTick(scrollActive);
      }
    }
    function choose(item) {
      open.value = false;
      if (item.value !== props.modelValue) {
        emit('update:modelValue', item.value);
        emit('change', item.value);
      }
      anchor.value?.focus();
    }
    function scrollActive() {
      popup.value?.querySelector(`[data-index="${active.value}"]`)?.scrollIntoView({ block: 'nearest' });
    }
    function move(delta) {
      const n = items.value.length;
      if (!n) return;
      active.value = (active.value + delta + n) % n;
      nextTick(scrollActive);
    }
    function onKeydown(event) {
      const key = event.key;
      if (!open.value && ['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(key)) {
        event.preventDefault();
        toggle();
        return;
      }
      if (!open.value) return;
      if (key === 'ArrowDown') { event.preventDefault(); move(1); }
      else if (key === 'ArrowUp') { event.preventDefault(); move(-1); }
      else if (key === 'Home') { event.preventDefault(); active.value = 0; nextTick(scrollActive); }
      else if (key === 'End') { event.preventDefault(); active.value = items.value.length - 1; nextTick(scrollActive); }
      else if (key === 'Enter' || key === ' ') { event.preventDefault(); if (items.value[active.value]) choose(items.value[active.value]); }
      else if (key === 'Tab') { open.value = false; }
      else if (key.length === 1) {
        clearTimeout(typedTimer);
        typed += key.toLowerCase();
        typedTimer = setTimeout(() => { typed = ''; }, 600);
        const index = items.value.findIndex((o) => String(o.label).toLowerCase().startsWith(typed));
        if (index >= 0) { active.value = index; nextTick(scrollActive); }
      }
    }

    return { open, anchor, popup, active, items, selected, style, toggle, choose, onKeydown };
  },
  template: `
    <div class="adm-select" :class="[size ? 'is-' + size : '', { 'is-open': open, 'is-disabled': disabled }]">
      <button ref="anchor" type="button" class="adm-select-btn" :disabled="disabled" :aria-label="ariaLabel"
              aria-haspopup="listbox" :aria-expanded="open" @click="toggle" @keydown="onKeydown">
        <span v-if="selected" class="adm-select-value">
          <span v-if="selected.color" class="adm-dot" :style="{ background: selected.color }"></span>
          <i v-if="selected.icon" class="fa-solid" :class="selected.icon"></i>
          {{ selected.label }}
        </span>
        <span v-else class="adm-select-placeholder">{{ placeholder }}</span>
        <i class="fa-solid fa-chevron-down adm-select-chevron"></i>
      </button>
      <teleport to="body">
        <div v-if="open" ref="popup" class="adm-popover adm-select-list" role="listbox" :style="style">
          <button v-for="(item, index) in items" :key="String(item.value)" type="button" role="option" :data-index="index"
                  class="adm-option" :class="{ 'is-active': index === active, 'is-selected': selected && item.value === selected.value }"
                  :aria-selected="selected && item.value === selected.value" @mouseenter="active = index" @click="choose(item)">
            <span v-if="item.color" class="adm-dot" :style="{ background: item.color }"></span>
            <i v-if="item.icon" class="fa-solid" :class="item.icon"></i>
            <span class="adm-option-label">{{ item.label }}</span>
            <i v-if="selected && item.value === selected.value" class="fa-solid fa-check adm-option-check"></i>
          </button>
          <div v-if="!items.length" class="adm-option is-empty">Žiadne možnosti</div>
        </div>
      </teleport>
    </div>
  `,
});

/* ------------------------------------------------------------- checkbox */
export const ACheckbox = defineComponent({
  name: 'ACheckbox',
  props: { modelValue: { default: false }, value: { default: undefined }, label: String, indeterminate: Boolean, disabled: Boolean },
  emits: ['update:modelValue', 'change'],
  setup(props, { emit }) {
    const isArray = computed(() => Array.isArray(props.modelValue));
    const checked = computed(() => (isArray.value ? props.modelValue.includes(props.value) : !!props.modelValue));
    function toggle() {
      if (props.disabled) return;
      let next;
      if (isArray.value) {
        next = checked.value ? props.modelValue.filter((v) => v !== props.value) : [...props.modelValue, props.value];
      } else {
        next = !checked.value;
      }
      emit('update:modelValue', next);
      emit('change', next);
    }
    return { checked, toggle };
  },
  template: `
    <span class="adm-check" :class="{ 'is-checked': checked, 'is-disabled': disabled }" @click.stop>
      <button type="button" role="checkbox" class="adm-check-box" :aria-checked="indeterminate ? 'mixed' : String(checked)"
              :disabled="disabled" @click.prevent="toggle">
        <i v-if="indeterminate && !checked" class="fa-solid fa-minus"></i>
        <i v-else-if="checked" class="fa-solid fa-check"></i>
      </button>
      <span v-if="label || $slots.default" class="adm-check-label" @click="toggle"><slot>{{ label }}</slot></span>
    </span>
  `,
});

/* ------------------------------------------------------------ date picker */
const WEEK_HEAD = ['Po', 'Ut', 'St', 'Št', 'Pi', 'So', 'Ne'];

export const DateInput = defineComponent({
  name: 'DateInput',
  props: {
    modelValue: String,
    min: String,
    max: String,
    placeholder: { type: String, default: 'DD. MM. RRRR' },
    clearable: { type: Boolean, default: true },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const open = ref(false);
    const anchor = ref(null);
    const popup = ref(null);
    const view = ref((props.modelValue || todayISO()).slice(0, 7)); // YYYY-MM
    const { style } = useFloating(anchor, popup, open, { minWidth: false, onClose: () => { open.value = false; } });

    const title = computed(() => {
      const [y, m] = view.value.split('-').map(Number);
      return `${MONTHS[m - 1]} ${y}`;
    });

    const days = computed(() => {
      const [y, m] = view.value.split('-').map(Number);
      const first = `${view.value}-01`;
      const dow = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7; // Monday = 0
      const start = addDaysISO(first, -dow);
      const today = todayISO();
      return Array.from({ length: 42 }, (_, i) => {
        const iso = addDaysISO(start, i);
        return {
          iso,
          day: Number(iso.slice(8, 10)),
          outside: iso.slice(0, 7) !== view.value,
          today: iso === today,
          selected: iso === props.modelValue,
          disabled: (props.min && iso < props.min) || (props.max && iso > props.max),
          weekend: i % 7 >= 5,
        };
      });
    });

    function shift(months) {
      const [y, m] = view.value.split('-').map(Number);
      const date = new Date(Date.UTC(y, m - 1 + months, 1));
      view.value = date.toISOString().slice(0, 7);
    }
    function toggle() {
      open.value = !open.value;
      if (open.value) view.value = (props.modelValue || props.min || todayISO()).slice(0, 7);
    }
    function pick(day) {
      if (day.disabled) return;
      emit('update:modelValue', day.iso);
      open.value = false;
    }
    function pickToday() {
      const today = todayISO();
      if ((props.min && today < props.min) || (props.max && today > props.max)) return;
      emit('update:modelValue', today);
      open.value = false;
    }
    function clear() {
      emit('update:modelValue', '');
      open.value = false;
    }

    return { open, anchor, popup, style, title, days, WEEK_HEAD, shift, toggle, pick, pickToday, clear, fmtDate };
  },
  template: `
    <div class="adm-date-wrap">
      <button ref="anchor" type="button" class="adm-date" :class="{ 'is-open': open }" @click="toggle" aria-haspopup="dialog" :aria-expanded="open">
        <i class="fa-regular fa-calendar"></i>
        <span :class="{ 'is-placeholder': !modelValue }">{{ modelValue ? fmtDate(modelValue) : placeholder }}</span>
        <i v-if="clearable && modelValue" class="fa-solid fa-xmark adm-date-clear" title="Vymazať" @click.stop="clear"></i>
      </button>
      <teleport to="body">
        <div v-if="open" ref="popup" class="adm-popover adm-calendar-pop" role="dialog" aria-label="Výber dátumu" :style="style">
          <div class="adm-cal-head">
            <button type="button" class="adm-icon-btn" @click="shift(-1)" aria-label="Predchádzajúci mesiac"><i class="fa-solid fa-chevron-left"></i></button>
            <strong>{{ title }}</strong>
            <button type="button" class="adm-icon-btn" @click="shift(1)" aria-label="Nasledujúci mesiac"><i class="fa-solid fa-chevron-right"></i></button>
          </div>
          <div class="adm-cal-grid">
            <span v-for="d in WEEK_HEAD" :key="d" class="adm-cal-wd">{{ d }}</span>
            <button v-for="day in days" :key="day.iso" type="button" class="adm-cal-day"
                    :class="{ 'is-outside': day.outside, 'is-today': day.today, 'is-selected': day.selected, 'is-weekend': day.weekend }"
                    :disabled="day.disabled" @click="pick(day)">{{ day.day }}</button>
          </div>
          <div class="adm-cal-foot">
            <button type="button" class="adm-btn is-ghost is-sm" @click="pickToday">Dnes</button>
            <button v-if="clearable && modelValue" type="button" class="adm-btn is-ghost is-sm is-danger" @click="clear">Vymazať</button>
          </div>
        </div>
      </teleport>
    </div>
  `,
});

/* ------------------------------------------------------------ time picker */
function normalizeTime(raw) {
  const value = String(raw || '').trim();
  if (!value) return '';
  let h;
  let m;
  const match = value.match(/^(\d{1,2})\s*[:.,h ]\s*(\d{1,2})$/);
  if (match) {
    h = Number(match[1]); m = Number(match[2]);
  } else if (/^\d{3,4}$/.test(value)) {
    h = Number(value.slice(0, value.length - 2)); m = Number(value.slice(-2));
  } else if (/^\d{1,2}$/.test(value)) {
    h = Number(value); m = 0;
  } else {
    return null;
  }
  if (h > 23 || m > 59) return null;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export const TimeInput = defineComponent({
  name: 'TimeInput',
  props: { modelValue: String, step: { type: Number, default: 300 }, placeholder: { type: String, default: 'HH:MM' } },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const open = ref(false);
    const anchor = ref(null);
    const popup = ref(null);
    const text = ref(props.modelValue || '');
    const invalid = ref(false);
    const { style } = useFloating(anchor, popup, open, { minWidth: false, onClose: () => { open.value = false; } });

    watch(() => props.modelValue, (v) => { text.value = v || ''; invalid.value = false; });

    const minuteStep = computed(() => Math.max(1, Math.round(props.step / 60)));
    const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
    const minutes = computed(() => Array.from({ length: Math.ceil(60 / minuteStep.value) }, (_, i) => String(i * minuteStep.value).padStart(2, '0')));
    const curH = computed(() => (props.modelValue || '').slice(0, 2));
    const curM = computed(() => (props.modelValue || '').slice(3, 5));

    function commit() {
      const normalized = normalizeTime(text.value);
      if (normalized === null) { invalid.value = true; return; }
      invalid.value = false;
      text.value = normalized;
      if (normalized !== props.modelValue) emit('update:modelValue', normalized);
    }
    function setHour(h) {
      emit('update:modelValue', `${h}:${curM.value || '00'}`);
    }
    function setMinute(m) {
      emit('update:modelValue', `${curH.value || '09'}:${m}`);
      open.value = false;
    }
    function openPicker() {
      open.value = true;
      nextTick(() => {
        popup.value?.querySelectorAll('.is-selected').forEach((el) => el.scrollIntoView({ block: 'center' }));
      });
    }

    return { open, anchor, popup, style, text, invalid, hours, minutes, curH, curM, commit, setHour, setMinute, openPicker };
  },
  template: `
    <div ref="anchor" class="adm-time-wrap" :class="{ 'is-invalid': invalid, 'is-open': open }">
      <input class="adm-time" type="text" inputmode="numeric" maxlength="5" :placeholder="placeholder" v-model="text"
             @focus="openPicker" @click="openPicker" @blur="commit" @keydown.enter.prevent="commit(); open = false" />
      <button type="button" class="adm-time-icon" tabindex="-1" @click="open ? (open = false) : openPicker()" aria-label="Vybrať čas">
        <i class="fa-regular fa-clock"></i>
      </button>
      <teleport to="body">
        <div v-if="open" ref="popup" class="adm-popover adm-time-pop" :style="style" @mousedown.prevent>
          <div class="adm-time-col" aria-label="Hodiny">
            <button v-for="h in hours" :key="h" type="button" :class="{ 'is-selected': h === curH }" @click="setHour(h)">{{ h }}</button>
          </div>
          <div class="adm-time-col" aria-label="Minúty">
            <button v-for="m in minutes" :key="m" type="button" :class="{ 'is-selected': m === curM }" @click="setMinute(m)">{{ m }}</button>
          </div>
        </div>
      </teleport>
    </div>
  `,
});

/* --------------------------------------------------------- number stepper */
export const ANumber = defineComponent({
  name: 'ANumber',
  props: { modelValue: [Number, String], min: { type: Number, default: 0 }, max: { type: Number, default: 9999 }, step: { type: Number, default: 1 }, suffix: String },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    function clamp(value) {
      const n = Number(value);
      if (Number.isNaN(n)) return props.min;
      return Math.min(props.max, Math.max(props.min, n));
    }
    function bump(delta) {
      emit('update:modelValue', clamp(Number(props.modelValue || 0) + delta * props.step));
    }
    function onInput(event) {
      const raw = event.target.value.replace(/[^\d]/g, '');
      event.target.value = raw;
      if (raw !== '') emit('update:modelValue', Number(raw));
    }
    function onBlur(event) {
      const value = clamp(event.target.value === '' ? props.min : event.target.value);
      event.target.value = String(value);
      emit('update:modelValue', value);
    }
    return { bump, onInput, onBlur };
  },
  template: `
    <div class="adm-number">
      <button type="button" class="adm-number-btn" :disabled="Number(modelValue) <= min" @click="bump(-1)" aria-label="Menej"><i class="fa-solid fa-minus"></i></button>
      <input type="text" inputmode="numeric" :value="modelValue" @input="onInput" @blur="onBlur"
             @keydown.up.prevent="bump(1)" @keydown.down.prevent="bump(-1)" />
      <span v-if="suffix" class="adm-number-suffix">{{ suffix }}</span>
      <button type="button" class="adm-number-btn" :disabled="Number(modelValue) >= max" @click="bump(1)" aria-label="Viac"><i class="fa-solid fa-plus"></i></button>
    </div>
  `,
});

/* ----------------------------------------------------------- colour picker */
const PALETTE = ['#0f7e7a', '#0b5755', '#14b8a6', '#2563eb', '#4f46e5', '#7c3aed', '#db2777', '#e11d48', '#dc2626', '#ea580c', '#d97706', '#65a30d', '#16a34a', '#475569', '#1f2937', '#a16207'];

export const AColor = defineComponent({
  name: 'AColor',
  props: { modelValue: String },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const open = ref(false);
    const anchor = ref(null);
    const popup = ref(null);
    const hex = ref(props.modelValue || '');
    const { style } = useFloating(anchor, popup, open, { minWidth: false, onClose: () => { open.value = false; } });
    watch(() => props.modelValue, (v) => { hex.value = v || ''; });
    const valid = (v) => /^#[0-9a-fA-F]{6}$/.test(v || '');
    function pick(color) {
      emit('update:modelValue', color);
      open.value = false;
    }
    function onHex() {
      let v = hex.value.trim();
      if (v && !v.startsWith('#')) v = `#${v}`;
      if (valid(v)) emit('update:modelValue', v.toLowerCase());
    }
    return { open, anchor, popup, style, hex, PALETTE, pick, onHex, valid };
  },
  template: `
    <div class="adm-color">
      <button ref="anchor" type="button" class="adm-color-btn" @click="open = !open" aria-label="Vybrať farbu">
        <span class="adm-color-swatch" :style="{ background: valid(modelValue) ? modelValue : '#ffffff' }"></span>
        <span>{{ modelValue || 'Vyberte farbu' }}</span>
        <i class="fa-solid fa-chevron-down adm-select-chevron"></i>
      </button>
      <teleport to="body">
        <div v-if="open" ref="popup" class="adm-popover adm-color-pop" :style="style">
          <div class="adm-color-grid">
            <button v-for="c in PALETTE" :key="c" type="button" :style="{ background: c }" :class="{ 'is-selected': c === modelValue }" :title="c" @click="pick(c)"></button>
          </div>
          <label class="adm-color-hex">
            <span>HEX</span>
            <input type="text" v-model="hex" maxlength="7" placeholder="#0f7e7a" @input="onHex" />
          </label>
        </div>
      </teleport>
    </div>
  `,
});

/* ------------------------------------------------------- recurring day/month */
export const MonthDayInput = defineComponent({
  name: 'MonthDayInput',
  components: { ASelect },
  props: { modelValue: String },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const day = computed(() => Number(String(props.modelValue || '').split('-')[1]) || 1);
    const month = computed(() => Number(String(props.modelValue || '').split('-')[0]) || 1);
    const dayOptions = Array.from({ length: 31 }, (_, i) => ({ value: i + 1, label: `${i + 1}.` }));
    const monthOptions = MONTHS.map((m, i) => ({ value: i + 1, label: m }));
    function set(d, m) {
      const maxDay = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
      emit('update:modelValue', `${String(m).padStart(2, '0')}-${String(Math.min(d, maxDay)).padStart(2, '0')}`);
    }
    return { day, month, set, dayOptions, monthOptions };
  },
  template: `
    <div class="adm-monthday">
      <a-select class="adm-monthday-day" :model-value="day" :options="dayOptions" aria-label="Deň" @update:model-value="v => set(v, month)" />
      <a-select :model-value="month" :options="monthOptions" aria-label="Mesiac" @update:model-value="v => set(day, v)" />
    </div>
  `,
});

export const controlComponents = { ASelect, ACheckbox, DateInput, TimeInput, ANumber, AColor, MonthDayInput };
