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

function smoothScroll(targetId) {
    var target = document.getElementById(targetId);
    if (target) {
      var targetPosition = target.offsetTop - 170; // Get the target element's position with an additional 100px offset from the top
      var startPosition = window.pageYOffset; // Get current position
      var distance = targetPosition - startPosition;
      var duration = 1000; // Set the duration of the scroll in milliseconds
      let start = null;

      // Function to perform the scrolling animation
      function animation(currentTime) {
        if (start === null) {
          start = currentTime;
        }
        var timeElapsed = currentTime - start;
        var run = ease(timeElapsed, startPosition, distance, duration);
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
                            <input type="radio" name="worker" value="roman" style="margin-right: 5px; cursor: pointer;">
                            Roman
                        </label>
                        <label style="cursor: pointer; font-size: 20px;">
                            <input type="radio" name="worker" value="evka" style="margin-right: 5px; cursor: pointer;">
                            Evka
                        </label>
                    </div>
                </div>

                <div style="width: 100%; max-width: 500px;">
                    <input id="nameInput" class="swal2-input" placeholder="${t.namePlaceholder}" style="width: 90%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div style="width: 100%; max-width: 500px; margin-bottom: 15px;">
                    <textarea id="messageInput" class="swal2-textarea" placeholder="${t.msgPlaceholder}" style="width: 90%; padding: 10px; resize: vertical; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; min-height: 100px;"></textarea>
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
