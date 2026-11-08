// Shared helpers for the superadmin panel (/sprava/). The whole panel is Slovak only.
const { reactive } = Vue;

import { fetchJSON, getCookie } from '../utils/api.js';

export const TZ = 'Europe/Bratislava';

// ------------------------------------------------------------------ dates/times
// All dates from the backend are naive Bratislava local time, exchanged as ISO
// strings. We never pass them through `new Date()` (that would shift them by the
// browser's time zone) – we only re-arrange the parts.

/** Current date/time parts in Slovakia, regardless of the browser's time zone. */
export function nowParts() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date());
  const get = (type) => parts.find((p) => p.type === type)?.value || '00';
  return { y: get('year'), m: get('month'), d: get('day'), hh: get('hour'), mm: get('minute'), ss: get('second') };
}

/** Today in Slovakia as YYYY-MM-DD. */
export function todayISO() {
  const p = nowParts();
  return `${p.y}-${p.m}-${p.d}`;
}

/** Now in Slovakia as naive ISO YYYY-MM-DDTHH:MM:SS (for FullCalendar `now`). */
export function nowISO() {
  const p = nowParts();
  return `${p.y}-${p.m}-${p.d}T${p.hh}:${p.mm}:${p.ss}`;
}

export function addDaysISO(iso, days) {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

/** 'YYYY-MM-DD…' → 'DD. MM. YYYY' */
export function fmtDate(value) {
  if (!value) return '–';
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return String(value);
  return `${match[3]}. ${match[2]}. ${match[1]}`;
}

/** 'YYYY-MM-DDTHH:MM…' → 'DD. MM. YYYY HH:MM' */
export function fmtDateTime(value) {
  if (!value) return '–';
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  if (!match) return fmtDate(value);
  return `${match[3]}. ${match[2]}. ${match[1]} ${match[4]}:${match[5]}`;
}

export const WEEKDAYS = ['nedeľa', 'pondelok', 'utorok', 'streda', 'štvrtok', 'piatok', 'sobota'];
export const WEEKDAYS_SHORT = ['ne', 'po', 'ut', 'st', 'št', 'pi', 'so'];
export const MONTHS = ['január', 'február', 'marec', 'apríl', 'máj', 'jún', 'júl', 'august', 'september', 'október', 'november', 'december'];
export const MONTHS_GEN = ['januára', 'februára', 'marca', 'apríla', 'mája', 'júna', 'júla', 'augusta', 'septembra', 'októbra', 'novembra', 'decembra'];

export function weekday(iso, short = false) {
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number);
  const idx = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return (short ? WEEKDAYS_SHORT : WEEKDAYS)[idx];
}

/** Human label: Dnes / Zajtra / Včera / 'pondelok 10. 11. 2026' */
export function relativeDay(iso) {
  const today = todayISO();
  const day = String(iso).slice(0, 10);
  if (day === today) return 'Dnes';
  if (day === addDaysISO(today, 1)) return 'Zajtra';
  if (day === addDaysISO(today, -1)) return 'Včera';
  return `${weekday(day)} ${fmtDate(day)}`;
}

/** 'MM-DD' → '15. novembra' */
export function fmtMonthDay(mmdd) {
  const match = String(mmdd || '').match(/^(\d{2})-(\d{2})$/);
  if (!match) return '–';
  return `${Number(match[2])}. ${MONTHS_GEN[Number(match[1]) - 1]}`;
}

export function isMonthDayActive(from, to, today = todayISO()) {
  const md = today.slice(5);
  if (!from || !to) return false;
  return from <= to ? (md >= from && md <= to) : (md >= from || md <= to);
}

/** Slovak plural: plural(3, 'rezervácia', 'rezervácie', 'rezervácií') */
export function plural(n, one, few, many) {
  const abs = Math.abs(n);
  if (abs === 1) return one;
  if (abs >= 2 && abs <= 4) return few;
  return many;
}

export function formatPrice(value) {
  return Number(value || 0).toLocaleString('sk-SK', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' €';
}

export function minutesLabel(min) {
  const n = Number(min) || 0;
  if (n < 60) return `${n} min`;
  const h = Math.floor(n / 60);
  const rest = n % 60;
  return rest ? `${h} h ${rest} min` : `${h} h`;
}

// ------------------------------------------------------------------------ API
export function errorMessage(error, fallback = 'Niečo sa nepodarilo. Skúste to prosím znova.') {
  const data = error?.data;
  if (data && typeof data === 'object') {
    return data.message_sk || data.message || data.error || fallback;
  }
  if (error?.status === 403) return 'Nemáte oprávnenie. Prihláste sa prosím znova.';
  return fallback;
}

export const api = {
  get: (url) => fetchJSON(url),
  post: (url, body = {}) => fetchJSON(url, { method: 'POST', body: JSON.stringify(body) }),
  del: (url, body) => fetchJSON(url, { method: 'DELETE', ...(body ? { body: JSON.stringify(body) } : {}) }),
  async upload(url, files, field = 'file') {
    const form = new FormData();
    (Array.isArray(files) ? files : [files]).forEach((file) => form.append(field, file));
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'X-CSRFToken': getCookie('csrftoken'), Accept: 'application/json' },
      body: form,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error('Upload failed');
      error.status = response.status;
      error.data = data;
      throw error;
    }
    return data;
  },
};

// --------------------------------------------------------------- toasts/dialogs
export const ui = reactive({
  toasts: [],
  showEnglish: (() => {
    try { return localStorage.getItem('adm_show_en') !== '0'; } catch (e) { return true; }
  })(),
  pendingCount: 0,
  sidebarOpen: false,
});

export function setShowEnglish(value) {
  ui.showEnglish = value;
  try { localStorage.setItem('adm_show_en', value ? '1' : '0'); } catch (e) { /* ignore */ }
}

let toastId = 0;
export function toast(message, type = 'success', timeout = 3200) {
  const id = ++toastId;
  ui.toasts.push({ id, message, type });
  setTimeout(() => {
    const index = ui.toasts.findIndex((t) => t.id === id);
    if (index >= 0) ui.toasts.splice(index, 1);
  }, timeout);
}

export function toastError(error, fallback) {
  toast(errorMessage(error, fallback), 'error', 6000);
}

const swalBase = {
  confirmButtonColor: '#0f7e7a',
  cancelButtonText: 'Zrušiť',
  confirmButtonText: 'Potvrdiť',
  reverseButtons: true,
  customClass: { popup: 'adm-swal' },
};

export async function confirmDialog({ title, text = '', html = '', confirm = 'Potvrdiť', danger = false, icon = 'question' }) {
  const result = await window.Swal.fire({
    ...swalBase,
    title,
    text: html ? undefined : text,
    html: html || undefined,
    icon,
    showCancelButton: true,
    confirmButtonText: confirm,
    confirmButtonColor: danger ? '#b83b5e' : '#0f7e7a',
    focusCancel: danger,
  });
  return result.isConfirmed;
}

export async function promptDialog({ title, label = '', value = '', placeholder = '', confirm = 'Uložiť', required = false, textarea = false, maxLength = 200 }) {
  const result = await window.Swal.fire({
    ...swalBase,
    title,
    input: textarea ? 'textarea' : 'text',
    inputLabel: label,
    inputValue: value,
    inputPlaceholder: placeholder,
    inputAttributes: { maxlength: String(maxLength) },
    showCancelButton: true,
    confirmButtonText: confirm,
    inputValidator: (v) => (required && !String(v || '').trim() ? 'Toto pole je povinné.' : null),
  });
  return result.isConfirmed ? (result.value ?? '') : null;
}

// ------------------------------------------------------------------- misc utils
export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function moveItem(list, index, delta) {
  const target = index + delta;
  if (target < 0 || target >= list.length) return;
  const [item] = list.splice(index, 1);
  list.splice(target, 0, item);
}

export function slugify(value) {
  return String(value || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
}

export const STATUS_META = {
  pending: { label: 'Čaká na schválenie', cls: 'is-pending', icon: 'fa-hourglass-half' },
  approved: { label: 'Schválená', cls: 'is-approved', icon: 'fa-check' },
  cancelled: { label: 'Zrušená', cls: 'is-cancelled', icon: 'fa-ban' },
};
