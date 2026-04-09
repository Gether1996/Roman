const { defineComponent, reactive, computed } = Vue;
const { useI18n } = VueI18n;

import { store } from '../store.js';
import { fetchJSON, localizedBackendMessage } from '../utils/api.js';

export const AuthModal = defineComponent({
  name: 'AuthModal',
  setup() {
    const { t } = useI18n();

    const form = reactive({
      name: '',
      surname: '',
      email: '',
      phone_number: '',
      password: '',
      confirmPassword: '',
      error: '',
      loading: false,
    });

    const isLogin = computed(() => store.authModalMode === 'login');

    function resetForm() {
      form.name = '';
      form.surname = '';
      form.email = '';
      form.phone_number = '';
      form.password = '';
      form.confirmPassword = '';
      form.error = '';
      form.loading = false;
    }

    function closeModal() {
      store.closeAuth();
      resetForm();
    }

    async function submit() {
      form.error = '';
      form.loading = true;

      try {
        if (isLogin.value) {
          if (!form.email || !form.password) {
            throw new Error(t('auth.missingEmailPassword'));
          }

          const response = await fetchJSON('/login_api/', {
            method: 'POST',
            body: JSON.stringify({
              email: form.email,
              password: form.password,
            }),
          });

          if (response.status !== 'success') {
            throw new Error(response.message || t('auth.loginTitle'));
          }
        } else {
          if (!form.name || !form.surname || !form.email || !form.phone_number || !form.password || !form.confirmPassword) {
            throw new Error(t('auth.missingFields'));
          }
          if (form.password !== form.confirmPassword) {
            throw new Error(t('auth.passwordMismatch'));
          }
          if (form.password.length < 8) {
            throw new Error(t('auth.passwordTooShort'));
          }

          const response = await fetchJSON('/registration/', {
            method: 'POST',
            body: JSON.stringify({
              name: form.name,
              surname: form.surname,
              email: form.email,
              phone_number: form.phone_number,
              password: form.password,
            }),
          });

          if (response.status !== 'success') {
            throw new Error(response.message || t('auth.registerTitle'));
          }
        }

        await store.bootstrap();
        closeModal();
      } catch (error) {
        form.error = localizedBackendMessage(error.data, store.language, error.message || 'Request failed.');
      } finally {
        form.loading = false;
      }
    }

    return {
      store,
      form,
      isLogin,
      closeModal,
      submit,
      t,
    };
  },
  template: `
    <div v-if="store.authModalMode" class="modal-shell" @click.self="closeModal">
      <div class="modal-card auth-card">
        <button type="button" class="modal-close" @click="closeModal" :aria-label="t('common.close')">
          <i class="fa-solid fa-xmark"></i>
        </button>
        <div class="auth-head">
          <span class="section-kicker">{{ isLogin ? t('auth.loginTitle') : t('auth.registerTitle') }}</span>
          <h2>{{ isLogin ? t('auth.loginTitle') : t('auth.registerTitle') }}</h2>
        </div>

        <form class="auth-form" @submit.prevent="submit">
          <template v-if="!isLogin">
            <label class="field">
              <span>{{ t('auth.name') }}</span>
              <input v-model.trim="form.name" type="text" required />
            </label>
            <label class="field">
              <span>{{ t('auth.surname') }}</span>
              <input v-model.trim="form.surname" type="text" required />
            </label>
          </template>

          <label class="field">
            <span>{{ t('auth.email') }}</span>
            <input v-model.trim="form.email" type="email" required />
          </label>

          <label v-if="!isLogin" class="field">
            <span>{{ t('auth.phone') }}</span>
            <input v-model.trim="form.phone_number" type="text" required />
          </label>

          <label class="field">
            <span>{{ t('auth.password') }}</span>
            <input v-model="form.password" type="password" required />
          </label>

          <label v-if="!isLogin" class="field">
            <span>{{ t('auth.confirmPassword') }}</span>
            <input v-model="form.confirmPassword" type="password" required />
          </label>

          <p v-if="form.error" class="form-error">{{ form.error }}</p>

          <div class="modal-actions">
            <button type="button" class="btn btn-secondary-soft" @click="closeModal">{{ t('common.cancel') }}</button>
            <button type="submit" class="btn btn-primary-strong" :disabled="form.loading">
              {{ form.loading ? t('common.loading') : (isLogin ? t('auth.submitLogin') : t('auth.submitRegister')) }}
            </button>
          </div>
          <p class="auth-switch">
            <template v-if="isLogin">
              {{ t('auth.switchToRegister') }}
              <button type="button" class="link-button" @click="store.authModalMode = 'register'">{{ t('auth.registerTitle') }}</button>
            </template>
            <template v-else>
              {{ t('auth.switchToLogin') }}
              <button type="button" class="link-button" @click="store.authModalMode = 'login'">{{ t('auth.loginTitle') }}</button>
            </template>
          </p>
        </form>
      </div>
    </div>
  `,
});
