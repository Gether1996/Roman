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
      const options = {};
      items.forEach((r) => { options[r.id] = `${fmtDateTime(r.created_at)}${r.created_by ? ' – ' + r.created_by : ''}${sections.length > 1 ? ' (' + r.section + ')' : ''}`; });
      const result = await window.Swal.fire({
        title: 'Obnoviť staršiu verziu',
        text: 'Vyberte verziu, ktorá platila pred danou zmenou:',
        input: 'select',
        inputOptions: options,
        showCancelButton: true,
        confirmButtonText: 'Obnoviť',
        cancelButtonText: 'Zrušiť',
        confirmButtonColor: '#0f7e7a',
        reverseButtons: true,
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
