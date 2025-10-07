function showTechnique(index) {
    const texts = {
        1: {
            en: `
    <strong style="font-size: 30px;">Classic Massage</strong><br><br>
    Stimulates blood and lymph circulation, improves oxygenation and detoxification.<br><br>
    Enhances skin, subcutaneous tissue, and muscle perfusion. Relieves stiffness and tension, and helps emotionally and physically.<br><br>
    Suitable for almost everyone – stress relief, pain removal, or regeneration.
    `,
            sk: `
    <strong style="font-size: 30px;">Klasická masáž</strong><br><br>
    Aktivuje krvný a lymfatický obeh, zlepšuje okysličenie a odvod škodlivín z tela.<br><br>
    Zlepšuje prekrvenie pokožky a svalov, uvoľňuje stuhnuté svaly a uvoľňuje telo aj myseľ.<br><br>
    Vhodná takmer pre každého – na uvoľnenie stresu, odstránenie bolesti alebo regeneráciu.
    `
        },

        2: {
            en: `
    <strong style="font-size: 30px;">Soft Tissue & Myofascial Techniques</strong><br><br>
    Primarily target soft tissue (muscles). Compared to classic massage, these may be slightly more painful and are performed without oil.<br><br>
    Treatment starts seated at the neck and proceeds downward to the tailbone while lying down.<br><br>
    An excellent complement to sport or classic massages; helps prevent stiffness and releases tension.
    `,
            sk: `
    <strong style="font-size: 30px;">Mäkké a myofasciálne techniky</strong><br><br>
    Zamerané najmä na mäkké tkanivá – svaly. V porovnaní s klasickou masážou môžu byť mierne bolestivejšie a vykonávajú sa bez oleja.<br><br>
    Začína sa v sede uvoľnením krčnej chrbtice, potom sa pokračuje v ľahu až ku kostrči.<br><br>
    Výborný doplnok ku klasickej alebo športovej masáži. Zastavuje stuhnutie a uvoľňuje napätie.
    `
        },

        3: {
            en: `
    <strong style="font-size: 30px;">Sports Massage</strong><br><br>
    Similar to classic massage but adapted for athletes based on sport type and timing (before or after performance).<br><br>
    Differs in rhythm and intensity. Enhances conditioning and speeds up recovery after exertion.<br><br>
    Also helps with mental readiness and stress relief before competitions.
    `,
            sk: `
    <strong style="font-size: 30px;">Športová masáž</strong><br><br>
    Podobná klasickej masáži, ale prispôsobená športovcom podľa druhu športu a načasovania (pred alebo po výkone).<br><br>
    Líši sa rytmom a intenzitou hmatov. Zvyšuje kondíciu a pomáha po fyzickej záťaži.<br><br>
    Pôsobí aj na psychiku – uvoľňuje stres a zvyšuje výkonnosť.
    `
        },

        4: {
            en: `
    <strong style="font-size: 30px;">Cupping Therapy</strong><br><br>
    Glass cups with heated air are applied to the skin. Cooling air creates suction, drawing the skin and underlying tissue into the cup.<br><br>
    Improves circulation and oxygenation of critical points. Toxins are removed from the body.<br><br>
    Temporary painless marks may remain but disappear within a few days.<br><br>
    <img style="width: 60%; max-width: 300px;" src="/static/images/cupping.png">
    `,
            sk: `
    <strong style="font-size: 30px;">Bankovanie</strong><br><br>
    Sklenené banky s nahriatym vzduchom sa prisajú na kožu a vytvárajú podtlak, ktorý vtiahne pokožku a podkožie do banky.<br><br>
    Prekrvuje a okysličuje dôležité miesta, pomáha odplavovať škodliviny.<br><br>
    Zostávajú dočasné bezbolestné stopy, ktoré zmiznú za pár dní.<br><br>
    <img style="width: 60%; max-width: 300px;" src="/static/images/cupping.png">
    `
        },

        5: {
            en: `
    <strong style="font-size: 30px;">Hot Stone Therapy</strong><br><br>
    Basalt stones retain and release heat, benefiting skin, muscles, and circulation.<br><br>
    Stimulates lymphatic system, boosts metabolism, and detoxifies.<br><br>
    Also has mental benefits: reduces stress and promotes emotional balance and harmony with nature.
    `,
            sk: `
    <strong style="font-size: 30px;">Lávové kamene</strong><br><br>
    Čadičové kamene absorbujú a odovzdávajú teplo – pozitívne ovplyvňujú pokožku, svaly a krvný obeh.<br><br>
    Stimulujú lymfu, detoxikujú telo a urýchľujú metabolizmus.<br><br>
    Pôsobia antistresovo a harmonizujú telo aj myseľ.
    `
        },

    6: {
        en: `
    <strong style="font-size: 30px;">IASTM Therapy</strong><br><br>
    Instrument-Assisted Soft Tissue Mobilization is a modern fascial therapy technique using tools to apply pressure and heat.<br><br>
    This stimulates fascia and supports healthy soft tissue function.<br><br>
    <img style="width: 60%; max-width: 300px;" src="/static/images/iastm.png">
    `,
        sk: `
    <strong style="font-size: 30px;">IASTM terapia</strong><br><br>
    Moderná terapia fascií pomocou nástrojov, ktoré vytvárajú tlak a teplo vo fasciách.<br><br>
    Stimuluje správne fungovanie mäkkých tkanív.<br><br>
    <img style="width: 60%; max-width: 300px;" src="/static/images/iastm.png">
    `
    },

    7: {
        en: `
    <strong style="font-size: 30px;">RKT Therapy</strong><br><br>
    RKT (Rehabilitation Complex Techniques) originated from physiotherapeutic and rehabilitation methods developed in the former USSR.<br><br>
    It combines manual techniques, mobilizations, tractions, and specific exercises into one comprehensive system.<br><br>
    <strong>Goal:</strong><br>
    • release of spinal and joint blockages,<br>
    • restore proper mobility,<br>
    • eliminate muscle spasms,<br>
    • improve neuromuscular coordination.<br><br>
    <strong>Used for:</strong> back pain, scoliosis, post-injury recovery, and functional musculoskeletal disorders.<br><br>
    <strong>Advantages:</strong><br>
    • faster pain relief,<br>
    • combines relaxation and strengthening,<br>
    • acts simultaneously on muscles, joints, and the nervous system.<br><br>
    <strong>Disadvantages:</strong><br>
    • not suitable for acute inflammation or recent injuries.<br><br>
    👉 <em>In short:</em> RKT = combination of manual therapy + exercise + mobilization → a comprehensive approach to the spine and musculoskeletal system.<br><br>
    `,
        sk: `
    <strong style="font-size: 30px;">RKT terapia</strong><br><br>
    RKT (Rehabilitačné komplexné techniky) pochádzajú z fyzioterapeutických a rehabilitačných metód vyvinutých v bývalom ZSSR.<br><br>
    Spájajú manuálne techniky, mobilizácie, trakcie a špecifické cvičenia do jedného celku.<br><br>
    <strong>Cieľ:</strong><br>
    • uvoľnenie blokád chrbtice a kĺbov,<br>
    • obnovenie správnej pohyblivosti,<br>
    • odstránenie svalových spazmov,<br>
    • zlepšenie nervosvalovej koordinácie.<br><br>
    <strong>Použitie:</strong> pri bolestiach chrbta, skolióze, po úrazoch a pri funkčných poruchách pohybového aparátu.<br><br>
    <strong>Výhody:</strong><br>
    • rýchlejšia úľava od bolesti,<br>
    • kombinuje uvoľnenie aj posilnenie,<br>
    • pôsobí na svaly, kĺby aj nervový systém naraz.<br><br>
    <strong>Nevýhody:</strong><br>
    • nie je vhodná pri akútnych zápaloch alebo čerstvých úrazoch.<br><br>
    👉 <em>V skratke:</em> RKT = kombinácia manuálnej terapie + cvičenia + mobilizácie → komplexný prístup k chrbtici a pohybovému aparátu.<br><br>
    `
    },

    8: {
    en: `
        <strong style="font-size: 30px;">SM System (Spiral Spinal Stabilization)</strong><br><br>
        The SM System was developed by <strong>MUDr. Richard Smíšek</strong>, a Czech physician.<br><br>
        The method is based on the <em>natural walking pattern</em> and focuses on activating spiral muscle chains that relieve pressure from the spine.<br><br>
        <strong>Goal:</strong><br>
        • improve posture and spinal stability,<br>
        • eliminate back pain,<br>
        • prevent intervertebral disc damage.<br><br>
        <strong>How it’s practiced:</strong> dynamic exercises using a rope or elastic band, always performed while standing or in motion.<br><br>
        <strong>Effects:</strong><br>
        • relaxation of shortened muscles,<br>
        • strengthening of weakened muscles,<br>
        • prevention and treatment of disc problems, scoliosis, back, shoulder, and knee issues.<br><br>
        <strong>Advantages:</strong><br>
        • suitable for rehabilitation and athletes alike,<br>
        • simple to learn,<br>
        • short daily sessions (about 10–15 minutes).<br><br>
        `,
            sk: `
        <strong style="font-size: 30px;">SM systém (Spirálna stabilizácia chrbtice)</strong><br><br>
        Autorom metódy je <strong>MUDr. Richard Smíšek</strong> (český lekár).<br><br>
        Metóda je založená na <em>prirodzenom stereotype chôdze</em> a aktivácii špirálových svalových reťazcov, ktoré odľahčujú chrbticu.<br><br>
        <strong>Cieľ:</strong><br>
        • zlepšiť držanie tela a stabilitu,<br>
        • odstrániť bolesti chrbta,<br>
        • predchádzať poškodeniu medzistavcových platničiek.<br><br>
        <strong>Ako sa cvičí:</strong> dynamické cviky s lanom alebo gumičkou, vždy v stoji alebo v pohybe.<br><br>
        <strong>Účinky:</strong><br>
        • uvoľnenie skrátených svalov,<br>
        • posilnenie oslabených svalov,<br>
        • prevencia a liečba problémov s platničkami, skoliózou, chrbtom, ramenami a kolenami.<br><br>
        <strong>Výhody:</strong><br>
        • vhodné pre rehabilitáciu aj športovcov,<br>
        • jednoduché na naučenie,<br>
        • cvičí sa krátko (cca 10–15 minút denne).<br><br>
        `
    }
  };

    Swal.fire({
        title: '',
        html: `<div style="white-space: wrap; text-align: center; width: 100%;">${texts[index][isEnglish ? 'en' : 'sk']}</div>`,
        confirmButtonText: isEnglish ? 'Close' : 'Zavrieť',
        confirmButtonColor: '#3085d6',
        width: '80%',
    });
}

function smoothScroll(targetId, { offset = 170, duration = 600, easing = "easeOutQuad" } = {}) {
  const targetEl = document.getElementById(targetId);
  if (!targetEl) return;

  const startY = window.pageYOffset;
  const targetY = startY + targetEl.getBoundingClientRect().top - offset;
  const distance = targetY - startY;

  // Easing functions with t in [0,1]
  const easers = {
    linear: t => t,
    easeOutQuad: t => t * (2 - t),
    easeOutCubic: t => 1 - Math.pow(1 - t, 3),
    easeOutQuart: t => 1 - Math.pow(1 - t, 4),
  };

  const ease = easers[easing] || easers.easeOutQuad;

  let startTime = null;

  function tick(now) {
    if (startTime === null) startTime = now;
    const elapsed = now - startTime;
    const t = Math.min(1, elapsed / duration);        // clamp 0..1
    const y = startY + distance * ease(t);

    window.scrollTo(0, y);

    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      // snap to exact target to avoid any sub-pixel off-by-one
      window.scrollTo(0, targetY);
    }
  }

  requestAnimationFrame(tick);
}

function scrollToTop() {
  const startPosition = window.pageYOffset;
  const distance = -startPosition;
  const duration = 1000;
  let start = null;

  function animation(currentTime) {
    if (start === null) {
      start = currentTime;
    }
    const timeElapsed = currentTime - start;
    const run = ease(timeElapsed, startPosition, distance, duration);
    window.scrollTo(0, run);
    if (timeElapsed < duration) {
      requestAnimationFrame(animation);
    }
  }

  // Easing function for smooth scrolling
  function ease(t, b, c, d) {
    t /= d / 2;
    if (t < 1) return c / 2 * t * t + b;
    t--;
    return -c / 2 * (t * (t - 2) - 1) + b;
  }

  requestAnimationFrame(animation);
}

var modal = document.getElementById("myModal");
var img = document.getElementById("img01");
var modalImg = document.getElementById("img01");

document.getElementsByClassName("close")[0].onclick = function() {
    modal.style.display = "none";
}

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

function openBiggerImage(photoSrc) {
    modal.style.display = "block";
    modalImg.src = photoSrc;
}

function addReview() {
    const isEng = isEnglish;

    // Translation map
    const t = {
        title: isEng ? `Add a Review` : `Pridať hodnotenie`,
        namePlaceholder: isEng ? "Your Full Name" : "Vaše meno a priezvisko",
        msgPlaceholder: isEng ? "Your review" : "Vaše hodnotenie",
        workerLabel: isEng ? "Choose Massage Therapist" : "Vyberte maséra",
        validationError: isEng
            ? "All fields are required, and rating must be selected."
            : "Všetky polia sú povinné a je potrebné zvoliť hodnotenie.",
        workerValidationError: isEng
            ? "Please select a massage therapist."
            : "Prosím, vyberte maséra.",
        confirmText: isEng ? "Submit" : "Odoslať",
        successTitle: isEng ? "Success" : "Hotovo",
        successMsg: isEng ? "Review submitted!" : "Hodnotenie odoslané!",
        errorTitle: isEng ? "Error" : "Chyba",
        errorMsg: isEng ? "Failed to submit review" : "Nepodarilo sa odoslať hodnotenie",
        networkError: isEng ? "Network error occurred" : "Došlo k chybe siete",
    };

    Swal.fire({
        title: t.title,
        customClass: {
            popup: 'my-swal'
        },
        html: `
            <div style="display: flex; flex-direction: column; align-items: center; padding: 20px;">
                <div style="width: 90%; max-width: 500px; margin-bottom: 15px; text-align: center;">
                    <label style="font-weight: 600; margin-bottom: 5px; display: block;">${t.workerLabel}:</label>
                    <div style="display: flex; gap: 20px; justify-content: center;">
                        <label style="cursor: pointer; font-size: 20px;">
                            <input type="radio" name="worker" value="roman" style="margin: 0 5px 0 0; cursor: pointer;">
                            Roman
                        </label>
                        <label style="cursor: pointer; font-size: 20px;">
                            <input type="radio" name="worker" value="evka" style="margin: 0 5px 0 0; cursor: pointer;">
                            Evka
                        </label>
                    </div>
                </div>

                <div style="width: 100%; max-width: 500px;">
                    <input id="nameInput" class="swal2-input" placeholder="${t.namePlaceholder}" 
                        style="margin-left: 0; margin-right: 0; width: 90%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div style="width: 100%; max-width: 500px; margin-bottom: 15px;">
                    <textarea id="messageInput" class="swal2-textarea" placeholder="${t.msgPlaceholder}" 
                            style="margin-left: 0; margin-right: 0; width: 90%; padding: 10px; resize: vertical; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; min-height: 100px;"></textarea>
                </div>

                <div id="starRating" style="margin-top: 1em; display: flex; justify-content: center; width: 80%; max-width: 500px;">
                    ${[1,2,3,4,5].map(i => `<i class="fa fa-star" id="star${i}" onclick="rateStars(${i})" style="font-size: 2em; cursor: pointer; color: gray; margin: 0 5px;"></i>`).join('')}
                </div>
            </div>
        `,
        preConfirm: () => {
            const name = document.getElementById('nameInput').value.trim();
            const message = document.getElementById('messageInput').value.trim();
            const stars = parseInt(document.getElementById('starRating').getAttribute('data-stars'));

            // Get selected worker radio value
            const workerRadio = document.querySelector('input[name="worker"]:checked');
            const worker = workerRadio ? workerRadio.value : null;

            if (!name || !message || !stars) {
                Swal.showValidationMessage(t.validationError);
                return false;
            }

            if (!worker) {
                Swal.showValidationMessage(t.workerValidationError);
                return false;
            }

            return { name, message, stars, worker };
        },
        showCancelButton: true,
        confirmButtonText: t.confirmText,
    }).then(result => {
        if (result.isConfirmed && result.value) {
            const { name, message, stars, worker } = result.value;
            fetch('/add_review/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify({
                    name_surname: name,
                    message: message,
                    stars: stars,
                    worker: worker
                })
            }).then(res => {
                if (res.ok) {
                    Swal.fire(t.successTitle, t.successMsg, 'success').then(() => {
                        location.reload();
                    });
                } else {
                    Swal.fire(t.errorTitle, t.errorMsg, 'error');
                }
            }).catch(() => {
                Swal.fire(t.errorTitle, t.networkError, 'error');
            });
        }
    });
}

function rateStars(count) {
    for (let i = 1; i <= 5; i++) {
        const star = document.getElementById(`star${i}`);
        star.style.color = i <= count ? 'gold' : 'gray';
    }
    document.getElementById('starRating').setAttribute('data-stars', count);
}

function deleteReview(id) {
    Swal.fire({
        title: "Naozaj vymazať hodnotenie?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Vymazať",
        cancelButtonText: "Zrušiť",
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
    }).then(result => {
        if (result.isConfirmed) {
            fetch(`/delete_review/${id}/`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                }
            }).then(async res => {
                if (res.ok) {
                    Swal.fire('Vymazané', '', 'success').then(() => {
                        location.reload();
                    });
                } else {
                    const errorData = await res.json();
                    Swal.fire('Chyba', errorData.message || 'Nepodarilo sa vymazať.', 'error');
                }
            }).catch(() => {
                Swal.fire('Chyba', 'Nastala chyba pri spájaní so serverom.', 'error');
            });
        }
    });
}
