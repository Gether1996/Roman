const { defineComponent, reactive, ref, onMounted, watch } = Vue;
const { useI18n } = VueI18n;

import { fetchJSON } from '../utils/api.js';
import { store } from '../store.js';

export const AllReservationsView = defineComponent({
  name: 'AllReservationsView',
  setup() {
    const { t, locale } = useI18n();
    const loading = ref(true);
    const reservations = ref([]);
    const pagination = reactive({
      current_page: 1,
      total_pages: 1,
      total_files: 0,
      files_per_page: 10,
    });
    const filters = reactive({
      name_surname: '',
      email: '',
      phone_number: '',
      date: '',
      slot: '',
      type: '',
      worker: '',
      created_at: '',
      special_request: '',
      status: '',
    });
    const sortBy = ref('datetime_from');
    const order = ref('desc');
    let debounceTimer = null;

    async function loadReservations(page = pagination.current_page) {
      if (!store.isSuperuser) {
        loading.value = false;
        return;
      }

      loading.value = true;
      const query = new URLSearchParams({
        ...filters,
        page: String(page),
        sort_by: sortBy.value,
        order: order.value,
      });

      try {
        const data = await fetchJSON(`/get_all_reservations_data/?${query.toString()}`);
        reservations.value = data.reservations || [];
        Object.assign(pagination, data.pagination || {});
      } finally {
        loading.value = false;
      }
    }

    function queueReload() {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => loadReservations(1), 250);
    }

    function setQuickDate(mode) {
      const date = new Date();
      if (mode === 'tomorrow') {
        date.setDate(date.getDate() + 1);
      }
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      filters.date = `${day}.${month}.${year}`;
      loadReservations(1);
    }

    async function promptDeactivate(reservation) {
      const result = await window.Swal.fire({
        title: t('admin.deactivateConfirm'),
        input: 'text',
        inputLabel: t('admin.internalNote'),
        showCancelButton: true,
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        confirmButtonColor: '#d97706',
      });

      if (!result.isConfirmed) {
        return;
      }

      await fetchJSON('/deactivate_reservation_by_admin/', {
        method: 'DELETE',
        body: JSON.stringify({ id: reservation.id, note: result.value || '' }),
      });
      loadReservations(pagination.current_page);
    }

    async function promptApprove(reservation) {
      const result = await window.Swal.fire({
        title: t('admin.approveConfirm'),
        showCancelButton: true,
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        confirmButtonColor: '#0f7e7a',
      });

      if (!result.isConfirmed) {
        return;
      }

      await fetchJSON('/approve_reservation/', {
        method: 'POST',
        body: JSON.stringify({ id: reservation.id }),
      });
      loadReservations(pagination.current_page);
    }

    async function promptDelete(reservation) {
      const result = await window.Swal.fire({
        title: t('admin.deleteConfirm'),
        text: reservation.name_surname,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: t('common.delete'),
        cancelButtonText: t('common.cancel'),
        confirmButtonColor: '#b83b5e',
      });

      if (!result.isConfirmed) {
        return;
      }

      await fetchJSON('/delete_reservation/', {
        method: 'DELETE',
        body: JSON.stringify({ id: reservation.id }),
      });
      loadReservations(pagination.current_page);
    }

    async function promptNote(reservation) {
      const result = await window.Swal.fire({
        title: t('admin.addNoteFull'),
        input: 'text',
        inputValue: reservation.personal_note || '',
        showCancelButton: true,
        confirmButtonText: t('common.save'),
        cancelButtonText: t('common.cancel'),
        confirmButtonColor: '#0f7e7a',
      });

      if (!result.isConfirmed) {
        return;
      }

      await fetchJSON('/add_personal_note/', {
        method: 'POST',
        body: JSON.stringify({ id: reservation.id, note: result.value || '' }),
      });
      loadReservations(pagination.current_page);
    }

    function resStatusClass(r) {
      if (r.cancellation_reason) return 'status-cancelled';
      if (r.status === 'Schválená') return 'status-ok';
      return 'status-pending';
    }

    function resStatusLabel(r) {
      if (r.cancellation_reason) return t('admin.cancelledLabel');
      if (r.status === 'Schválená') return t('admin.approved');
      if (r.status === 'Čaká sa schválenie') return t('admin.pending');
      return r.status;
    }

    async function saveFilesPerPage(value) {
      await fetchJSON('/save_settings/', {
        method: 'POST',
        body: JSON.stringify({ files_per_page: value }),
      });
      loadReservations(1);
    }

    watch(filters, queueReload, { deep: true });
    onMounted(() => loadReservations(1));

    return {
      store,
      loading,
      reservations,
      pagination,
      filters,
      sortBy,
      order,
      locale,
      setQuickDate,
      loadReservations,
      promptDeactivate,
      promptApprove,
      promptDelete,
      promptNote,
      saveFilesPerPage,
      resStatusClass,
      resStatusLabel,
      t,
    };
  },
  template: `
    <section class="page-section container-shell">
      <div class="section-header">
        <span class="section-kicker">Admin</span>
        <h1>{{ t('admin.reservationsTitle') }}</h1>
      </div>

      <div v-if="!store.isSuperuser" class="glass-panel centered-copy">
        <p>{{ t('common.unauthorized') }}</p>
        <router-link class="btn btn-primary-strong" to="/">{{ t('common.backHome') }}</router-link>
      </div>

      <template v-else>

        <!-- Toolbar -->
        <div class="res-toolbar">
          <div class="res-toolbar-group">
            <button class="btn btn-secondary-soft" @click="filters.worker = filters.worker === 'Roman' ? '' : 'Roman'; loadReservations(1)" :class="{ active: filters.worker === 'Roman' }">Roman</button>
            <button class="btn btn-secondary-soft" @click="filters.worker = filters.worker === 'Evka' ? '' : 'Evka'; loadReservations(1)" :class="{ active: filters.worker === 'Evka' }">Evka</button>
          </div>
          <div class="res-toolbar-group">
            <button class="btn btn-secondary-soft" @click="setQuickDate('today')">
              <i class="fa-solid fa-calendar-day"></i> {{ t('admin.today') }}
            </button>
            <button class="btn btn-secondary-soft" @click="setQuickDate('tomorrow')">
              <i class="fa-solid fa-calendar-plus"></i> {{ t('admin.tomorrow') }}
            </button>
            <button class="btn btn-ghost" @click="Object.keys(filters).forEach(key => filters[key] = ''); loadReservations(1)">
              <i class="fa-solid fa-xmark"></i> {{ t('admin.clearFilters') }}
            </button>
          </div>
          <div class="res-toolbar-group res-toolbar-right">
            <label class="meta-label" style="margin:0">{{ t('admin.perPage') }}:</label>
            <select class="select-inline" :value="pagination.files_per_page" @change="saveFilesPerPage($event.target.value)">
              <option value="5">5</option><option value="10">10</option><option value="20">20</option><option value="50">50</option><option value="100">100</option>
            </select>
          </div>
        </div>

        <!-- Table -->
        <div class="glass-panel res-table-wrap">
          <table class="res-table">
            <thead>
              <tr>
                <th>{{ t('admin.date') }}<br><input v-model.trim="filters.date" class="th-filter" placeholder="DD.MM.YYYY" /></th>
                <th>{{ t('admin.time') }}<br><input v-model.trim="filters.slot" class="th-filter" placeholder="HH:MM" /></th>
                <th>{{ t('admin.worker') }}<br><input v-model.trim="filters.worker" class="th-filter" placeholder="Roman / Evka" /></th>
                <th>{{ t('admin.name') }}<br><input v-model.trim="filters.name_surname" class="th-filter" placeholder="Meno" /></th>
                <th>{{ t('admin.service') }}<br><input v-model.trim="filters.type" class="th-filter" :placeholder="t('admin.service')" /></th>
                <th>{{ t('admin.contact') }}<br><input v-model.trim="filters.phone_number" class="th-filter" :placeholder="t('admin.phonePlaceholder')" /></th>
                <th>{{ t('admin.status') }}<br><input v-model.trim="filters.status" class="th-filter" :placeholder="t('admin.status')" /></th>
                <th class="hide-tablet">{{ t('admin.notes') }}</th>
                <th>{{ t('admin.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="9" class="res-table-empty">{{ t('common.loading') }}</td>
              </tr>
              <tr v-else-if="!reservations.length">
                <td colspan="9" class="res-table-empty">{{ t('admin.noReservations') }}</td>
              </tr>
              <tr v-for="r in reservations" :key="r.id" :class="{ 'row-inactive': !r.active }">
                <td class="td-date"><strong>{{ r.date }}</strong></td>
                <td class="td-time">{{ r.slot }}</td>
                <td>
                  <span class="worker-dot" :style="r.worker === 'Evka' ? 'background:#db2777' : 'background:#0f7e7a'"></span>
                  {{ r.worker }}
                </td>
                <td>
                  <div>{{ r.name_surname }}</div>
                  <div class="td-sub">{{ r.created_at }}</div>
                </td>
                <td>{{ r.massage_name || '-' }}</td>
                <td>
                  <div v-if="r.phone_number"><i class="fa-solid fa-phone td-icon"></i>{{ r.phone_number }}</div>
                  <div v-if="r.email"><i class="fa-solid fa-envelope td-icon"></i>{{ r.email }}</div>
                  <span v-if="!r.phone_number && !r.email">-</span>
                </td>
                <td>
                  <span class="res-status-badge" :class="resStatusClass(r)">{{ resStatusLabel(r) }}</span>
                </td>
                <td class="td-notes hide-tablet">
                  <div v-if="r.special_request" class="td-note"><span class="meta-label">{{ t('admin.client') }}</span> {{ r.special_request }}</div>
                  <div v-if="r.personal_note" class="td-note td-note--admin"><span class="meta-label">Admin</span> {{ r.personal_note }}</div>
                  <div v-if="r.cancellation_reason" class="td-note td-note--cancel"><span class="meta-label">{{ t('admin.cancellation') }}</span> {{ r.cancellation_reason }}</div>
                  <span v-if="!r.special_request && !r.personal_note && !r.cancellation_reason" class="td-muted">–</span>
                </td>
                <td class="td-actions">
                  <button v-if="r.status === 'Čaká sa schválenie'" class="btn-icon btn-icon--ok" :title="t('admin.approve')" @click="promptApprove(r)">
                    <i class="fa-solid fa-check"></i>
                  </button>
                  <button v-if="r.active" class="btn-icon btn-icon--warn" :title="t('admin.deactivate')" @click="promptDeactivate(r)">
                    <i class="fa-solid fa-ban"></i>
                  </button>
                  <button class="btn-icon btn-icon--note" :title="t('admin.addNoteFull')" @click="promptNote(r)">
                    <i class="fa-solid fa-pen"></i>
                  </button>
                  <button class="btn-icon btn-icon--del" :title="t('common.delete')" @click="promptDelete(r)">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="res-pagination">
          <button class="btn btn-secondary-soft" :disabled="pagination.current_page <= 1" @click="loadReservations(pagination.current_page - 1)">
            <i class="fa-solid fa-chevron-left"></i>
          </button>
          <span class="res-page-info">{{ pagination.current_page }} / {{ pagination.total_pages }} &nbsp;·&nbsp; {{ pagination.total_files }} {{ t('admin.total') }}</span>
          <button class="btn btn-secondary-soft" :disabled="pagination.current_page >= pagination.total_pages" @click="loadReservations(pagination.current_page + 1)">
            <i class="fa-solid fa-chevron-right"></i>
          </button>
        </div>

      </template>
    </section>
  `,
});
