const { reactive } = Vue;

import { fetchJSON } from './utils/api.js';

export const store = reactive({
  isBootstrapped: false,
  isAuthenticated: false,
  isSuperuser: false,
  language: 'sk',
  user: {
    email: '',
    name: '',
    surname: '',
    phone_number: '',
  },
  // Editable website content (texts, prices, therapists...) from the admin panel.
  content: null,
  bookingRules: { lead_days: 2 },
  authModalMode: null,
  async bootstrap() {
    const data = await fetchJSON('/api/bootstrap/');
    this.isAuthenticated = data.is_authenticated;
    this.isSuperuser = data.is_superuser;
    this.language = data.language || 'sk';
    this.user = data.user || this.user;
    if (data.content) this.content = data.content;
    if (data.booking_rules) this.bookingRules = data.booking_rules;
    this.isBootstrapped = true;
    return data;
  },
  openAuth(mode) {
    this.authModalMode = mode;
  },
  closeAuth() {
    this.authModalMode = null;
  },
});

/** Pick the right language from a bilingual {sk, en} value (falls back to SK). */
export function tr(value, lang = store.language) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  return (lang === 'en' ? value.en : value.sk) || value.sk || value.en || '';
}

/** Shortcut to a content section with a safe fallback. */
export function section(name, fallback = {}) {
  return (store.content && store.content[name]) || fallback;
}
