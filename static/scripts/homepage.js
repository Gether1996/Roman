function showTechnique(index) {
    const texts = {
        1: {
            en: `
                <strong>Classic Massage</strong>
                <p style="margin-top: 1.5rem; font-size: 1.05rem;">
                    Stimulates blood and lymph circulation, improves oxygenation and detoxification.
                </p>
                <p style="margin-top: 1rem; font-size: 1.05rem;">
                    Enhances skin, subcutaneous tissue, and muscle perfusion. Relieves stiffness and tension, 
                    and helps emotionally and physically.
                </p>
                <p style="margin-top: 1rem; font-size: 1.05rem; font-weight: 600; color: #0080ff;">
                    Suitable for almost everyone – stress relief, pain removal, or regeneration.
                </p>
            `,
            sk: `
                <strong>Klasická masáž</strong>
                <p style="margin-top: 1.5rem; font-size: 1.05rem;">
                    Aktivuje krvný a lymfatický obeh, zlepšuje okysličenie a odvod škodlivín z tela.
                </p>
                <p style="margin-top: 1rem; font-size: 1.05rem;">
                    Zlepšuje prekrvenie pokožky a svalov, uvoľňuje stuhnuté svaly a uvoľňuje telo aj myseľ.
                </p>
                <p style="margin-top: 1rem; font-size: 1.05rem; font-weight: 600; color: #0080ff;">
                    Vhodná takmer pre každého – na uvoľnenie stresu, odstránenie bolesti alebo regeneráciu.
                </p>
            `
        },

        2: {
            en: `
                <strong>Soft Tissue & Myofascial Techniques</strong>
                <p style="margin-top: 1.5rem; font-size: 1.05rem;">
                    Primarily target soft tissue (muscles). Compared to classic massage, these may be slightly 
                    more painful and are performed without oil.
                </p>
                <p style="margin-top: 1rem; font-size: 1.05rem;">
                    Treatment starts seated at the neck and proceeds downward to the tailbone while lying down.
                </p>
                <p style="margin-top: 1rem; font-size: 1.05rem; font-weight: 600; color: #0080ff;">
                    An excellent complement to sport or classic massages; helps prevent stiffness and releases tension.
                </p>
            `,
            sk: `
                <strong>Mäkké a myofasciálne techniky</strong>
                <p style="margin-top: 1.5rem; font-size: 1.05rem;">
                    Zamerané najmä na mäkké tkanivá – svaly. V porovnaní s klasickou masážou môžu byť 
                    mierne bolestivejšie a vykonávajú sa bez oleja.
                </p>
                <p style="margin-top: 1rem; font-size: 1.05rem;">
                    Začína sa v sede uvoľnením krčnej chrbtice, potom sa pokračuje v ľahu až ku kostrči.
                </p>
                <p style="margin-top: 1rem; font-size: 1.05rem; font-weight: 600; color: #0080ff;">
                    Výborný doplnok ku klasickej alebo športovej masáži. Zastavuje stuhnutie a uvoľňuje napätie.
                </p>
            `
        },

        3: {
            en: `
                <strong>Sports Massage</strong>
                <p style="margin-top: 1.5rem; font-size: 1.05rem;">
                    Similar to classic massage but adapted for athletes based on sport type and timing 
                    (before or after performance).
                </p>
                <p style="margin-top: 1rem; font-size: 1.05rem;">
                    Differs in rhythm and intensity. Enhances conditioning and speeds up recovery after exertion.
                </p>
                <p style="margin-top: 1rem; font-size: 1.05rem; font-weight: 600; color: #0080ff;">
                    Also helps with mental readiness and stress relief before competitions.
                </p>
            `,
            sk: `
                <strong>Športová masáž</strong>
                <p style="margin-top: 1.5rem; font-size: 1.05rem;">
                    Podobná klasickej masáži, ale prispôsobená športovcom podľa druhu športu a načasovania 
                    (pred alebo po výkone).
                </p>
                <p style="margin-top: 1rem; font-size: 1.05rem;">
                    Líši sa rytmom a intenzitou hmatov. Zvyšuje kondíciu a pomáha po fyzickej záťaži.
                </p>
                <p style="margin-top: 1rem; font-size: 1.05rem; font-weight: 600; color: #0080ff;">
                    Pôsobí aj na psychiku – uvoľňuje stres a zvyšuje výkonnosť.
                </p>
            `
        },

        4: {
            en: `
                <strong>Cupping Therapy</strong>
                <p style="margin-top: 1.5rem; font-size: 1.05rem;">
                    Glass cups with heated air are applied to the skin. Cooling air creates suction, 
                    drawing the skin and underlying tissue into the cup.
                </p>
                <p style="margin-top: 1rem; font-size: 1.05rem;">
                    Improves circulation and oxygenation of critical points. Toxins are removed from the body.
                </p>
                <p style="margin-top: 1rem; font-size: 1.05rem; font-weight: 600; color: #0080ff;">
                    Temporary painless marks may remain but disappear within a few days.
                </p>
                <img style="width: 70%; max-width: 350px; margin-top: 1.5rem; border-radius: 12px;" 
                     src="/static/images/cupping.png" alt="Cupping Therapy">
            `,
            sk: `
                <strong>Bankovanie</strong>
                <p style="margin-top: 1.5rem; font-size: 1.05rem;">
                    Sklenené banky s nahriatym vzduchom sa prisajú na kožu a vytvárajú podtlak, 
                    ktorý vtiahne pokožku a podkožie do banky.
                </p>
                <p style="margin-top: 1rem; font-size: 1.05rem;">
                    Prekrvuje a okysličuje dôležité miesta, pomáha odplavovať škodliviny.
                </p>
                <p style="margin-top: 1rem; font-size: 1.05rem; font-weight: 600; color: #0080ff;">
                    Zostávajú dočasné bezbolestné stopy, ktoré zmiznú za pár dní.
                </p>
                <img style="width: 70%; max-width: 350px; margin-top: 1.5rem; border-radius: 12px;" 
                     src="/static/images/cupping.png" alt="Bankovanie">
            `
        },

        5: {
            en: `
                <strong>Hot Stone Therapy</strong>
                <p style="margin-top: 1.5rem; font-size: 1.05rem;">
                    Basalt stones retain and release heat, benefiting skin, muscles, and circulation.
                </p>
                <p style="margin-top: 1rem; font-size: 1.05rem;">
                    Stimulates lymphatic system, boosts metabolism, and detoxifies.
                </p>
                <p style="margin-top: 1rem; font-size: 1.05rem; font-weight: 600; color: #0080ff;">
                    Also has mental benefits: reduces stress and promotes emotional balance and harmony with nature.
                </p>
            `,
            sk: `
                <strong>Lávové kamene</strong>
                <p style="margin-top: 1.5rem; font-size: 1.05rem;">
                    Čadičové kamene absorbujú a odovzdávajú teplo – pozitívne ovplyvňujú pokožku, 
                    svaly a krvný obeh.
                </p>
                <p style="margin-top: 1rem; font-size: 1.05rem;">
                    Stimulujú lymfu, detoxikujú telo a urýchľujú metabolizmus.
                </p>
                <p style="margin-top: 1rem; font-size: 1.05rem; font-weight: 600; color: #0080ff;">
                    Pôsobia antistresovo a harmonizujú telo aj myseľ.
                </p>
            `
        },

        6: {
            en: `
                <strong>IASTM Therapy</strong>
                <p style="margin-top: 1.5rem; font-size: 1.05rem;">
                    Instrument-Assisted Soft Tissue Mobilization is a modern fascial therapy technique 
                    using tools to apply pressure and heat.
                </p>
                <p style="margin-top: 1rem; font-size: 1.05rem; font-weight: 600; color: #0080ff;">
                    This stimulates fascia and supports healthy soft tissue function.
                </p>
                <img style="width: 70%; max-width: 350px; margin-top: 1.5rem; border-radius: 12px;" 
                     src="/static/images/iastm.png" alt="IASTM Therapy">
            `,
            sk: `
                <strong>IASTM terapia</strong>
                <p style="margin-top: 1.5rem; font-size: 1.05rem;">
                    Moderná terapia fascií pomocou nástrojov, ktoré vytvárajú tlak a teplo vo fasciách.
                </p>
                <p style="margin-top: 1rem; font-size: 1.05rem; font-weight: 600; color: #0080ff;">
                    Stimuluje správne fungovanie mäkkých tkanív.
                </p>
                <img style="width: 70%; max-width: 350px; margin-top: 1.5rem; border-radius: 12px;" 
                     src="/static/images/iastm.png" alt="IASTM terapia">
            `
        },

        7: {
            en: `
                <strong>RKT Therapy</strong>
                <p style="margin-top: 1.5rem; font-size: 1.05rem;">
                    RKT (Rehabilitation Complex Techniques) originated from physiotherapeutic and rehabilitation 
                    methods developed in the former USSR.
                </p>
                <p style="margin-top: 1rem; font-size: 1.05rem;">
                    It combines manual techniques, mobilizations, tractions, and specific exercises 
                    into one comprehensive system.
                </p>
                <div style="margin-top: 1.5rem; text-align: left; max-width: 600px; margin-left: auto; margin-right: auto;">
                    <p style="font-weight: 700; color: #2c3e50; margin-bottom: 0.5rem;">Goal:</p>
                    <ul style="list-style: none; padding-left: 1rem; margin-bottom: 1rem;">
                        <li style="margin-bottom: 0.3rem;">• Release of spinal and joint blockages</li>
                        <li style="margin-bottom: 0.3rem;">• Restore proper mobility</li>
                        <li style="margin-bottom: 0.3rem;">• Eliminate muscle spasms</li>
                        <li style="margin-bottom: 0.3rem;">• Improve neuromuscular coordination</li>
                    </ul>
                    <p style="font-weight: 700; color: #2c3e50; margin-bottom: 0.5rem; margin-top: 1rem;">Used for:</p>
                    <p style="margin-bottom: 1rem;">Back pain, scoliosis, post-injury recovery, and functional musculoskeletal disorders</p>
                    <p style="font-weight: 700; color: #2c3e50; margin-bottom: 0.5rem; margin-top: 1rem;">Advantages:</p>
                    <ul style="list-style: none; padding-left: 1rem; margin-bottom: 1rem;">
                        <li style="margin-bottom: 0.3rem;">• Faster pain relief</li>
                        <li style="margin-bottom: 0.3rem;">• Combines relaxation and strengthening</li>
                        <li style="margin-bottom: 0.3rem;">• Acts simultaneously on muscles, joints, and the nervous system</li>
                    </ul>
                </div>
                <p style="margin-top: 1rem; font-size: 1.05rem; font-weight: 600; color: #0080ff;">
                    💡 In short: RKT = manual therapy + exercise + mobilization → comprehensive approach to spine health
                </p>
            `,
            sk: `
                <strong>RKT terapia</strong>
                <p style="margin-top: 1.5rem; font-size: 1.05rem;">
                    RKT (Rehabilitačné komplexné techniky) pochádzajú z fyzioterapeutických a rehabilitačných 
                    metód vyvinutých v bývalom ZSSR.
                </p>
                <p style="margin-top: 1rem; font-size: 1.05rem;">
                    Spájajú manuálne techniky, mobilizácie, trakcie a špecifické cvičenia do jedného celku.
                </p>
                <div style="margin-top: 1.5rem; text-align: left; max-width: 600px; margin-left: auto; margin-right: auto;">
                    <p style="font-weight: 700; color: #2c3e50; margin-bottom: 0.5rem;">Cieľ:</p>
                    <ul style="list-style: none; padding-left: 1rem; margin-bottom: 1rem;">
                        <li style="margin-bottom: 0.3rem;">• Uvoľnenie blokád chrbtice a kĺbov</li>
                        <li style="margin-bottom: 0.3rem;">• Obnovenie správnej pohyblivosti</li>
                        <li style="margin-bottom: 0.3rem;">• Odstránenie svalových spazmov</li>
                        <li style="margin-bottom: 0.3rem;">• Zlepšenie nervosvalovej koordinácie</li>
                    </ul>
                    <p style="font-weight: 700; color: #2c3e50; margin-bottom: 0.5rem; margin-top: 1rem;">Použitie:</p>
                    <p style="margin-bottom: 1rem;">Pri bolestiach chrbta, skolióze, po úrazoch a pri funkčných poruchách pohybového aparátu</p>
                    <p style="font-weight: 700; color: #2c3e50; margin-bottom: 0.5rem; margin-top: 1rem;">Výhody:</p>
                    <ul style="list-style: none; padding-left: 1rem; margin-bottom: 1rem;">
                        <li style="margin-bottom: 0.3rem;">• Rýchlejšia úľava od bolesti</li>
                        <li style="margin-bottom: 0.3rem;">• Kombinuje uvoľnenie aj posilnenie</li>
                        <li style="margin-bottom: 0.3rem;">• Pôsobí na svaly, kĺby aj nervový systém naraz</li>
                    </ul>
                </div>
                <p style="margin-top: 1rem; font-size: 1.05rem; font-weight: 600; color: #0080ff;">
                    💡 V skratke: RKT = manuálna terapia + cvičenie + mobilizácia → komplexný prístup k chrbtici
                </p>
            `
        },

        8: {
            en: `
                <strong>SM System (Spiral Spinal Stabilization)</strong><br><br>
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
                <strong>SM systém (Spirálna stabilizácia chrbtice)</strong>
                <p style="margin-top: 1.5rem; font-size: 1.05rem;">
                    Autorom metódy je <span style="font-weight: 600;">MUDr. Richard Smíšek</span> (český lekár).
                </p>
        Metóda je založená na <em>prirodzenom stereotype chôdze</em> a aktivácii špirálových svalových reťazcov, ktoré odľahčujú chrbticu.<br><br>
        <strong>Cieľ:</strong><br>
        • zlepšiť držanie tela a stabilitu,<br>
        • odstrániť bolesti chrbta,<br>
        • predchádzať poškodeniu medzistavcových platničiek.<br><br>
                <p style="margin-top: 1rem; font-size: 1.05rem;">
                    Metóda je založená na <em>prirodzenom stereotype chôdze</em> a aktivácii špirálových 
                    svalových reťazcov, ktoré odľahčujú chrbticu.
                </p>
                <div style="margin-top: 1.5rem; text-align: left; max-width: 600px; margin-left: auto; margin-right: auto;">
                    <p style="font-weight: 700; color: #2c3e50; margin-bottom: 0.5rem;">Cieľ:</p>
                    <ul style="list-style: none; padding-left: 1rem; margin-bottom: 1rem;">
                        <li style="margin-bottom: 0.3rem;">• Zlepšiť držanie tela a stabilitu</li>
                        <li style="margin-bottom: 0.3rem;">• Odstrániť bolesti chrbta</li>
                        <li style="margin-bottom: 0.3rem;">• Predchádzať poškodeniu medzistavcových platničiek</li>
                    </ul>
                    <p style="font-weight: 700; color: #2c3e50; margin-bottom: 0.5rem; margin-top: 1rem;">Ako sa cvičí:</p>
                    <p style="margin-bottom: 1rem;">Dynamické cviky s lanom alebo gumičkou, vždy v stoji alebo v pohybe</p>
                    <p style="font-weight: 700; color: #2c3e50; margin-bottom: 0.5rem; margin-top: 1rem;">Výhody:</p>
                    <ul style="list-style: none; padding-left: 1rem;">
                        <li style="margin-bottom: 0.3rem;">• Vhodné pre rehabilitáciu aj športovcov</li>
                        <li style="margin-bottom: 0.3rem;">• Jednoduché na naučenie</li>
                        <li style="margin-bottom: 0.3rem;">• Cvičí sa krátko (cca 10–15 minút denne)</li>
                    </ul>
                </div>
            `
        }
    };

    Swal.fire({
        title: '',
        html: `
            <div style="
                background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
                border-radius: 16px;
                padding: 2.5rem;
                text-align: center;
                line-height: 1.8;
                color: #2c3e50;
                box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            ">
                ${texts[index][isEnglish ? 'en' : 'sk']}
            </div>
        `,
        confirmButtonText: `<i class="fa-solid fa-circle-check me-2"></i>${isEnglish ? 'Close' : 'Zavrieť'}`,
        confirmButtonColor: '#0080ff',
        width: '90%',
        maxWidth: '800px',
        customClass: {
            popup: 'technique-modal',
            confirmButton: 'btn-modal-confirm',
            htmlContainer: 'modal-content-wrapper'
        },
        backdrop: `
            rgba(0,0,0,0.6)
            left top
            no-repeat
        `,
        showClass: {
            popup: 'swal2-show',
            backdrop: 'swal2-backdrop-show'
        },
        hideClass: {
            popup: 'swal2-hide',
            backdrop: 'swal2-backdrop-hide'
        }
    });
}

function smoothScroll(targetId, { offset = 100, duration = 600, easing = "easeOutQuad" } = {}) {
  const targetEl = document.getElementById(targetId);
  if (!targetEl) {
    console.warn(`Element with id "${targetId}" not found`);
    return;
  }

  const startY = window.scrollY || window.pageYOffset;
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

    window.scrollTo({
      top: y,
      behavior: 'instant'
    });

    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      // snap to exact target to avoid any sub-pixel off-by-one
      window.scrollTo({
        top: targetY,
        behavior: 'instant'
      });
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
