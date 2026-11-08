const { defineComponent, ref, reactive, watch, onMounted } = Vue;

import { api, toast, toastError, confirmDialog, fmtDateTime, plural } from '../ui.js';
import { adminComponents } from '../components.js';

export const ReviewsView = defineComponent({
  name: 'ReviewsView',
  components: { ...adminComponents },
  setup() {
    const loading = ref(true);
    const reviews = ref([]);
    const filters = reactive({ q: '', worker: '', visibility: '' });
    const editing = ref(null);
    let timer = null;

    async function load() {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      try {
        reviews.value = (await api.get(`/api/admin/reviews/?${params}`)).reviews || [];
      } catch (error) {
        toastError(error, 'Hodnotenia sa nepodarilo načítať.');
      } finally {
        loading.value = false;
      }
    }

    async function toggleVisible(review) {
      try {
        await api.post(`/api/admin/reviews/${review.id}/`, { is_visible: !review.is_visible });
        review.is_visible = !review.is_visible;
        toast(review.is_visible ? 'Hodnotenie je opäť zobrazené na webe.' : 'Hodnotenie bolo skryté z webu.');
      } catch (error) { toastError(error); }
    }

    async function remove(review) {
      if (!(await confirmDialog({ title: 'Natrvalo vymazať hodnotenie?', text: `${review.name_surname}: „${review.message.slice(0, 80)}…“ – ak ho chcete len dočasne odstrániť z webu, použite radšej „Skryť“.`, confirm: 'Vymazať', danger: true, icon: 'warning' }))) return;
      try {
        await api.del(`/api/admin/reviews/${review.id}/`);
        reviews.value = reviews.value.filter((r) => r.id !== review.id);
        toast('Hodnotenie bolo vymazané.');
      } catch (error) { toastError(error); }
    }

    function edit(review) {
      editing.value = { ...review };
    }

    async function saveEdit() {
      try {
        await api.post(`/api/admin/reviews/${editing.value.id}/`, {
          name_surname: editing.value.name_surname, message: editing.value.message, stars: editing.value.stars,
        });
        editing.value = null;
        toast('Hodnotenie bolo upravené.');
        load();
      } catch (error) { toastError(error); }
    }

    watch(filters, () => { clearTimeout(timer); timer = setTimeout(load, 250); }, { deep: true });
    onMounted(load);

    return { loading, reviews, filters, editing, toggleVisible, remove, edit, saveEdit, fmtDateTime, plural };
  },
  template: `
    <div>
      <a-page-head title="Hodnotenia" subtitle="Hodnotenia od klientov sa zobrazujú na úvodnej stránke (posledných 15 viditeľných). Nevhodné môžete skryť alebo vymazať.">
        <router-link class="adm-btn is-soft" to="/sprava/uvod"><i class="fa-solid fa-sliders"></i> Nastavenie sekcie</router-link>
      </a-page-head>

      <div class="adm-toolbar">
        <div class="adm-search"><i class="fa-solid fa-magnifying-glass"></i><input v-model.trim="filters.q" type="search" placeholder="Hľadať v menách a texte…" /></div>
        <a-select v-model="filters.worker" :options="[{ value: '', label: 'Obaja terapeuti' }, { value: 'roman', label: 'Roman' }, { value: 'evka', label: 'Evka' }]" />
        <a-select v-model="filters.visibility" :options="[{ value: '', label: 'Všetky hodnotenia' }, { value: 'hidden', label: 'Len skryté' }]" />
      </div>

      <div v-if="loading" class="adm-loading"><i class="fa-solid fa-spinner fa-spin"></i></div>
      <div v-else-if="!reviews.length" class="adm-card"><a-empty icon="fa-star" text="Žiadne hodnotenia." /></div>
      <div v-else class="adm-grid-2">
        <article v-for="r in reviews" :key="r.id" class="adm-card" :style="{ opacity: r.is_visible ? 1 : .6, marginBottom: 0 }">
          <div class="adm-card-body">
            <div style="display:flex;justify-content:space-between;gap:.5rem;align-items:flex-start">
              <div>
                <strong>{{ r.name_surname }}</strong>
                <div class="adm-small adm-muted">{{ fmtDateTime(r.created_at) }} · {{ r.worker === 'evka' ? 'Evka' : 'Roman' }}</div>
              </div>
              <span v-if="!r.is_visible" class="adm-badge is-muted"><i class="fa-solid fa-eye-slash"></i> Skryté</span>
            </div>
            <div style="color:#f59e0b;margin:.4rem 0">
              <i v-for="s in 5" :key="s" class="fa-star" :class="s <= r.stars ? 'fa-solid' : 'fa-regular'"></i>
            </div>
            <p style="margin:0 0 .8rem;white-space:pre-line">{{ r.message }}</p>
            <div style="display:flex;gap:.4rem;flex-wrap:wrap">
              <button class="adm-btn is-soft is-sm" @click="toggleVisible(r)"><i class="fa-solid" :class="r.is_visible ? 'fa-eye-slash' : 'fa-eye'"></i> {{ r.is_visible ? 'Skryť z webu' : 'Zobraziť na webe' }}</button>
              <button class="adm-btn is-ghost is-sm" @click="edit(r)"><i class="fa-solid fa-pen"></i> Upraviť</button>
              <button class="adm-btn is-ghost is-sm is-danger" @click="remove(r)"><i class="fa-solid fa-trash"></i> Vymazať</button>
            </div>
          </div>
        </article>
      </div>

      <a-modal v-if="editing" title="Upraviť hodnotenie" @close="editing = null">
        <p class="adm-alert is-info"><i class="fa-solid fa-circle-info"></i> Upravujte len preklepy alebo nevhodné výrazy – zmysel hodnotenia by mal zostať zachovaný.</p>
        <a-field label="Meno"><input v-model="editing.name_surname" type="text" maxlength="150" /></a-field>
        <a-field label="Hviezdičky">
          <div class="adm-chip-row"><button v-for="s in 5" :key="s" type="button" class="adm-chip" :class="{ active: editing.stars === s }" @click="editing.stars = s">{{ s }} ★</button></div>
        </a-field>
        <a-field label="Text"><textarea v-model="editing.message" rows="6" maxlength="1000"></textarea></a-field>
        <template #footer>
          <button class="adm-btn is-soft" @click="editing = null">Zrušiť</button>
          <button class="adm-btn is-primary" @click="saveEdit"><i class="fa-solid fa-floppy-disk"></i> Uložiť</button>
        </template>
      </a-modal>
    </div>
  `,
});
