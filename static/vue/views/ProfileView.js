const { defineComponent, ref, onMounted, watch } = Vue;
const { useI18n } = VueI18n;

import { fetchJSON } from '../utils/api.js';
import { store } from '../store.js';

export const ProfileView = defineComponent({
  name: 'ProfileView',
  setup() {
    const { t, locale } = useI18n();
    const loading = ref(true);
    const reservations = ref([]);

    async function loadReservations() {
      loading.value = true;
      try {
        const data = await fetchJSON('/api/my-reservations/');
        reservations.value = data.reservations || [];
      } catch (error) {
        reservations.value = [];
      } finally {
        loading.value = false;
      }
    }

    async function cancelReservation(reservationId) {
      const result = await window.Swal.fire({
        title: t('profile.cancelReservation'),
        input: 'text',
        inputLabel: t('profile.cancellationReason'),
        showCancelButton: true,
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        confirmButtonColor: '#0f7e7a',
        inputValidator: (value) => {
          if (!value) {
            return locale.value === 'en' ? 'Please enter a reason.' : 'Prosím zadajte dôvod.';
          }
          return null;
        },
      });

      if (!result.isConfirmed) {
        return;
      }

      await fetchJSON('/deactivate_reservation/', {
        method: 'DELETE',
        body: JSON.stringify({
          reservation_id: reservationId,
          reason: result.value,
        }),
      });

      await loadReservations();
    }

    function isCancelled(reservation) {
      return !reservation.active && !!reservation.cancellation_reason;
    }

    function statusClass(reservation) {
      if (isCancelled(reservation)) return 'status-cancelled';
      if (reservation.status === 'Schválená') return 'status-ok';
      return 'status-pending';
    }

    function statusLabel(reservation) {
      if (isCancelled(reservation)) {
        return store.language === 'en' ? 'Cancelled' : 'Zrušená';
      }
      return reservation.status;
    }

    // C4 FIX: Also reload when user logs in while already on profile page
    watch(() => store.isAuthenticated, (isAuth) => {
      if (isAuth) {
        loadReservations();
      }
    });

    onMounted(loadReservations);

    return {
      store,
      loading,
      reservations,
      cancelReservation,
      statusClass,
      statusLabel,
      t,
    };
  },
  template: `
    <section class="page-section container-shell">
      <div class="section-header">
        <span class="section-kicker">{{ store.user.email }}</span>
        <h1>{{ t('profile.title') }}</h1>
      </div>

      <div v-if="!store.isAuthenticated" class="glass-panel centered-copy">
        <p>{{ t('common.unauthorized') }}</p>
        <router-link class="btn btn-primary-strong" to="/">{{ t('common.backHome') }}</router-link>
      </div>

      <div v-else-if="loading" class="glass-panel centered-copy">{{ t('common.loading') }}</div>

      <div v-else-if="reservations.length" class="res-history-list">
        <article v-for="reservation in reservations" :key="reservation.id" class="glass-panel res-history-card">

          <div class="res-history-head">
            <div class="res-history-when">
              <strong class="res-history-date-val">{{ reservation.date }}</strong>
              <span class="res-history-time-val">{{ reservation.time }}</span>
            </div>
            <span class="res-status-badge" :class="statusClass(reservation)">
              {{ statusLabel(reservation) }}
            </span>
          </div>

          <div class="res-history-body">
            <div class="res-history-field">
              <span class="meta-label">{{ t('profile.therapist') }}</span>
              <span>{{ reservation.worker }}</span>
            </div>
            <div class="res-history-field">
              <span class="meta-label">{{ t('profile.service') }}</span>
              <span>{{ reservation.massage_name || '-' }}</span>
            </div>
            <div v-if="reservation.special_request" class="res-history-field">
              <span class="meta-label">{{ t('reservation.note') }}</span>
              <span>{{ reservation.special_request }}</span>
            </div>
            <div v-if="reservation.cancellation_reason" class="res-history-field res-history-field--full">
              <span class="meta-label">{{ t('profile.cancellationReason') }}</span>
              <span>{{ reservation.cancellation_reason }}</span>
            </div>
          </div>

          <div class="res-history-foot">
            <span class="res-created-label">{{ reservation.created_at }}</span>
            <button
              v-if="!reservation.is_past && reservation.active"
              class="btn btn-danger-soft"
              @click="cancelReservation(reservation.id)"
            >
              {{ t('profile.cancelReservation') }}
            </button>
          </div>

        </article>
      </div>

      <div v-else class="glass-panel centered-copy">{{ t('profile.noReservations') }}</div>
    </section>
  `,
});
