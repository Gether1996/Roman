// Galéria / cenník a darčekové poukážky (obrázky).
const { defineComponent, ref, computed, onMounted } = Vue;

import { adminComponents } from '../components.js';
import { api, toast, toastError, confirmDialog, plural } from '../ui.js';

const KINDS = {
  gallery: {
    label: 'Galéria / cenník',
    icon: 'fa-images',
    description: 'Fotky v sekcii „Galéria“ na úvodnej stránke. Obrázok s cenníkom je len jedna z fotiek galérie – stačí ho nahradiť novým.',
    empty: 'Galéria je zatiaľ prázdna.',
  },
  vouchers: {
    label: 'Darčekové poukážky',
    icon: 'fa-gift',
    description: 'Obrázky poukážok, ktoré si zákazník môže pozrieť a stiahnuť na úvodnej stránke.',
    empty: 'Zatiaľ nemáte žiadne poukážky.',
  },
};

export const MediaView = defineComponent({
  name: 'MediaView',
  components: { ...adminComponents },
  setup() {
    const route = VueRouter.useRoute();
    const kind = ref(route.query.tab === 'vouchers' ? 'vouchers' : 'gallery');
    const items = ref([]);
    const loading = ref(true);
    const uploading = ref(false);
    const dragOver = ref(false);
    const fileInput = ref(null);
    const counts = ref({ gallery: null, vouchers: null });

    const meta = computed(() => KINDS[kind.value]);

    async function load() {
      loading.value = true;
      try {
        const data = await api.get(`/api/admin/media/${kind.value}/`);
        items.value = data.items || [];
        counts.value[kind.value] = items.value.length;
      } catch (error) {
        toastError(error, 'Obrázky sa nepodarilo načítať.');
      } finally {
        loading.value = false;
      }
    }

    function switchKind(value) {
      if (kind.value === value) return;
      kind.value = value;
      items.value = [];
      load();
    }

    async function upload(fileList) {
      const files = Array.from(fileList || []).filter((f) => f.type.startsWith('image/'));
      if (!files.length) {
        toast('Vyberte prosím obrázky (JPG, PNG, WEBP).', 'error');
        return;
      }
      uploading.value = true;
      try {
        const data = await api.upload(`/api/admin/media/${kind.value}/upload/`, files, 'files');
        items.value.push(...(data.items || []));
        counts.value[kind.value] = items.value.length;
        const n = (data.items || []).length;
        toast(`Nahraných ${n} ${plural(n, 'obrázok', 'obrázky', 'obrázkov')}. Na webe sa zobrazujú hneď.`);
        if (data.errors && data.errors.length) toast(data.errors.join(' '), 'error', 8000);
      } catch (error) {
        toastError(error, 'Obrázky sa nepodarilo nahrať.');
      } finally {
        uploading.value = false;
      }
    }

    function onDrop(event) {
      dragOver.value = false;
      upload(event.dataTransfer?.files);
    }

    function onPick(event) {
      upload(event.target.files);
      event.target.value = '';
    }

    async function update(item, changes) {
      try {
        const data = await api.post(`/api/admin/media/${kind.value}/${item.id}/`, changes);
        Object.assign(item, data.item || changes);
        toast('Uložené.');
      } catch (error) {
        toastError(error, 'Zmenu sa nepodarilo uložiť.');
      }
    }

    function saveCaption(item, value) {
      const caption = String(value || '').trim();
      if (caption === (item.caption || '')) return;
      update(item, { caption });
    }

    async function remove(item) {
      const ok = await confirmDialog({
        title: 'Vymazať obrázok?',
        text: 'Obrázok sa natrvalo odstráni z webu. Ak ho chcete len dočasne schovať, použite prepínač „Zobraziť na webe“.',
        confirm: 'Vymazať',
        danger: true,
        icon: 'warning',
      });
      if (!ok) return;
      try {
        await api.del(`/api/admin/media/${kind.value}/${item.id}/`);
        items.value = items.value.filter((i) => i.id !== item.id);
        counts.value[kind.value] = items.value.length;
        toast('Obrázok bol vymazaný.');
      } catch (error) {
        toastError(error, 'Obrázok sa nepodarilo vymazať.');
      }
    }

    async function move(index, delta) {
      const target = index + delta;
      if (target < 0 || target >= items.value.length) return;
      const list = [...items.value];
      const [item] = list.splice(index, 1);
      list.splice(target, 0, item);
      items.value = list;
      try {
        await api.post(`/api/admin/media/${kind.value}/reorder/`, { ids: list.map((i) => i.id) });
      } catch (error) {
        toastError(error, 'Poradie sa nepodarilo uložiť.');
        load();
      }
    }

    onMounted(load);

    return { KINDS, kind, meta, items, loading, uploading, dragOver, fileInput, counts, switchKind, onDrop, onPick, update, saveCaption, remove, move };
  },
  template: `
    <div>
      <a-page-head title="Galéria a poukážky" subtitle="Nahrajte, usporiadajte alebo skryte obrázky. Zmeny sa na webe prejavia okamžite.">
        <div class="adm-btn-group">
          <button v-for="(k, key) in KINDS" :key="key" type="button" :class="{ active: kind === key }" @click="switchKind(key)">
            <i class="fa-solid" :class="k.icon"></i> {{ k.label }}<template v-if="counts[key] !== null"> ({{ counts[key] }})</template>
          </button>
        </div>
      </a-page-head>

      <a-card :title="meta.label" :icon="meta.icon" :description="meta.description">
        <div class="adm-dropzone" :class="{ 'is-over': dragOver }"
             @click="!uploading && fileInput.click()"
             @dragover.prevent="dragOver = true" @dragleave.prevent="dragOver = false" @drop.prevent="onDrop">
          <i class="fa-solid" :class="uploading ? 'fa-spinner fa-spin' : 'fa-cloud-arrow-up'"></i>
          <strong v-if="uploading">Nahrávam…</strong>
          <template v-else>
            <strong>Pretiahnite sem obrázky</strong> alebo kliknite a vyberte ich z počítača / telefónu
            <div class="adm-small">JPG, PNG, WEBP · max. 10 MB · veľké fotky sa automaticky zmenšia</div>
          </template>
          <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple hidden @change="onPick" />
        </div>

        <div v-if="loading" class="adm-loading"><i class="fa-solid fa-spinner fa-spin"></i> Načítavam…</div>
        <a-empty v-else-if="!items.length" :icon="meta.icon" :text="meta.empty" />
        <div v-else class="adm-media-grid">
          <div v-for="(item, index) in items" :key="item.id" class="adm-media" :class="{ 'is-hidden': !item.is_visible }">
            <div class="adm-media-img">
              <a :href="item.src" target="_blank" rel="noopener" title="Otvoriť v plnej veľkosti"><img :src="item.src" :alt="item.caption || ''" loading="lazy" /></a>
              <span v-if="!item.is_visible" class="adm-badge is-muted"><i class="fa-solid fa-eye-slash"></i> Skrytý</span>
              <span v-else class="adm-badge">#{{ index + 1 }}</span>
            </div>
            <div class="adm-media-body">
              <input type="text" :value="item.caption" placeholder="Popis (nepovinné)" maxlength="200"
                     @change="saveCaption(item, $event.target.value)" @keydown.enter="$event.target.blur()" />
              <a-toggle :model-value="item.is_visible" label="Zobraziť na webe" @update:model-value="update(item, { is_visible: $event })" />
              <div class="adm-media-actions">
                <div>
                  <button type="button" class="adm-icon-btn" :disabled="index === 0" @click="move(index, -1)" title="Posunúť dopredu"><i class="fa-solid fa-arrow-left"></i></button>
                  <button type="button" class="adm-icon-btn" :disabled="index === items.length - 1" @click="move(index, 1)" title="Posunúť dozadu"><i class="fa-solid fa-arrow-right"></i></button>
                </div>
                <button type="button" class="adm-icon-btn is-danger" @click="remove(item)" title="Vymazať"><i class="fa-solid fa-trash"></i></button>
              </div>
            </div>
          </div>
        </div>
      </a-card>

      <p class="adm-hint">Nadpisy a texty sekcií Galéria a Poukážky upravíte v časti <router-link to="/sprava/uvod">Úvodná stránka</router-link>.</p>
    </div>
  `,
});
