const { defineComponent, ref, computed, onMounted } = Vue;
const { useI18n } = VueI18n;

import { fetchJSON } from '../utils/api.js';
import { store, tr, section } from '../store.js';
import { RichText, parseRichText } from '../components/RichText.js';

// All texts, prices, therapists and techniques come from the admin panel
// (/sprava/) – see Roman/backend_funcs/content_defaults.py for the defaults.

function todayMonthDay() {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Bratislava', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const get = (type) => parts.find((p) => p.type === type)?.value;
  return `${get('month')}-${get('day')}`;
}

function isActiveCampaign(campaign, md) {
  if (!campaign?.enabled || !campaign.date_from || !campaign.date_to) return false;
  const { date_from: from, date_to: to } = campaign;
  return from <= to ? (md >= from && md <= to) : (md >= from || md <= to);
}

export const HomeView = defineComponent({
  name: 'HomeView',
  components: { RichText },
  setup() {
    const { t, locale } = useI18n();
    const loading = ref(true);
    const homepage = ref({ photos: [], vouchers: [], reviews: [], roman_avg: 0, evka_avg: 0 });
    const selectedTechnique = ref(null);
    const selectedPhoto = ref('');
    const reviewModalOpen = ref(false);
    const reviewForm = ref({ name_surname: '', worker: 'roman', message: '', stars: 5, consent: false, website: '', error: '', loading: false });

    const hero = computed(() => section('hero'));
    const sections = computed(() => section('sections'));
    const contact = computed(() => section('contact'));
    const general = computed(() => section('general'));
    const S = (name) => sections.value[name] || {};

    const techniqueList = computed(() => (section('techniques', [])).filter((item) => item.visible !== false));
    const techniqueMap = computed(() => Object.fromEntries(techniqueList.value.map((item) => [item.id, item])));
    const therapists = computed(() => (section('therapists', [])).filter((item) => item.visible !== false).map((item) => ({
      ...item,
      techniqueItems: (item.techniques || []).map((id) => techniqueMap.value[id]).filter(Boolean),
    })));

    const promo = computed(() => {
      const config = section('promo');
      const md = todayMonthDay();
      const campaign = (config.campaigns || []).find((c) => isActiveCampaign(c, md));
      if (campaign && tr(campaign.text)) return { ...campaign, active: true };
      return config.enabled !== false && tr(config.text) ? { ...config, active: true } : { active: false };
    });

    const priceGroups = computed(() => {
      const services = section('services', []).filter((s) => s.active !== false);
      const passes = section('passes', []).filter((p) => p.enabled !== false && p.show_on_home !== false);
      return { services, passes };
    });

    const reviewWorkers = computed(() => section('therapists', []).map((item) => ({ key: item.key.toLowerCase(), name: item.key, color: item.color })));
    const workerColor = (key) => section('therapists', []).find((item) => item.key.toLowerCase() === String(key).toLowerCase())?.color || '#0f7e7a';

    const activeTechnique = computed(() => (selectedTechnique.value ? techniqueMap.value[selectedTechnique.value] : null));

    async function loadHomepage() {
      loading.value = true;
      try {
        homepage.value = await fetchJSON('/api/homepage/');
      } finally {
        loading.value = false;
      }
    }

    function openReviewModal() {
      reviewForm.value = { name_surname: '', worker: reviewWorkers.value[0]?.key || 'roman', message: '', stars: 5, consent: false, website: '', error: '', loading: false };
      reviewModalOpen.value = true;
    }

    async function submitReview() {
      const form = reviewForm.value;
      form.error = '';
      if (!form.name_surname || !form.message) {
        form.error = t('home.reviewFormError');
        return;
      }
      if (!form.consent) {
        form.error = locale.value === 'en' ? 'Please agree to the publication of your review.' : 'Prosím, potvrďte súhlas so zverejnením hodnotenia.';
        return;
      }
      form.loading = true;
      try {
        await fetchJSON('/add_review/', {
          method: 'POST',
          body: JSON.stringify({ name_surname: form.name_surname, worker: form.worker, message: form.message, stars: form.stars, consent: form.consent, website: form.website }),
        });
        reviewModalOpen.value = false;
        await loadHomepage();
        await window.Swal.fire({ icon: 'success', title: t('home.reviewSuccess'), confirmButtonColor: '#0f7e7a' });
      } catch (error) {
        form.error = error?.data?.error || error.message || 'Request failed.';
      } finally {
        form.loading = false;
      }
    }

    async function deleteReview(id) {
      const result = await window.Swal.fire({
        title: t('home.deleteReview'), icon: 'warning', showCancelButton: true,
        confirmButtonText: t('common.delete'), cancelButtonText: t('common.cancel'), confirmButtonColor: '#b83b5e',
      });
      if (!result.isConfirmed) return;
      await fetchJSON(`/delete_review/${id}/`, { method: 'DELETE' });
      await loadHomepage();
    }

    function scrollToSection(sectionId) {
      const element = document.getElementById(sectionId);
      if (!element) return;
      const top = element.getBoundingClientRect().top + window.scrollY - 104;
      window.scrollTo({ top, behavior: 'smooth' });
    }

    /** Handles admin-configured link targets: '#section', '/path', 'https://…', 'mailto:'… */
    function followTarget(event, target) {
      if (!target) return;
      if (target.startsWith('#')) {
        event.preventDefault();
        scrollToSection(target.slice(1));
      }
    }

    function isInternal(target) {
      return target && target.startsWith('/') && !target.startsWith('//');
    }

    onMounted(loadHomepage);

    return {
      store, t, locale, tr, S, loading, homepage, hero, general, contact, promo, therapists, techniqueList, techniqueMap, priceGroups,
      reviewWorkers, workerColor, selectedTechnique, selectedPhoto, activeTechnique, reviewModalOpen, reviewForm,
      openReviewModal, submitReview, deleteReview, scrollToSection, followTarget, isInternal, parseRichText,
    };
  },
  template: `
    <div class="page-home">
      <div v-if="tr(general.maintenance_notice)" class="container-shell site-notice" role="status">
        <i class="fa-solid fa-circle-info"></i>
        <span>{{ tr(general.maintenance_notice) }}</span>
      </div>

      <section class="page-title-section container-shell" id="top">
        <div class="page-title-wrap" v-reveal>
          <h1 class="page-hero-title">{{ tr(hero.title) || 'Masáže Vlčince' }}</h1>
          <p v-if="tr(hero.subtitle)" class="page-hero-sub">{{ tr(hero.subtitle) }}</p>
          <div class="hero-actions hero-actions-centered">
            <router-link class="btn btn-primary-strong" to="/reservation/">{{ tr(hero.cta_primary) || t('home.ctaPrimary') }}</router-link>
            <a v-if="tr(hero.cta_secondary)" class="btn btn-secondary-soft" href="#services" @click.prevent="scrollToSection('services')">{{ tr(hero.cta_secondary) }}</a>
          </div>
        </div>
      </section>

      <section v-if="promo.active" class="promo-bar container-shell">
        <div class="promo-banner" :class="'promo-style-' + (promo.style || 'default')" v-reveal>
<span v-if="promo.style === 'festive'" class="promo-xmas" aria-hidden="true">
            <i class="fa-solid fa-tree promo-tree is-small"></i><span class="promo-tree-main"><i class="fa-solid fa-star promo-star"></i><i class="fa-solid fa-tree promo-tree"></i></span><i class="fa-solid fa-tree promo-tree is-small"></i>
          </span>
          <span class="promo-text"><i v-if="promo.icon && promo.style !== 'festive'" class="fa-solid" :class="promo.icon"></i> {{ tr(promo.text) }}</span>
          <template v-if="tr(promo.button) && promo.target">
            <router-link v-if="isInternal(promo.target)" class="btn btn-secondary-soft" :to="promo.target">{{ tr(promo.button) }}</router-link>
            <a v-else class="btn btn-secondary-soft" :href="promo.target" @click="followTarget($event, promo.target)"
               :target="promo.target.startsWith('http') ? '_blank' : null" :rel="promo.target.startsWith('http') ? 'noopener' : null">{{ tr(promo.button) }}</a>
          </template>
        </div>
      </section>

      <section v-if="S('therapists').visible !== false && therapists.length" class="section-block container-shell" id="services">
        <div class="therapist-grid">
          <article v-for="therapist in therapists" :key="therapist.key" class="therapist-card-modern glass-panel" v-reveal>
            <div class="therapist-visual">
              <img :src="therapist.photo" :alt="therapist.name" loading="lazy" />
              <div class="therapist-overlay">
                <h3>{{ therapist.name }}</h3>
              </div>
            </div>
            <p v-if="tr(therapist.bio)" class="therapist-bio">{{ tr(therapist.bio) }}</p>
            <div class="tech-chip-list">
              <button v-for="technique in therapist.techniqueItems" :key="technique.id" class="tech-chip" @click="selectedTechnique = technique.id">
                <i class="fa-solid" :class="technique.icon"></i>
                <span>{{ tr(technique.title) }}</span>
              </button>
            </div>
          </article>
        </div>
      </section>

      <section v-if="S('techniques').visible !== false && techniqueList.length" class="section-block container-shell" id="techniques">
        <div class="section-header" v-reveal>
          <span v-if="tr(S('techniques').kicker)" class="section-kicker">{{ tr(S('techniques').kicker) }}</span>
          <h2>{{ tr(S('techniques').title) }}</h2>
          <p v-if="tr(S('techniques').text)">{{ tr(S('techniques').text) }}</p>
        </div>
        <div class="techniques-grid">
          <button v-for="technique in techniqueList" :key="technique.id" class="technique-card-modern" v-reveal @click="selectedTechnique = technique.id">
            <i class="fa-solid" :class="technique.icon"></i>
            <strong>{{ tr(technique.title) }}</strong>
            <span>{{ tr(technique.short) }}</span>
          </button>
        </div>
      </section>

      <section v-if="S('pricing').visible !== false && (priceGroups.services.length || priceGroups.passes.length)" class="section-block container-shell" id="pricing">
        <div class="section-header" v-reveal>
          <span v-if="tr(S('pricing').kicker)" class="section-kicker">{{ tr(S('pricing').kicker) }}</span>
          <h2>{{ tr(S('pricing').title) }}</h2>
          <p v-if="tr(S('pricing').text)">{{ tr(S('pricing').text) }}</p>
        </div>
        <div class="pricing-grid">
          <div v-if="priceGroups.services.length" class="glass-panel pricing-card" v-reveal>
            <h3><i class="fa-solid fa-spa"></i> {{ locale === 'en' ? 'Massages' : 'Masáže' }}</h3>
            <div v-for="service in priceGroups.services" :key="service.id" class="pricing-row">
              <span>
                {{ tr(service.name) }}
                <small v-if="service.workers.length === 1" class="pricing-worker">{{ service.workers[0] }}</small>
              </span>
              <strong>{{ service.price }}</strong>
            </div>
          </div>
          <div v-for="pass in priceGroups.passes" :key="pass.id" class="glass-panel pricing-card" v-reveal>
            <h3><i class="fa-solid" :class="pass.icon || 'fa-ticket'"></i> {{ tr(pass.title) }}</h3>
            <p v-if="tr(pass.subtitle)" class="pricing-sub">{{ tr(pass.subtitle) }}</p>
            <div v-for="(row, index) in pass.rows" :key="index" class="pricing-row">
              <span>{{ tr(row.label) }}</span>
              <strong>{{ row.price }}</strong>
            </div>
            <p v-for="(note, index) in pass.notes" :key="'n' + index" class="pricing-note">{{ tr(note) }}</p>
          </div>
        </div>
        <p v-if="tr(S('pricing').note)" class="pricing-footnote">{{ tr(S('pricing').note) }}</p>
      </section>

      <section v-if="S('gallery').visible !== false && homepage.photos.length" class="section-block alt-surface" id="gallery">
        <div class="container-shell">
          <div class="section-header" v-reveal>
            <h2>{{ tr(S('gallery').title) }}</h2>
            <p v-if="tr(S('gallery').text)">{{ tr(S('gallery').text) }}</p>
          </div>
          <div class="media-grid">
            <button v-for="photo in homepage.photos" :key="photo.id" class="media-card" v-reveal @click="selectedPhoto = photo.src" :aria-label="photo.alt">
              <img :src="photo.src" :alt="photo.alt" loading="lazy" />
            </button>
          </div>
        </div>
      </section>

      <section v-if="S('vouchers').visible !== false && homepage.vouchers.length" class="section-block container-shell" id="vouchers">
        <div class="section-header" v-reveal>
          <h2>{{ tr(S('vouchers').title) }}</h2>
          <p v-if="tr(S('vouchers').text)">{{ tr(S('vouchers').text) }}</p>
        </div>
        <div class="voucher-grid">
          <article v-for="voucher in homepage.vouchers" :key="voucher.id" class="voucher-card-modern glass-panel" v-reveal>
            <button class="voucher-image-button" @click="selectedPhoto = voucher.src">
              <img :src="voucher.src" :alt="voucher.alt" loading="lazy" />
            </button>
            <p v-if="voucher.caption" class="voucher-caption">{{ voucher.caption }}</p>
            <a class="btn btn-secondary-soft voucher-download" :href="voucher.src" download>{{ tr(S('vouchers').download_label) || t('home.vouchersDownload') }}</a>
          </article>
        </div>
      </section>

      <section v-if="S('reviews').visible !== false" class="section-block alt-surface" id="reviews">
        <div class="container-shell">
          <div class="section-header" v-reveal>
            <div class="section-header-inline">
              <h2>{{ tr(S('reviews').title) }}</h2>
              <button v-if="S('reviews').allow_new !== false" class="btn btn-primary-strong review-add-inline" @click="openReviewModal()">{{ t('home.addReview') }}</button>
            </div>
            <p v-if="tr(S('reviews').text)">{{ tr(S('reviews').text) }}</p>
          </div>

          <div v-if="loading" class="glass-panel centered-copy">{{ t('common.loading') }}</div>
          <div v-else-if="homepage.reviews.length" class="review-grid">
            <article v-for="review in homepage.reviews" :key="review.id" class="review-card-modern glass-panel" v-reveal>
              <div class="review-topline">
                <div>
                  <h3>{{ review.name_surname }}</h3>
                  <p>{{ review.created_at }}</p>
                </div>
                <span class="review-worker">{{ review.worker }}</span>
              </div>
              <div class="review-stars">
                <i v-for="star in 5" :key="star" class="fa-star" :class="star <= review.stars ? 'fa-solid' : 'fa-regular'"></i>
              </div>
              <p class="review-text">"{{ review.message }}"</p>
              <button v-if="store.isSuperuser" class="review-delete-button" @click="deleteReview(review.id)" :aria-label="t('common.delete')">
                <i class="fa-solid fa-trash"></i>
              </button>
            </article>
          </div>
          <div v-else class="glass-panel centered-copy" v-reveal>{{ t('home.noReviews') }}</div>
        </div>
      </section>

      <section v-if="S('business').visible !== false" class="section-block business-band">
        <div class="container-shell">
          <div class="business-panel business-panel-wide glass-panel" v-reveal>
            <h2>{{ tr(S('business').title) }}</h2>
            <p>{{ tr(S('business').text) }}</p>
            <a v-if="tr(S('business').button) && S('business').button_link" class="btn btn-primary-strong business-cta"
               :href="S('business').button_link" @click="followTarget($event, S('business').button_link)">{{ tr(S('business').button) }}</a>
          </div>
        </div>
      </section>

      <section v-if="S('contact').visible !== false" class="section-block alt-surface" id="contact">
        <div class="container-shell">
          <div class="contact-block" v-reveal>
            <h2 class="contact-title">{{ tr(S('contact').title) || t('home.contactTitle') }}</h2>
            <p v-if="tr(S('contact').text)" class="contact-intro">{{ tr(S('contact').text) }}</p>
            <div class="contact-rows">
              <a v-if="contact.address" :href="contact.maps_url || '#contact'" target="_blank" rel="noopener" class="contact-row">
                <span class="contact-row-icon"><i class="fa-solid fa-location-dot"></i></span>
                <span>{{ contact.address }}</span>
              </a>
              <a v-for="phone in (contact.phones || [])" :key="phone.number" :href="'tel:' + phone.number.replace(/\\s+/g, '')" class="contact-row">
                <span class="contact-row-icon"><i class="fa-solid fa-phone"></i></span>
                <span>{{ phone.label ? phone.label + ': ' : '' }}{{ phone.number }}</span>
              </a>
              <a v-if="contact.email" :href="'mailto:' + contact.email" class="contact-row">
                <span class="contact-row-icon"><i class="fa-solid fa-envelope"></i></span>
                <span>{{ contact.email }}</span>
              </a>
            </div>
            <p v-if="tr(contact.note)" class="contact-note">{{ tr(contact.note) }}</p>
          </div>
        </div>
      </section>

      <div v-if="activeTechnique" class="modal-shell" @click.self="selectedTechnique = null">
        <div class="modal-card technique-modal-card">
          <button type="button" class="modal-close" @click="selectedTechnique = null" :aria-label="t('common.close')">
            <i class="fa-solid fa-xmark"></i>
          </button>
          <div class="technique-modal-inner">
            <div class="technique-modal-text">
              <span class="section-kicker">{{ tr(activeTechnique.short) }}</span>
              <h2>{{ tr(activeTechnique.title) }}</h2>
              <rich-text :text="tr(activeTechnique.body)" heading-tag="h3" />
            </div>
            <img v-if="activeTechnique.image" :src="activeTechnique.image" :alt="tr(activeTechnique.title)" class="technique-modal-image" />
          </div>
        </div>
      </div>

      <div v-if="selectedPhoto" class="modal-shell" @click.self="selectedPhoto = ''">
        <div class="modal-card media-modal-card">
          <button type="button" class="modal-close" @click="selectedPhoto = ''" :aria-label="t('common.close')">
            <i class="fa-solid fa-xmark"></i>
          </button>
          <img :src="selectedPhoto" alt="" class="media-modal-image" />
        </div>
      </div>

      <div v-if="reviewModalOpen" class="modal-shell" @click.self="reviewModalOpen = false">
        <div class="modal-card review-modal-card">
          <button type="button" class="modal-close" @click="reviewModalOpen = false" :aria-label="t('common.close')">
            <i class="fa-solid fa-xmark"></i>
          </button>
          <span class="section-kicker">{{ t('home.reviewModalTitle') }}</span>
          <h2>{{ t('home.reviewModalTitle') }}</h2>
          <label class="field">
            <span>{{ t('reservation.nameSurname') }}</span>
            <input v-model.trim="reviewForm.name_surname" type="text" maxlength="150" />
          </label>
          <div class="field">
            <span>{{ t('home.therapist') }}</span>
            <div class="review-therapist-picker" role="radiogroup" :aria-label="t('home.therapist')">
              <button v-for="w in reviewWorkers" :key="w.key" type="button" class="review-therapist-option"
                      :class="{ active: reviewForm.worker === w.key }" @click="reviewForm.worker = w.key">
                <span class="review-therapist-dot" :style="{ background: w.color }"></span>
                <strong>{{ w.name }}</strong>
              </button>
            </div>
          </div>
          <label class="field">
            <span>{{ t('home.message') }}</span>
            <textarea v-model.trim="reviewForm.message" rows="5" maxlength="1000"></textarea>
          </label>
          <div class="field">
            <span>{{ t('home.rating') }}</span>
            <div class="review-star-picker" role="radiogroup" :aria-label="t('home.rating')">
              <button v-for="star in 5" :key="star" type="button" class="review-star-button"
                      :class="{ active: star <= reviewForm.stars }" :aria-label="star + ' / 5'" @click="reviewForm.stars = star">
                <i class="fa-star" :class="star <= reviewForm.stars ? 'fa-solid' : 'fa-regular'"></i>
              </button>
            </div>
            <strong class="review-rating-value">{{ reviewForm.stars }} / 5</strong>
          </div>
          <input v-model="reviewForm.website" type="text" name="website" class="hp-field" tabindex="-1" autocomplete="off" aria-hidden="true" />
          <label class="consent-check">
            <input type="checkbox" v-model="reviewForm.consent" />
            <span>
              <template v-if="locale === 'en'">I agree that my name and review will be published on this website.
                <router-link to="/ochrana-osobnych-udajov/" target="_blank">Privacy policy</router-link></template>
              <template v-else>Súhlasím so zverejnením môjho mena a hodnotenia na tejto stránke.
                <router-link to="/ochrana-osobnych-udajov/" target="_blank">Ochrana osobných údajov</router-link></template>
            </span>
          </label>
          <p v-if="reviewForm.error" class="form-error">{{ reviewForm.error }}</p>
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary-soft" @click="reviewModalOpen = false">{{ t('common.cancel') }}</button>
            <button type="button" class="btn btn-primary-strong" @click="submitReview()" :disabled="reviewForm.loading">
              {{ reviewForm.loading ? t('common.loading') : t('common.confirm') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
});
