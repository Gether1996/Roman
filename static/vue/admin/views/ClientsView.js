const { defineComponent, ref, reactive, watch, onMounted } = Vue;

import { api, toast, toastError, confirmDialog, fmtDate, fmtDateTime, plural } from '../ui.js';
import { adminComponents } from '../components.js';

export const ClientsView = defineComponent({
  name: 'ClientsView',
  components: { ...adminComponents },
  setup() {
    const router = VueRouter.useRouter();
    const tab = ref('clients');
    const q = ref('');
    const loading = ref(true);
    const clients = ref([]);
    const users = ref([]);
    const editing = ref(null);
    let timer = null;

    async function load() {
      try {
        const data = await api.get(`/api/admin/clients/?q=${encodeURIComponent(q.value)}`);
        clients.value = data.clients || [];
        users.value = data.users || [];
      } catch (error) {
        toastError(error, 'Klientov sa nepodarilo načítať.');
      } finally {
        loading.value = false;
      }
    }

    function openNew() {
      editing.value = { id: null, name_surname: '', email: '', phone_number: '' };
    }

    async function save() {
      const c = editing.value;
      try {
        await api.post(c.id ? `/api/admin/clients/${c.id}/` : '/api/admin/clients/save/', c);
        editing.value = null;
        toast('Klient bol uložený.');
        load();
      } catch (error) { toastError(error); }
    }

    async function removeClient(c) {
      if (!(await confirmDialog({ title: 'Odstrániť klienta zo zoznamu?', text: `${c.name_surname} sa už nebude ponúkať pri vytváraní rezervácie. Jeho rezervácie zostanú zachované.`, confirm: 'Odstrániť', danger: true }))) return;
      try {
        await api.del(`/api/admin/clients/${c.id}/`);
        toast('Klient bol odstránený zo zoznamu.');
        load();
      } catch (error) { toastError(error); }
    }

    async function toggleUser(u) {
      try {
        await api.post(`/api/admin/users/${u.id}/`, { is_active: !u.is_active });
        u.is_active = !u.is_active;
        toast(u.is_active ? 'Účet bol odblokovaný.' : 'Účet bol zablokovaný – používateľ sa nebude môcť prihlásiť.');
      } catch (error) { toastError(error); }
    }

    async function removeUser(u) {
      if (!(await confirmDialog({ title: 'Zrušiť účet používateľa?', text: `Účet ${u.email} bude natrvalo zrušený (napr. na žiadosť klienta podľa GDPR). Jeho rezervácie zostanú zachované.`, confirm: 'Zrušiť účet', danger: true, icon: 'warning' }))) return;
      try {
        await api.del(`/api/admin/users/${u.id}/`);
        toast('Účet bol zrušený.');
        load();
      } catch (error) { toastError(error); }
    }

    function showReservations(name) {
      router.push({ path: '/sprava/rezervacie' }).then(() => null);
      setTimeout(() => {
        const input = document.querySelector('.adm-search input');
        if (input) { input.value = name; input.dispatchEvent(new Event('input')); }
      }, 400);
    }

    watch(q, () => { clearTimeout(timer); timer = setTimeout(load, 250); });
    onMounted(load);

    return { tab, q, loading, clients, users, editing, openNew, save, removeClient, toggleUser, removeUser, showReservations, fmtDate, fmtDateTime, plural };
  },
  template: `
    <div>
      <a-page-head title="Klienti a účty" subtitle="Uložení klienti sa ponúkajú pri vytváraní rezervácie. Registrované účty sú klienti, ktorí si na webe vytvorili konto.">
        <button v-if="tab === 'clients'" class="adm-btn is-primary" @click="openNew"><i class="fa-solid fa-user-plus"></i> Nový klient</button>
      </a-page-head>

      <div class="adm-toolbar">
        <div class="adm-btn-group">
          <button :class="{ active: tab === 'clients' }" @click="tab = 'clients'">Uložení klienti ({{ clients.length }})</button>
          <button :class="{ active: tab === 'users' }" @click="tab = 'users'">Registrované účty ({{ users.length }})</button>
        </div>
        <div class="adm-search"><i class="fa-solid fa-magnifying-glass"></i><input v-model.trim="q" type="search" placeholder="Hľadať meno, e-mail, telefón…" /></div>
      </div>

      <div v-if="loading" class="adm-loading"><i class="fa-solid fa-spinner fa-spin"></i></div>

      <div v-else-if="tab === 'clients'" class="adm-table-wrap">
        <a-empty v-if="!clients.length" icon="fa-users" text="Žiadni klienti." />
        <table v-else class="adm-table adm-table-cards">
          <thead><tr><th>Meno</th><th>Kontakt</th><th>Rezervácie</th><th>Posledná návšteva</th><th></th></tr></thead>
          <tbody>
            <tr v-for="c in clients" :key="c.id">
              <td class="adm-strong">{{ c.name_surname }}</td>
              <td>
                <a v-if="c.phone_number" :href="'tel:' + c.phone_number" class="adm-sub" style="color:inherit">{{ c.phone_number }}</a>
                <a v-if="c.email" :href="'mailto:' + c.email" class="adm-sub" style="color:inherit">{{ c.email }}</a>
                <span v-if="!c.phone_number && !c.email" class="adm-muted">–</span>
              </td>
              <td>{{ c.count }}</td>
              <td>{{ c.last_visit ? fmtDate(c.last_visit) : '–' }}</td>
              <td class="adm-td-actions">
                <button class="adm-icon-btn" title="Upraviť" @click="editing = { ...c }"><i class="fa-solid fa-pen"></i></button>
                <button class="adm-icon-btn is-danger" title="Odstrániť zo zoznamu" @click="removeClient(c)"><i class="fa-solid fa-trash"></i></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="adm-table-wrap">
        <a-empty v-if="!users.length" icon="fa-user" text="Žiadne registrované účty." />
        <table v-else class="adm-table adm-table-cards">
          <thead><tr><th>Meno</th><th>E-mail / telefón</th><th>Registrácia</th><th>Posledné prihlásenie</th><th></th></tr></thead>
          <tbody>
            <tr v-for="u in users" :key="u.id" :style="{ opacity: u.is_active ? 1 : .55 }">
              <td class="adm-strong">{{ u.name || '–' }} <span v-if="!u.is_active" class="adm-badge is-muted">zablokovaný</span></td>
              <td><span class="adm-sub" style="color:inherit">{{ u.email }}</span><span class="adm-sub">{{ u.phone_number }}</span></td>
              <td>{{ fmtDate(u.date_joined) }}</td>
              <td>{{ u.last_login ? fmtDateTime(u.last_login) : 'nikdy' }}</td>
              <td class="adm-td-actions">
                <button class="adm-icon-btn" :title="u.is_active ? 'Zablokovať' : 'Odblokovať'" @click="toggleUser(u)"><i class="fa-solid" :class="u.is_active ? 'fa-lock' : 'fa-lock-open'"></i></button>
                <button class="adm-icon-btn is-danger" title="Zrušiť účet" @click="removeUser(u)"><i class="fa-solid fa-user-xmark"></i></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <a-modal v-if="editing" :title="editing.id ? 'Upraviť klienta' : 'Nový klient'" @close="editing = null">
        <a-field label="Meno a priezvisko" required><input v-model="editing.name_surname" type="text" maxlength="150" /></a-field>
        <a-field label="E-mail"><input v-model.trim="editing.email" type="email" maxlength="254" /></a-field>
        <a-field label="Telefón"><input v-model.trim="editing.phone_number" type="tel" maxlength="20" /></a-field>
        <template #footer>
          <button class="adm-btn is-soft" @click="editing = null">Zrušiť</button>
          <button class="adm-btn is-primary" @click="save"><i class="fa-solid fa-floppy-disk"></i> Uložiť</button>
        </template>
      </a-modal>
    </div>
  `,
});
