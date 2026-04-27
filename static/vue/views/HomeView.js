const { defineComponent, ref, computed, onMounted } = Vue;
const { useI18n } = VueI18n;

import { fetchJSON } from '../utils/api.js';
import { store } from '../store.js';

const techniques = {
  classic: {
    icon: 'fa-spa',
    sk: {
      title: 'Klasická masáž',
      short: 'Relaxačná a regeneračná',
      body: [
        'Podporuje prekrvenie, uvoľňuje napätie a prináša telu príjemný reštart po náročnom dni.',
        'Hodí sa pri stuhnutí, strese aj ako pravidelná regeneračná starostlivosť.',
      ],
    },
    en: {
      title: 'Classic massage',
      short: 'Relaxing and restorative',
      body: [
        'It improves circulation, releases tension, and helps the body reset after demanding days.',
        'A good choice for stiffness, stress relief, and regular recovery.',
      ],
    },
  },
  myofascial: {
    icon: 'fa-hand-sparkles',
    sk: {
      title: 'Myofasciálne techniky',
      short: 'Uvoľnenie mäkkých tkanív',
      body: [
        'Cielene pracujú s fasciami a svalovým napätím bez zbytočného chaosu v tele.',
        'Vhodné pri obmedzenej pohyblivosti, preťažení a lokálnom diskomforte.',
      ],
    },
    en: {
      title: 'Myofascial techniques',
      short: 'Soft tissue release',
      body: [
        'Focused fascial work designed to release restriction and improve movement quality.',
        'Helpful for overload, reduced mobility, and local discomfort.',
      ],
    },
  },
  sport: {
    icon: 'fa-dumbbell',
    sk: {
      title: 'Športová masáž',
      short: 'Pre aktívnych klientov',
      body: [
        'Dynamickejšia technika zameraná na prípravu alebo regeneráciu po výkone.',
        'Pomáha zlepšiť pocit z pohybu aj rýchlosť návratu do tréningu.',
      ],
    },
    en: {
      title: 'Sports massage',
      short: 'For active clients',
      body: [
        'A more dynamic treatment aimed at preparation or recovery around physical performance.',
        'Supports movement quality and faster return to training.',
      ],
    },
  },
  cupping: {
    icon: 'fa-fire-flame-curved',
    image: '/static/images/cupping.png',
    sk: {
      title: 'Bankovanie',
      short: 'Podpora prekrvenia',
      body: [
        'Tradičná technika s podtlakom, ktorá podporuje prekrvenie a prináša citeľnú úľavu.',
        'Po ošetrení môžu ostať dočasné stopy, ktoré prirodzene zmiznú.',
      ],
    },
    en: {
      title: 'Cupping therapy',
      short: 'Circulation support',
      body: [
        'A traditional suction-based technique that boosts circulation and brings noticeable release.',
        'Temporary marks may remain after treatment and fade naturally.',
      ],
    },
  },
  stones: {
    icon: 'fa-gem',
    sk: {
      title: 'Lávové kamene',
      short: 'Teplo a hĺbková relaxácia',
      body: [
        'Príjemná kombinácia tepla, tlaku a plynulej relaxácie pre telo aj nervový systém.',
      ],
    },
    en: {
      title: 'Hot stones',
      short: 'Warmth and deep relaxation',
      body: [
        'A soothing mix of heat, pressure, and fluid relaxation for body and nervous system.',
      ],
    },
  },
  iastm: {
    icon: 'fa-screwdriver-wrench',
    image: '/static/images/iastm.png',
    sk: {
      title: 'IASTM',
      short: 'Moderná terapia mäkkých tkanív',
      body: [
        'Modernejší prístup k mobilizácii mäkkých tkanív s dôrazom na funkčný výsledok.',
      ],
    },
    en: {
      title: 'IASTM',
      short: 'Modern soft tissue therapy',
      body: [
        'A more modern soft tissue approach focused on restoring function and smoother movement.',
      ],
    },
  },
  rkt: {
    icon: 'fa-stethoscope',
    sk: {
      title: 'RKT techniky',
      short: 'Komplexné rehabilitačné postupy',
      body: [
        'Spájajú manuálnu prácu, mobilizáciu a cielene vedený pohyb do jedného systému.',
      ],
    },
    en: {
      title: 'RKT techniques',
      short: 'Comprehensive rehabilitation approach',
      body: [
        'They combine manual work, mobilization, and guided movement into one system.',
      ],
    },
  },
  sm: {
    icon: 'fa-arrows-spin',
    sk: {
      title: 'SM systém',
      short: 'Stabilizácia chrbtice',
      body: [
        'Plynulé cvičenie a aktivácia svalových reťazcov na podporu držania tela a stability chrbtice.',
      ],
    },
    en: {
      title: 'SM system',
      short: 'Spine stabilization',
      body: [
        'Movement-based activation of muscle chains supporting posture, balance, and spinal stability.',
      ],
    },
  },
};

const techniqueCatalog = {
  classic: {
    icon: 'fa-spa',
    sk: {
      title: 'Klasická masáž',
      short: 'Relaxačná a regeneračná starostlivosť',
      body: [
        'Klasická masáž pomáha uvoľniť svalové napätie, podporuje prekrvenie a prináša telu aj hlave príjemné spomalenie po náročnom dni. Je vhodná pre klientov, ktorí hľadajú kombináciu oddychu, regenerácie a celkového zlepšenia telesného komfortu.',
        'Veľmi dobre sa hodí pri stuhnutí, únave, psychickom strese aj ako pravidelná starostlivosť o telo. Intenzitu prispôsobujeme tomu, či potrebujete skôr jemné uvoľnenie, alebo dôkladnejšie rozmasírovanie problematických miest.',
      ],
    },
    en: {
      title: 'Classic massage',
      short: 'Relaxing and restorative care',
      body: [
        'Classic massage helps release muscular tension, improves circulation, and gives both body and mind a welcome reset after demanding days. It is a great option for clients looking for a balanced combination of relaxation, recovery, and overall physical comfort.',
        'It works especially well for stiffness, fatigue, and stress, but also as part of regular body maintenance. The intensity is adjusted to whether you need a gentler calming treatment or a more thorough release of tense and overloaded areas.',
      ],
    },
  },
  myofascial: {
    icon: 'fa-hand-sparkles',
    sk: {
      title: 'Myofasciálne techniky',
      short: 'Uvoľnenie mäkkých tkanív a fascií',
      body: [
        'Myofasciálne techniky sa zameriavajú na fascie, svalové obaly a obmedzenia, ktoré môžu znižovať pohyblivosť alebo vytvárať nepríjemné pnutie v tele. Ošetrenie je cielenejšie a často prináša pocit väčšej ľahkosti, voľnejšieho pohybu a lepšieho vnímania vlastného tela.',
        'Sú vhodné pri preťažení, lokálnom diskomforte, pocite stiahnutia aj pri dlhodobom sedení alebo jednostrannej záťaži. Technika sa volí citlivo podľa toho, kde je tkanivo skrátené, citlivé alebo menej pružné.',
      ],
    },
    en: {
      title: 'Myofascial techniques',
      short: 'Soft tissue and fascia release',
      body: [
        'Myofascial techniques focus on fascia, soft tissue layers, and restrictions that can reduce mobility or create uncomfortable tension patterns in the body. This type of work is more targeted and often leads to a feeling of lighter movement, better range, and improved body awareness.',
        'They are especially useful for overload, local discomfort, a feeling of tightness, and issues related to prolonged sitting or one-sided physical stress. The treatment is adapted carefully to the areas where tissue feels shortened, sensitive, or less elastic.',
      ],
    },
  },
  sport: {
    icon: 'fa-dumbbell',
    sk: {
      title: 'Športová masáž',
      short: 'Pre aktívnych klientov a športovcov',
      body: [
        'Športová masáž je dynamickejšia a cielenejšia technika určená pre aktívnych klientov, športovcov aj ľudí, ktorí svoje telo pravidelne zaťažujú v práci alebo tréningu. Pomáha pripraviť svaly na výkon, ale aj urýchliť regeneráciu po námahe.',
        'Je vhodná pri stuhnutosti, únave, pocite ťažkých nôh alebo pri opakovanom preťažení konkrétnych partií. Cieľom je zlepšiť komfort pri pohybe, podporiť regeneráciu a uľahčiť návrat k ďalšiemu tréningu alebo bežnej aktivite.',
      ],
    },
    en: {
      title: 'Sports massage',
      short: 'For active clients and athletes',
      body: [
        'Sports massage is a more dynamic and targeted treatment designed for active clients, athletes, and anyone who puts regular physical stress on the body through work or training. It can help prepare muscles for performance as well as support recovery after exertion.',
        'It is especially useful for stiffness, fatigue, a feeling of heavy legs, or repeated overload in specific muscle groups. The goal is to improve comfort in movement, support recovery, and make the return to training or normal activity feel easier and smoother.',
      ],
    },
  },
  cupping: {
    icon: 'fa-fire-flame-curved',
    image: '/static/images/cupping.png',
    sk: {
      title: 'Bankovanie',
      short: 'Podpora prekrvenia a uvoľnenia',
      body: [
        'Bankovanie je tradičná technika využívajúca podtlak, ktorý podporuje prekrvenie, uvoľnenie povrchových aj hlbších vrstiev tkaniva a prináša citeľný pocit úľavy v preťažených oblastiach. Často sa používa ako doplnok k manuálnej terapii alebo masáži.',
        'Po ošetrení môžu zostať dočasné kruhové stopy, ktoré sú bežnou reakciou a postupne prirodzene miznú. Technika sa volí podľa citlivosti klienta a stavu tkaniva tak, aby mala zmysluplný efekt a zároveň bola dobre tolerovaná.',
      ],
    },
    en: {
      title: 'Cupping therapy',
      short: 'Circulation and tissue release support',
      body: [
        'Cupping is a traditional suction-based technique that supports circulation, releases both superficial and deeper tissue layers, and often brings noticeable relief in overloaded areas. It is frequently used as a complementary method alongside manual therapy or massage.',
        'Temporary circular marks may remain after treatment, which is a normal response and fades naturally over time. The intensity is always chosen according to the client’s sensitivity and the current condition of the tissue so the treatment stays effective and well tolerated.',
      ],
    },
  },
  stones: {
    icon: 'fa-gem',
    sk: {
      title: 'Lávové kamene',
      short: 'Teplo a hlboká relaxácia',
      body: [
        'Masáž lávovými kameňmi spája príjemné teplo, plynulé ťahy a hlboký relaxačný účinok na telo aj nervový systém. Nahriate kamene pomáhajú uvoľniť stuhnuté partie jemnejším a zároveň veľmi účinným spôsobom.',
        'Táto technika je vhodná najmä vtedy, keď potrebujete vypnúť, znížiť vnútorné napätie a dopriať si pokojnejšiu, hrejivú formu starostlivosti. Výsledkom býva pocit uvoľnenia, oddychu a celkového príjemného zľahčenia tela.',
      ],
    },
    en: {
      title: 'Hot stones',
      short: 'Warmth and deep relaxation',
      body: [
        'Hot stone massage combines soothing warmth, flowing strokes, and a deeply calming effect on both the body and the nervous system. Heated stones help release tight areas in a gentler yet still very effective way.',
        'This technique is ideal when you need to slow down, reduce inner tension, and enjoy a warmer, calmer form of care. The usual outcome is a strong sense of relaxation, rest, and an overall lighter feeling in the body.',
      ],
    },
  },
  iastm: {
    icon: 'fa-screwdriver-wrench',
    image: '/static/images/iastm.png',
    sk: {
      title: 'IASTM',
      short: 'Moderná terapia mäkkých tkanív',
      body: [
        'IASTM je modernejší prístup k práci s mäkkými tkanivami pomocou špeciálnych nástrojov, ktoré umožňujú presnejšie zacieliť problematické miesta. Využíva sa najmä tam, kde chceme podporiť kvalitu pohybu, pružnosť tkaniva a celkovú funkciu ošetrovanej oblasti.',
        'Technika môže byť vhodná pri pocite stiahnutia, po preťažení alebo ako doplnok pri riešení dlhodobejších funkčných obmedzení. Ošetrenie vždy prispôsobujeme tak, aby bolo účelné, bezpečné a primerané aktuálnemu stavu klienta.',
      ],
    },
    en: {
      title: 'IASTM',
      short: 'Modern soft tissue therapy',
      body: [
        'IASTM is a more modern soft tissue approach using specialized tools that allow more precise work on problematic areas. It is mainly used when the goal is to support movement quality, tissue mobility, and the overall function of the treated region.',
        'This technique can be helpful for feelings of tightness, overload, or as part of addressing longer-lasting functional restrictions. The treatment is always adapted so that it remains purposeful, safe, and appropriate to the client’s current condition.',
      ],
    },
  },
  rkt: {
    icon: 'fa-stethoscope',
    sk: {
      title: 'RKT techniky',
      short: 'Komplexné rehabilitačné postupy',
      body: [
        'RKT techniky spájajú manuálnu prácu, mobilizáciu a cielene vedený pohyb do jedného funkčného systému. Ich cieľom nie je len krátkodobá úľava, ale aj lepšie pochopenie toho, ako telo pracuje a kde vzniká zbytočné preťaženie alebo kompenzácia.',
        'Vhodné sú pri rôznych pohybových obmedzeniach, asymetriách, bolestivých stereotypoch či po dlhšom preťažení. Terapia sa prispôsobuje konkrétnemu problému klienta a často prepája ošetrenie s jednoduchými odporúčaniami pre bežné fungovanie.',
      ],
    },
    en: {
      title: 'RKT techniques',
      short: 'Comprehensive rehabilitation approach',
      body: [
        'RKT techniques combine manual work, mobilization, and guided movement into one functional system. The goal is not only short-term relief, but also a better understanding of how the body works and where unnecessary overload or compensation patterns develop.',
        'They are suitable for various movement restrictions, asymmetries, painful movement habits, or prolonged overload. The therapy is always adapted to the client’s specific issue and often connects hands-on treatment with simple recommendations for everyday functioning.',
      ],
    },
  },
  sm: {
    icon: 'fa-arrows-spin',
    sk: {
      title: 'SM systém',
      short: 'Stabilizácia chrbtice a držania tela',
      body: [
        'SM systém je cielená pohybová metóda zameraná na aktiváciu svalových reťazcov, stabilitu chrbtice a kvalitnejšie držanie tela. Pracuje sa plynulo, kontrolovane a s dôrazom na správne zapojenie tela, nie na bezmyšlienkové opakovanie pohybov.',
        'Je vhodný pri sedavom spôsobe života, pri pocite oslabeného stredu tela, pri stuhnutí chrbta aj ako doplnok k terapii alebo pravidelnému cvičeniu. Pomáha budovať lepšie pohybové návyky a podporuje istejší, voľnejší pohyb v bežnom živote.',
      ],
    },
    en: {
      title: 'SM system',
      short: 'Spinal stability and posture support',
      body: [
        'The SM system is a focused movement method aimed at activating muscle chains, improving spinal stability, and supporting healthier posture. It is performed in a smooth and controlled way with emphasis on correct engagement of the body rather than mindless repetition.',
        'It is especially useful for sedentary lifestyles, feelings of a weak core, back stiffness, or as a complement to therapy and regular exercise. It helps build better movement habits and supports more confident, freer movement in everyday life.',
      ],
    },
  },
};

const therapists = [
  {
    name: 'Roman Zelník',
    image: '/static/images/roman.jpg',
    instagram: 'https://www.instagram.com/masazevlcince/',
    techniques: ['classic', 'sport', 'myofascial', 'cupping', 'iastm', 'rkt', 'sm'],
  },
  {
    name: 'Evka Koribská',
    image: '/static/images/evka.jpg',
    instagram: '',
    techniques: ['classic', 'sport', 'myofascial', 'cupping', 'stones'],
  },
];

export const HomeView = defineComponent({
  name: 'HomeView',
  setup() {
    const { t, locale } = useI18n();
    const loading = ref(true);
    const homepage = ref({
      photos: [],
      vouchers: [],
      reviews: [],
      roman_avg: 0,
      evka_avg: 0,
    });
    const selectedTechnique = ref(null);
    const selectedPhoto = ref('');
    const reviewModalOpen = ref(false);
    const reviewForm = ref({
      name_surname: '',
      worker: 'roman',
      message: '',
      stars: 5,
      error: '',
      loading: false,
    });

    const activeTechnique = computed(() => {
      if (!selectedTechnique.value) {
        return null;
      }
      return techniqueCatalog[selectedTechnique.value]?.[locale.value] || null;
    });
    const activeTechniqueImage = computed(() => {
      if (!selectedTechnique.value || !techniqueCatalog[selectedTechnique.value]) {
        return '';
      }
      return techniqueCatalog[selectedTechnique.value].image || '';
    });

    async function loadHomepage() {
      loading.value = true;
      try {
        homepage.value = await fetchJSON('/api/homepage/');
      } finally {
        loading.value = false;
      }
    }

    function openTechnique(key) {
      selectedTechnique.value = key;
    }

    function closeTechnique() {
      selectedTechnique.value = null;
    }

    function openPhoto(src) {
      selectedPhoto.value = src;
    }

    function closePhoto() {
      selectedPhoto.value = '';
    }

    function openReviewModal() {
      reviewForm.value = {
        name_surname: '',
        worker: 'roman',
        message: '',
        stars: 5,
        error: '',
        loading: false,
      };
      reviewModalOpen.value = true;
    }

    async function submitReview() {
      reviewForm.value.error = '';
      reviewForm.value.loading = true;

      try {
        if (!reviewForm.value.name_surname || !reviewForm.value.message) {
          throw new Error(t('home.reviewFormError'));
        }

        await fetchJSON('/add_review/', {
          method: 'POST',
          body: JSON.stringify({
            name_surname: reviewForm.value.name_surname,
            worker: reviewForm.value.worker,
            message: reviewForm.value.message,
            stars: reviewForm.value.stars,
          }),
        });

        reviewModalOpen.value = false;
        await loadHomepage();
        await window.Swal.fire({
          icon: 'success',
          title: t('home.reviewSuccess'),
          confirmButtonColor: '#0f7e7a',
        });
      } catch (error) {
        reviewForm.value.error = error?.data?.error || error.message || 'Request failed.';
      } finally {
        reviewForm.value.loading = false;
      }
    }

    async function deleteReview(id) {
      const result = await window.Swal.fire({
        title: t('home.deleteReview'),
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: t('common.delete'),
        cancelButtonText: t('common.cancel'),
        confirmButtonColor: '#b83b5e',
      });

      if (!result.isConfirmed) {
        return;
      }

      await fetchJSON(`/delete_review/${id}/`, { method: 'DELETE' });
      await loadHomepage();
    }

    function scrollToSection(sectionId) {
      const element = document.getElementById(sectionId);
      if (!element) {
        return;
      }
      const top = element.getBoundingClientRect().top + window.scrollY - 104;
      window.scrollTo({ top, behavior: 'smooth' });
    }

    onMounted(loadHomepage);

    return {
      store,
      therapists,
      techniques: techniqueCatalog,
      loading,
      homepage,
      selectedTechnique,
      selectedPhoto,
      activeTechnique,
      activeTechniqueImage,
      reviewModalOpen,
      reviewForm,
      openTechnique,
      closeTechnique,
      openPhoto,
      closePhoto,
      openReviewModal,
      submitReview,
      deleteReview,
      scrollToSection,
      t,
      locale,
    };
  },
  template: `
    <div class="page-home">
      <section class="page-title-section container-shell" id="top">
        <div class="page-title-wrap" v-reveal>
          <h1 class="page-hero-title">Masáže Vlčince</h1>
          <p class="page-hero-sub">{{ t('home.subtitle') }}</p>
          <div class="hero-actions hero-actions-centered">
            <router-link class="btn btn-primary-strong" to="/reservation/">{{ t('home.ctaPrimary') }}</router-link>
            <a class="btn btn-secondary-soft" href="#services" @click.prevent="scrollToSection('services')">{{ t('home.ctaSecondary') }}</a>
          </div>
        </div>
      </section>

      <section class="promo-bar container-shell">
        <div class="promo-banner" v-reveal>
          <span>{{ t('home.voucherTip') }}</span>
          <a class="btn btn-secondary-soft" href="#vouchers" @click.prevent="scrollToSection('vouchers')">{{ t('home.voucherAction') }}</a>
        </div>
      </section>

      <section class="section-block container-shell" id="services">
        <div class="therapist-grid">
          <article v-for="therapist in therapists" :key="therapist.name" class="therapist-card-modern glass-panel" v-reveal>
            <div class="therapist-visual">
              <img :src="therapist.image" :alt="therapist.name" />
              <div class="therapist-overlay">
                <h3>{{ therapist.name }}</h3>
              </div>
            </div>
            <div class="tech-chip-list">
              <button
                v-for="techniqueKey in therapist.techniques"
                :key="techniqueKey"
                class="tech-chip"
                @click="openTechnique(techniqueKey)"
              >
                <i class="fa-solid" :class="techniques[techniqueKey].icon"></i>
                <span>{{ techniques[techniqueKey][locale].title }}</span>
              </button>
            </div>
          </article>
        </div>
      </section>

      <section class="section-block container-shell" id="techniques">
        <div class="section-header" v-reveal>
          <span class="section-kicker">{{ t('home.servicesEyebrow') }}</span>
          <h2>{{ t('home.servicesTitle') }}</h2>
          <p>{{ t('home.servicesText') }}</p>
        </div>

        <div class="techniques-grid">
          <button
            v-for="(technique, key) in techniques"
            :key="key"
            class="technique-card-modern"
            v-reveal
            @click="openTechnique(key)"
          >
            <i class="fa-solid" :class="technique.icon"></i>
            <strong>{{ technique[locale].title }}</strong>
            <span>{{ technique[locale].short }}</span>
          </button>
        </div>
      </section>

      <section class="section-block alt-surface" id="gallery">
        <div class="container-shell">
          <div class="section-header" v-reveal>
            <h2>{{ locale === 'sk' ? 'Galéria/Cenník' : 'Gallery/Pricing' }}</h2>
          </div>
          <div class="media-grid">
            <button v-for="photo in homepage.photos" :key="photo.id" class="media-card" v-reveal @click="openPhoto(photo.src)">
              <img :src="photo.src" :alt="photo.alt" />
            </button>
          </div>
        </div>
      </section>

      <section class="section-block container-shell" id="vouchers">
        <div class="section-header" v-reveal>
          <h2>{{ t('home.vouchersTitle') }}</h2>
        </div>
        <div class="voucher-grid">
          <article v-for="voucher in homepage.vouchers" :key="voucher.id" class="voucher-card-modern glass-panel" v-reveal>
            <button class="voucher-image-button" @click="openPhoto(voucher.src)">
              <img :src="voucher.src" :alt="voucher.alt" />
            </button>
            <a class="btn btn-secondary-soft voucher-download" :href="voucher.src" download>{{ t('home.vouchersDownload') }}</a>
          </article>
        </div>
      </section>

      <section class="section-block alt-surface" id="reviews">
        <div class="container-shell">
          <div class="section-header" v-reveal>
            <div class="section-header-inline">
              <button class="btn btn-primary-strong review-add-inline" @click="openReviewModal()">{{ t('home.addReview') }}</button>
              <h2>{{ t('home.reviewsTitle') }}</h2>
            </div>
            <p>{{ t('home.reviewsText') }}</p>
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
              <button v-if="store.isSuperuser" class="review-delete-button" @click="deleteReview(review.id)">
                <i class="fa-solid fa-trash"></i>
              </button>
            </article>
          </div>
          <div v-else class="glass-panel centered-copy" v-reveal>{{ t('home.noReviews') }}</div>
        </div>
      </section>

      <section class="section-block business-band">
        <div class="container-shell">
          <div class="business-panel business-panel-wide glass-panel" v-reveal>
            <h2>{{ t('home.businessTitle') }}</h2>
            <p>
              {{
                locale === 'sk'
                  ? 'Jedinečná príležitosť dopriať svojim zamestnancom kvalitný relax a regeneráciu priamo vo vašom pracovnom prostredí alebo formou poukážok pripravených na mieru. Spoluprácu nastavíme podľa veľkosti tímu, cieľa aj rozpočtu tak, aby priniesla reálnu pridanú hodnotu, lepší komfort a príjemnejšiu atmosféru vo firme.'
                  : 'A unique opportunity to bring high-quality relaxation and recovery to your employees directly in the workplace or through tailored vouchers. We can adapt the cooperation to the size of your team, your goals, and your budget so that it brings real value, greater comfort, and a more positive atmosphere to your company.'
              }}
            </p>
          </div>
        </div>
      </section>

      <section class="section-block alt-surface" id="contact">
        <div class="container-shell">
          <div class="contact-block" v-reveal>
            <h2 class="contact-title">{{ t('home.contactTitle') }}</h2>
            <div class="contact-rows">
              <a href="https://maps.google.com/?q=Matice+Slovenskej+6+Vlcince+Zilina" target="_blank" rel="noopener" class="contact-row">
                <span class="contact-row-icon"><i class="fa-solid fa-location-dot"></i></span>
                <span>Matice Slovenskej 6, Vlčince</span>
              </a>
              <a href="tel:+421902442280" class="contact-row">
                <span class="contact-row-icon"><i class="fa-solid fa-phone"></i></span>
                <span>Roman: +421 902 442 280</span>
              </a>
              <a href="tel:+421948953841" class="contact-row">
                <span class="contact-row-icon"><i class="fa-solid fa-phone"></i></span>
                <span>Evka: +421 948 953 841</span>
              </a>
              <a href="mailto:salonaminask@gmail.com" class="contact-row">
                <span class="contact-row-icon"><i class="fa-solid fa-envelope"></i></span>
                <span>salonaminask@gmail.com</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <div v-if="activeTechnique" class="modal-shell" @click.self="closeTechnique()">
        <div class="modal-card technique-modal-card">
          <button type="button" class="modal-close" @click="closeTechnique()">
            <i class="fa-solid fa-xmark"></i>
          </button>
          <div class="technique-modal-inner">
            <div class="technique-modal-text">
              <span class="section-kicker">{{ activeTechnique.short }}</span>
              <h2>{{ activeTechnique.title }}</h2>
              <p v-for="paragraph in activeTechnique.body" :key="paragraph">{{ paragraph }}</p>
            </div>
            <img v-if="activeTechniqueImage" :src="activeTechniqueImage" :alt="activeTechnique.title" class="technique-modal-image" />
          </div>
        </div>
      </div>

      <div v-if="selectedPhoto" class="modal-shell" @click.self="closePhoto()">
        <div class="modal-card media-modal-card">
          <button type="button" class="modal-close" @click="closePhoto()">
            <i class="fa-solid fa-xmark"></i>
          </button>
          <img :src="selectedPhoto" alt="" class="media-modal-image" />
        </div>
      </div>

      <div v-if="reviewModalOpen" class="modal-shell" @click.self="reviewModalOpen = false">
        <div class="modal-card review-modal-card">
          <button type="button" class="modal-close" @click="reviewModalOpen = false">
            <i class="fa-solid fa-xmark"></i>
          </button>
          <span class="section-kicker">{{ t('home.reviewModalTitle') }}</span>
          <h2>{{ t('home.reviewModalTitle') }}</h2>
          <label class="field">
            <span>{{ t('reservation.nameSurname') }}</span>
            <input v-model.trim="reviewForm.name_surname" type="text" />
          </label>
          <label class="field">
            <span>{{ t('home.therapist') }}</span>
            <select v-model="reviewForm.worker">
              <option value="roman">Roman</option>
              <option value="evka">Evka</option>
            </select>
          </label>
          <label class="field">
            <span>{{ t('home.message') }}</span>
            <textarea v-model.trim="reviewForm.message" rows="5"></textarea>
          </label>
          <label class="field">
            <span>{{ t('home.rating') }}</span>
            <input v-model.number="reviewForm.stars" type="range" min="1" max="5" />
            <strong>{{ reviewForm.stars }} / 5</strong>
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
