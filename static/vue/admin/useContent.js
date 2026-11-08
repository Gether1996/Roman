// Loading / editing / saving of the editable website content (sections).
const { reactive, ref, computed, watch, onBeforeUnmount } = Vue;

import { api, clone, toast, toastError, confirmDialog, fmtDateTime } from './ui.js';
import { store } from '../store.js';

export const contentState = reactive({
  loaded: false,
  loading: false,
  content: null,
  defaults: null,
  icons: [],
  durations: [30, 45, 60, 90, 120],
  workers: ['Roman', 'Evka'],
});

export async function loadContent(force = false) {
  if (contentState.loaded && !force) return contentState;
  contentState.loading = true;
  try {
    const data = await api.get('/api/admin/content/');
    contentState.content = data.content;
    contentState.defaults = data.defaults;
    contentState.icons = data.icons || [];
    contentState.durations = data.durations || contentState.durations;
    contentState.workers = data.workers || contentState.workers;
    contentState.loaded = true;
  } finally {
    contentState.loading = false;
  }
  return contentState;
}

function publishToSite(section, data) {
  contentState.content[section] = clone(data);
  if (store.content) {
    const copy = clone(data);
    if (section === 'general') delete copy.notification_email;
    store.content[section] = copy;
  }
}

// Global registry of dirty editors so the layout can warn before leaving.
export const dirtyEditors = reactive(new Set());

/**
 * Editable copy of one or more content sections.
 *   const { draft, dirty, save, discard } = useSections(['hero', 'promo'])
 */
export function useSections(sections) {
  const draft = reactive({});
  const original = ref('');
  const saving = ref(false);
  const ready = ref(false);
  const key = Symbol('editor');

  function take() {
    for (const section of sections) {
      draft[section] = clone(contentState.content[section]);
    }
    original.value = JSON.stringify(sections.map((s) => draft[s]));
    ready.value = true;
  }

  const dirty = computed(() => ready.value && JSON.stringify(sections.map((s) => draft[s])) !== original.value);

  watch(dirty, (value) => {
    if (value) dirtyEditors.add(key); else dirtyEditors.delete(key);
  });
  onBeforeUnmount(() => dirtyEditors.delete(key));

  loadContent().then(take).catch((error) => toastError(error, 'Obsah sa nepodarilo načítať.'));

  async function save(message = 'Zmeny boli uložené a sú už viditeľné na webe.') {
    saving.value = true;
    try {
      for (const section of sections) {
        const current = JSON.stringify(draft[section]);
        if (current === JSON.stringify(contentState.content[section])) continue;
        const response = await api.post(`/api/admin/content/${section}/`, { data: draft[section] });
        publishToSite(section, response.data);
      }
      take();
      toast(message);
      return true;
    } catch (error) {
      toastError(error, 'Uloženie zlyhalo.');
      return false;
    } finally {
      saving.value = false;
    }
  }

  async function discard() {
    if (dirty.value && !(await confirmDialog({ title: 'Zahodiť neuložené zmeny?', confirm: 'Zahodiť', danger: true, icon: 'warning' }))) {
      return;
    }
    take();
  }

  async function resetToDefaults() {
    const ok = await confirmDialog({
      title: 'Obnoviť pôvodný obsah?',
      text: 'Obsah tejto časti sa vráti na pôvodné (výrobné) nastavenie. Aktuálna verzia sa uloží do histórie, takže ju môžete neskôr obnoviť.',
      confirm: 'Obnoviť pôvodné',
      danger: true,
      icon: 'warning',
    });
    if (!ok) return;
    try {
      for (const section of sections) {
        const response = await api.post(`/api/admin/content/${section}/reset/`);
        publishToSite(section, response.data);
      }
      take();
      toast('Obsah bol obnovený na pôvodný.');
    } catch (error) {
      toastError(error);
    }
  }

  async function showHistory() {
    try {
      const lists = await Promise.all(sections.map((s) => api.get(`/api/admin/content/${s}/revisions/`)));
      const items = lists.flatMap((list, i) => (list.revisions || []).map((r) => ({ ...r, section: sections[i] })))
        .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
      if (!items.length) {
        await window.Swal.fire({ title: 'História verzií', text: 'Zatiaľ nie sú uložené žiadne staršie verzie.', confirmButtonColor: '#0f7e7a', confirmButtonText: 'Zavrieť' });
        return;
      }
      const esc = (v) => String(v || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
      let chosen = null;
      const result = await window.Swal.fire({
        title: 'Obnoviť staršiu verziu',
        html: `<p class="adm-swal-text">Vyberte verziu, ktorá platila pred danou zmenou:</p><div class="adm-swal-list">${items.map((r) => `
          <button type="button" class="adm-swal-option" data-id="${r.id}">
            <i class="fa-solid fa-clock-rotate-left"></i>
            <span><b>${esc(fmtDateTime(r.created_at))}</b>${r.created_by || sections.length > 1 ? `<small>${esc(r.created_by)}${sections.length > 1 ? ' · ' + esc(r.section) : ''}</small>` : ''}</span>
          </button>`).join('')}</div>`,
        showCancelButton: true,
        confirmButtonText: 'Obnoviť',
        cancelButtonText: 'Zrušiť',
        confirmButtonColor: '#0f7e7a',
        reverseButtons: true,
        customClass: { popup: 'adm-swal' },
        didOpen: (popup) => {
          const confirmBtn = window.Swal.getConfirmButton();
          confirmBtn.disabled = true;
          popup.querySelectorAll('.adm-swal-option').forEach((btn) => btn.addEventListener('click', () => {
            popup.querySelectorAll('.adm-swal-option').forEach((b) => b.classList.remove('is-selected'));
            btn.classList.add('is-selected');
            chosen = btn.dataset.id;
            confirmBtn.disabled = false;
          }));
        },
        preConfirm: () => chosen,
      });
      if (!result.isConfirmed || !result.value) return;
      const response = await api.post(`/api/admin/revisions/${result.value}/restore/`);
      publishToSite(response.section, response.data);
      take();
      toast('Staršia verzia bola obnovená.');
    } catch (error) {
      toastError(error);
    }
  }

  return { draft, dirty, saving, ready, save, discard, resetToDefaults, showHistory, contentState };
}
