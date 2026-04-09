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
  authModalMode: null,
  async bootstrap() {
    const data = await fetchJSON('/api/bootstrap/');
    this.isAuthenticated = data.is_authenticated;
    this.isSuperuser = data.is_superuser;
    this.language = data.language || 'sk';
    this.user = data.user || this.user;
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
