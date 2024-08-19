let worker = null;
let duration = null;
let timeSlot = null;

function moveToBottom() {
    setTimeout(() => {
        window.scrollTo({
            top: document.body.scrollHeight,
            behavior: 'smooth'
        });
    }, 50);
}

document.addEventListener('DOMContentLoaded', function() {
    const bigButtons = document.querySelectorAll('.option-button-person');
    bigButtons.forEach(button => {
        button.addEventListener('click', function() {
            bigButtons.forEach(btn => btn.classList.remove('selected'));
            this.classList.add('selected');
            worker = this.id;

            var hiddenElements = document.querySelectorAll('.hidden-element-first');
            hiddenElements.forEach(element => {
                element.classList.remove('hidden-element-first');
            });
            moveToBottom();
        });
    });

    const optionButtons = document.querySelectorAll('.option-button-time');
    optionButtons.forEach(button => {
        button.addEventListener('click', function() {
            optionButtons.forEach(btn => btn.classList.remove('selected'));
            this.classList.add('selected');
            duration = this.id;
            moveToBottom();
        });
    });
});

function pickDate() {
    var mainContainer = document.getElementById('time-slot-container');
    var selectedDate = document.getElementById('date');
    var finishButton = document.querySelector('.finish-truck-button')

    if (finishButton) {
      finishButton.remove();
    }

    mainContainer.innerHTML = '';
    selectedDate.style.border = '1px solid black';

    if (worker) {

        fetch('/check_available_slots/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({selectedDate: selectedDate.value, worker: worker}),
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                availableSlots = data.available_slots;
                let slotsHtml = '';

                availableSlots.forEach(slot => {
                    slotsHtml += `
                        <button
                            style="margin: 5px;"
                            class="big-button time-slot-select"
                            onclick="selectTimeSlot(this)"
                        >
                            ${slot}
                        </button>`;
                });

                if (availableSlots.length !== 0) {
                    const fragment = document.createDocumentFragment();
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(slotsHtml, 'text/html');
                    const slots = Array.from(doc.querySelectorAll('button'));

                    slots.forEach(slot => fragment.appendChild(slot));
                    mainContainer.appendChild(fragment);
                } else {
                    var textForApending = document.createElement('p');
                    textForApending.textContent = isEnglish ? 'No free slots left for today': 'Na dnes už nie sú voľné sloty';
                    mainContainer.appendChild(textForApending);
                }

            } else {
                Swal.fire({
                    icon: 'error',
                    title: data.message,
                });
            }
        })
        .catch(error => {
            console.error('Error during fetch:', error);
        });
    } else {

    }

    moveToBottom();
}

function formatDate(date) {
  const dateObj = new Date(date); // Create a Date object
  const day = String(dateObj.getDate()).padStart(2, '0'); // Get day with padding
  const month = String(dateObj.getMonth() + 1).padStart(2, '0'); // Get month with padding (starts at 0)
  const year = dateObj.getFullYear();
  return `${day}.${month}.${year}`; // Return formatted date
}

function selectTimeSlot(button) {
    var mainContainer = document.getElementById('reservation-box-container');
    var previouslySelectedButton = document.getElementById('picked-time-slot');
    if (previouslySelectedButton) {
      previouslySelectedButton.removeAttribute('id');
      previouslySelectedButton.classList.remove('selected');
    }

    button.id = 'picked-time-slot';
    button.classList.add('selected');
    timeSlot = button.textContent.trim();

    var finishButton = document.querySelector('.finish-reservation-button');

    if (!finishButton) {
      finishButton = document.createElement('button');
      finishButton.textContent = isEnglish ? 'Create reservation' : 'Vytvoriť rezeráciu';
      finishButton.classList.add('finish-reservation-button');
      finishButton.classList.add('big-button');
      finishButton.onclick = createReservation;

      mainContainer.appendChild(finishButton);
    }

    var hiddenElements = document.querySelectorAll('.hidden-element-second');
    hiddenElements.forEach(element => {
        element.classList.remove('hidden-element-second');
    });

    moveToBottom();
}

function createReservation() {
    var selectedDate = document.getElementById('date').value;
    var nameSurname = document.getElementById('name_surname').value;
    var email = document.getElementById('email').value;
    var phone = document.getElementById('phone').value;
    var note = document.getElementById('note').value;

    if (!nameSurname || !email || !phone) {
        Swal.fire({
            icon: 'error',
            title: isEnglish ? `Please fill in all required fields` : `Vyplňte všetky povinné polia`,
        });
        return;
    }

    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        Swal.fire({
            icon: 'error',
            title: isEnglish ? `Invalid email address` : `Neplatná e-mailová adresa`,
        });
        return;
    }

    if (!duration) {
        Swal.fire({
            icon: 'error',
            title: isEnglish ? `Choose a duration please` : `Vyberte si ešte dĺžku trvania prosím`,
        });
        return;
    }

    fetch('/create_reservation/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({
            selectedDate: selectedDate,
            worker: worker,
            duration: duration,
            timeSlot: timeSlot,
            nameSurname: nameSurname,
            email: email,
            phone: phone,
            note: note
        }),
    });

    Swal.fire({
      icon: 'success',
      title: isEnglish ? `Reservation created` : `Rezervácia vytvorená`,
    })
    .then(() => {
        window.location.href = `/`;
    });
}

document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('calendar');
    var dateInput = document.getElementById('date');
    calendar = new FullCalendar.Calendar(calendarEl, {

        initialView: 'dayGridMonth',
        eventTimeFormat: {
            hour12: false,
            hour: 'numeric',
            minute: 'numeric'
        },
        firstDay: 1,
        dayHeaderFormat: { weekday: 'short' },
        locale: isEnglish ? 'en': 'sk',
        buttonText: {
          today: isEnglish ? 'Today': 'Dnes',
        },
        dateClick: function(info) {

          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const clickedDate = new Date(info.dateStr);

          if (clickedDate < today) {
            return;
          }

          var eventsOnDate = calendar.getEvents().filter(function(event) {
              var eventDate = new Date(event.start);
              return eventDate.toDateString() === clickedDate.toDateString();
          });

          if (eventsOnDate.length === 0) {
              return;
          }

          const formattedDate = info.dateStr;
          dateInput.value = formattedDate;
          pickDate();
        },

        eventClick: function(info) {

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const clickedDate = new Date(info.event.startStr);

            if (clickedDate < today || info.event.extendedProps.nonClickable) {
                return;
            }

            const formattedDate = info.event.startStr;
            dateInput.value = formattedDate;
            pickDate();
        },
        datesSet: function() {
            if (worker) {
                updateEvents(worker);
            }
        }
    });

    calendar.render();

    var nextButton = calendarEl.querySelector('.fc-next-button');
    var prevButton = calendarEl.querySelector('.fc-prev-button');

    if (nextButton) {
        nextButton.addEventListener('click', function() {
            if (worker) {
                setTimeout(function() {
                    updateEvents(worker);
                }, 100);
            }
        });
    }

    if (prevButton) {
        prevButton.addEventListener('click', function() {
            if (worker) {
                setTimeout(function() {
                    updateEvents(worker);
                }, 100);
            }
        });
    }
});

function updateEvents(worker) {
    $.ajax({
        url: '/check_available_slots_ahead/' + worker + '/',
        type: 'GET',
        dataType: 'json',
        success: function(response) {
            if (response.status === 'success') {
                calendar.getEvents().forEach(function(event) {
                    event.remove();
                });
                calendar.addEventSource(response.events);

                const allDays = document.querySelectorAll('.fc-day');
                allDays.forEach(function(dayElement) {
                    const dayDate = new Date(dayElement.dataset.date);
                    const eventsOnDay = calendar.getEvents().filter(function(event) {
                        const eventStartDate = new Date(event.start);
                        return eventStartDate.toDateString() === dayDate.toDateString();
                    });

                    if (eventsOnDay.length === 0) {
                        dayElement.classList.add('custom-day-class'); // Add class for days without events
                    } else {
                        dayElement.classList.remove('custom-day-class'); // Remove class if events exist
                    }
                });

            } else {
                console.error('Error fetching events:', response.error);
            }
        },
        error: function(xhr, status, error) {
            console.error('Error fetching events:', error);
        }
    });
}