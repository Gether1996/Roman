// Služby a cenník + permanentky
const { defineComponent, ref, computed } = Vue;

import { adminComponents } from '../components.js';
import { useSections, contentState } from '../useContent.js';
import { confirmDialog, moveItem, slugify, minutesLabel } from '../ui.js';

function uniqueId(base, list) {
  const root = slugify(base) || 'polozka';
  let id = root;
  let n = 2;
  while (list.some((item) => item.id === id)) {
    id = `${root}-${n}`;
    n += 1;
  }
  return id;
}

export const ServicesView = defineComponent({
  name: 'ServicesView',
  components: { ...adminComponents },
  setup() {
    const { draft, dirty, saving, ready, save, discard, resetToDefaults, showHistory } = useSections(['services', 'passes']);
    const openService = ref(null);
    const openPass = ref(null);

    const services = computed(() => draft.services || []);
    const passes = computed(() => draft.passes || []);
    const workers = computed(() => contentState.workers);
    const durations = computed(() => contentState.durations);

    const previewByWorker = computed(() => workers.value.map((worker) => ({
      worker,
      items: services.value.filter((s) => s.active && (s.workers || []).includes(worker)),
    })));

    function addService() {
      const item = {
        id: uniqueId(`sluzba-${Date.now().toString(36)}`, services.value),
        workers: [...workers.value],
        duration: 60,
        price: '',
        backend_name: '',
        name: { sk: '', en: '' },
        active: true,
        pass_id: '',
      };
      draft.services.push(item);
      openService.value = item.id;
    }

    async function removeService(index) {
      const item = draft.services[index];
      const ok = await confirmDialog({
        title: 'Odstrániť službu?',
        text: `„${item.name?.sk || item.backend_name || 'Bez názvu'}“ sa prestane zobrazovať v rezervácii. Existujúce rezervácie zostanú nezmenené.`,
        confirm: 'Odstrániť',
        danger: true,
        icon: 'warning',
      });
      if (ok) draft.services.splice(index, 1);
    }

    function toggleWorker(item, worker) {
      const list = item.workers || (item.workers = []);
      const idx = list.indexOf(worker);
      if (idx >= 0) list.splice(idx, 1); else list.push(worker);
    }

    function syncBackendName(item) {
      if (!item.backend_name && item.name?.sk) item.backend_name = item.name.sk;
    }

    function addPass() {
      const item = {
        id: uniqueId('permanentka', passes.value),
        enabled: true,
        show_on_home: true,
        icon: 'fa-ticket',
        title: { sk: 'Nová permanentka', en: '' },
        subtitle: { sk: '', en: '' },
        rows: [{ label: { sk: '', en: '' }, price: '' }],
        notes: [],
      };
      draft.passes.push(item);
      openPass.value = item.id;
    }

    async function removePass(index) {
      const item = draft.passes[index];
      const used = services.value.filter((s) => s.pass_id === item.id);
      const ok = await confirmDialog({
        title: 'Odstrániť permanentku?',
        text: used.length
          ? `Permanentka je priradená k ${used.length} službe/službám – pri nich sa prestane zobrazovať informačné okno.`
          : 'Permanentka sa prestane zobrazovať na webe.',
        confirm: 'Odstrániť',
        danger: true,
        icon: 'warning',
      });
      if (!ok) return;
      used.forEach((s) => { s.pass_id = ''; });
      draft.passes.splice(index, 1);
    }

    function passTitle(id) {
      const p = passes.value.find((x) => x.id === id);
      return p ? (p.title?.sk || p.id) : id;
    }

    return {
      draft, dirty, saving, ready, save, discard, resetToDefaults, showHistory,
      services, passes, workers, durations, previewByWorker, openService, openPass,
      addService, removeService, toggleWorker, syncBackendName, addPass, removePass, passTitle,
      moveItem, minutesLabel,
    };
  },
  template: `
    <div>
      <a-page-head title="Služby a cenník" subtitle="Ceny a služby, ktoré si zákazník vyberá pri rezervácii, a permanentky zobrazené na webe.">
        <button class="adm-btn is-primary" @click="addService" :disabled="!ready"><i class="fa-solid fa-plus"></i> Pridať službu</button>
      </a-page-head>

      <div v-if="!ready" class="adm-loading"><i class="fa-solid fa-spinner fa-spin"></i> Načítavam…</div>
      <template v-else>
        <div class="adm-cols">
          <div>
            <a-card title="Služby" icon="fa-tags" description="Poradie tu určuje poradie v rezervácii aj v cenníku na úvodnej stránke.">
              <a-empty v-if="!services.length" icon="fa-tags" text="Zatiaľ nemáte žiadne služby.">
                <button class="adm-btn is-primary" @click="addService"><i class="fa-solid fa-plus"></i> Pridať službu</button>
              </a-empty>
              <div v-for="(item, index) in services" :key="item.id" class="adm-list-item" :class="{ 'is-collapsed': openService !== item.id, 'is-off': !item.active }">
                <div class="adm-list-item-head">
                  <button type="button" class="adm-handle-btn" @click="openService = openService === item.id ? null : item.id" :aria-label="openService === item.id ? 'Zbaliť' : 'Rozbaliť'">
                    <i class="fa-solid" :class="openService === item.id ? 'fa-chevron-down' : 'fa-chevron-right'"></i>
                  </button>
                  <strong @click="openService = openService === item.id ? null : item.id" style="cursor:pointer">
                    {{ item.name?.sk || item.backend_name || 'Nová služba' }}
                  </strong>
                  <span class="adm-badge hide-sm">{{ minutesLabel(item.duration) }}</span>
                  <span class="adm-badge is-approved">{{ item.price || '– €' }}</span>
                  <span v-if="!item.active" class="adm-badge is-muted hide-sm">Skrytá</span>
                  <list-actions :index="index" :length="services.length" @up="moveItem(draft.services, index, -1)" @down="moveItem(draft.services, index, 1)" @remove="removeService(index)" />
                </div>
                <div v-if="openService === item.id" class="adm-list-item-body">
                  <bi-input v-model="item.name" label="Názov služby na webe" required placeholder="napr. 60 min masáž" @focusout="syncBackendName(item)" />
                  <a-field label="Názov v rezervácii / e-mailoch" required hint="Uloží sa do rezervácie a zobrazí sa v e-mailoch a v prehľade rezervácií. Zmena neovplyvní už vytvorené rezervácie.">
                    <input type="text" v-model="item.backend_name" maxlength="250" :placeholder="item.name?.sk || 'napr. 60 min masáž'" />
                  </a-field>
                  <div class="adm-grid-2">
                    <a-field label="Dĺžka" hint="Podľa dĺžky sa overuje voľný čas v kalendári.">
                      <a-select v-model="item.duration" :options="durations.map(d => ({ value: d, label: minutesLabel(d) }))" />
                    </a-field>
                    <a-field label="Cena" hint="Napíšte presne tak, ako sa má zobraziť, napr. „25 €“.">
                      <input type="text" v-model="item.price" maxlength="40" placeholder="25 €" />
                    </a-field>
                  </div>
                  <div class="adm-field">
                    <span class="adm-label">Poskytuje</span>
                    <div class="adm-chip-row">
                      <button v-for="w in workers" :key="w" type="button" class="adm-chip" :class="{ active: (item.workers || []).includes(w) }" @click="toggleWorker(item, w)">
                        <i class="fa-solid" :class="(item.workers || []).includes(w) ? 'fa-check' : 'fa-plus'"></i> {{ w }}
                      </button>
                    </div>
                    <small v-if="!(item.workers || []).length" class="adm-hint" style="color:var(--a-red)">Vyberte aspoň jedného terapeuta.</small>
                  </div>
                  <a-field label="Informačné okno pri výbere" hint="Po výbere služby sa zákazníkovi zobrazí okno s cenníkom vybranej permanentky.">
                    <a-select v-model="item.pass_id" :options="[{ value: '', label: 'Žiadne' }, ...passes.map(p => ({ value: p.id, label: p.title?.sk || p.id, icon: p.icon }))]" />
                  </a-field>
                  <a-toggle v-model="item.active" label="Zobrazovať v rezervácii a v cenníku" hint="Vypnutú službu si zákazník nemôže vybrať." />
                </div>
              </div>
              <button v-if="services.length" type="button" class="adm-btn is-soft" @click="addService"><i class="fa-solid fa-plus"></i> Pridať službu</button>
            </a-card>
          </div>

          <div>
            <a-card title="Čo uvidí zákazník" icon="fa-eye" description="Ponuka v kroku „Vyberte službu“ podľa terapeuta. Zobrazujú sa len služby, ktoré sa časovo zmestia do vybraného termínu.">
              <div v-for="group in previewByWorker" :key="group.worker" style="margin-bottom:1rem">
                <p class="adm-subtitle">{{ group.worker }}</p>
                <div class="adm-preview">
                  <p v-if="!group.items.length" class="adm-muted adm-small" style="margin:0">Žiadne aktívne služby – u tohto terapeuta sa nedá rezervovať.</p>
                  <div v-for="s in group.items" :key="s.id" class="adm-catalog-preview-row">
                    <span>{{ s.name?.sk || s.backend_name }} <i v-if="s.pass_id" class="fa-solid fa-circle-info adm-muted" :title="'Zobrazí okno: ' + passTitle(s.pass_id)"></i></span>
                    <strong>{{ s.price }}</strong>
                  </div>
                </div>
              </div>
            </a-card>
          </div>
        </div>

        <a-card title="Permanentky" icon="fa-ticket" description="Cenníky permanentiek (napr. SM systém). Môžu sa zobraziť na úvodnej stránke v cenníku a ako informačné okno pri výbere služby.">
          <template #actions>
            <button class="adm-btn is-soft is-sm" @click="addPass"><i class="fa-solid fa-plus"></i> Pridať permanentku</button>
          </template>
          <a-empty v-if="!passes.length" icon="fa-ticket" text="Žiadne permanentky." />
          <div v-for="(pass, pIndex) in passes" :key="pass.id" class="adm-list-item" :class="{ 'is-collapsed': openPass !== pass.id, 'is-off': !pass.enabled }">
            <div class="adm-list-item-head">
              <button type="button" class="adm-handle-btn" @click="openPass = openPass === pass.id ? null : pass.id">
                <i class="fa-solid" :class="openPass === pass.id ? 'fa-chevron-down' : 'fa-chevron-right'"></i>
              </button>
              <i class="fa-solid" :class="pass.icon || 'fa-ticket'" style="color:var(--a-brand)"></i>
              <strong @click="openPass = openPass === pass.id ? null : pass.id" style="cursor:pointer">{{ pass.title?.sk || pass.id }}</strong>
              <span v-if="!pass.enabled" class="adm-badge is-muted">Vypnutá</span>
              <list-actions :index="pIndex" :length="passes.length" @up="moveItem(draft.passes, pIndex, -1)" @down="moveItem(draft.passes, pIndex, 1)" @remove="removePass(pIndex)" />
            </div>
            <div v-if="openPass === pass.id" class="adm-list-item-body">
              <div class="adm-grid-2">
                <a-toggle v-model="pass.enabled" label="Aktívna" hint="Vypnutá permanentka sa nikde nezobrazí." />
                <a-toggle v-model="pass.show_on_home" label="Zobraziť v cenníku na úvodnej stránke" />
              </div>
              <div class="adm-grid-2">
                <a-field label="Identifikátor" hint="Interný kód, používa sa pri priradení k službe.">
                  <input type="text" :value="pass.id" disabled />
                </a-field>
                <icon-picker v-model="pass.icon" />
              </div>
              <bi-input v-model="pass.title" label="Nadpis" required />
              <bi-input v-model="pass.subtitle" label="Podnadpis" />

              <p class="adm-subtitle" style="margin-top:.5rem">Ceny</p>
              <div v-for="(row, rIndex) in pass.rows" :key="rIndex" class="adm-catalog-row">
                <bi-input v-model="row.label" :label="'Položka ' + (rIndex + 1)" placeholder="napr. 3 vstupy" />
                <a-field label="Cena"><input type="text" v-model="row.price" maxlength="40" placeholder="45 €" /></a-field>
                <list-actions :index="rIndex" :length="pass.rows.length" @up="moveItem(pass.rows, rIndex, -1)" @down="moveItem(pass.rows, rIndex, 1)" @remove="pass.rows.splice(rIndex, 1)" />
              </div>
              <button type="button" class="adm-btn is-soft is-sm" @click="pass.rows.push({ label: { sk: '', en: '' }, price: '' })"><i class="fa-solid fa-plus"></i> Pridať cenu</button>

              <p class="adm-subtitle" style="margin-top:1.2rem">Poznámky</p>
              <div v-for="(note, nIndex) in pass.notes" :key="nIndex" class="adm-catalog-row is-note">
                <bi-input v-model="pass.notes[nIndex]" :label="'Poznámka ' + (nIndex + 1)" multiline :rows="2" />
                <list-actions :index="nIndex" :length="pass.notes.length" @up="moveItem(pass.notes, nIndex, -1)" @down="moveItem(pass.notes, nIndex, 1)" @remove="pass.notes.splice(nIndex, 1)" />
              </div>
              <button type="button" class="adm-btn is-soft is-sm" style="margin-bottom:1rem" @click="pass.notes.push({ sk: '', en: '' })"><i class="fa-solid fa-plus"></i> Pridať poznámku</button>
            </div>
          </div>
        </a-card>

        <save-bar :dirty="dirty" :saving="saving" @save="save()" @discard="discard" @history="showHistory" @reset="resetToDefaults" />
      </template>
    </div>
  `,
});
