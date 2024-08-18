function pickDate() {

    var mainContainer = document.getElementById('time-slot-container');
    var object_obj = document.getElementById('object');
    var ecv = document.getElementById('ecv');
    var selectedDate = document.getElementById('date');
    var finishButton = document.querySelector('.finish-truck-button');

    if (finishButton) {
      finishButton.remove();
    }

    mainContainer.innerHTML = '';
    selectedDate.style.border = '1px solid black';

    if (isValidDate(selectedDate.value)) {

        fetch('/check_available_slots/' + language_code + '/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({selectedDate: selectedDate.value, object_id: object_obj.value}),
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                availableSlots = data.available_slots;
                let slotsHtml = '';

                availableSlots.forEach(slot => {
                  var startTime = Object.keys(slot)[0];
                  var endTime = Object.values(slot)[0];
                  var availableCount = Object.values(slot)[1];
                  slotsHtml += `<button class="time-slot-select basic-button-style" onclick="selectTimeSlot(this)">${startTime} - ${endTime} (${availableCount})</button>`;
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
}

function formatDate(date) {
  const dateObj = new Date(date); // Create a Date object
  const day = String(dateObj.getDate()).padStart(2, '0'); // Get day with padding
  const month = String(dateObj.getMonth() + 1).padStart(2, '0'); // Get month with padding (starts at 0)
  const year = dateObj.getFullYear();
  return `${day}.${month}.${year}`; // Return formatted date
}

function isValidDate(dateString) {
  const dateObj = new Date(dateString);

  if (isNaN(dateObj.getTime()) || dateObj.toString() === "Invalid Date") {
    return false;
  }

  dateObj.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return dateObj.getTime() >= today.getTime();
}

function selectTimeSlot(button) {
    var mainContainer = document.getElementById('add-truck-main-container');
    var previouslySelectedButton = document.getElementById('picked-time-slot');
    if (previouslySelectedButton) {
      previouslySelectedButton.removeAttribute('id');
    }

    button.id = 'picked-time-slot';
    var finishButton = document.querySelector('.finish-truck-button');

    if (!finishButton) {
      finishButton = document.createElement('button');
      finishButton.textContent = isEnglish ? 'Create Truck' : 'Vytvoriť vozidlo';
      finishButton.classList.add('finish-truck-button');
      finishButton.classList.add('basic-button-style');
      finishButton.onclick = createTruckOnClick;

      mainContainer.appendChild(finishButton);
    }
}

function createTruckOnClick() {

    var objectObj = document.getElementById('object');
    var ecv = document.getElementById('ecv');
    var selectedDate = document.getElementById('date');
    var pickedTimeSlot = document.getElementById('picked-time-slot');

    console.log(pickedTimeSlot.value);

    objectObj.style.border = '';
    ecv.style.border = '';
    selectedDate.style.border = '';

    if (!objectObj.value) {
        objectObj.style.border = '2px solid red';
        console.log('fill object');
        return;
    } else if (!ecv.value) {
        ecv.style.border = '2px solid red';
        console.log('fill ecv');
        return;
    } else if (!selectedDate.value) {
        selectedDate.style.border = '2px solid red';
        console.log('fill date');
        return;
    }

    if (isValidDate(selectedDate.value)) {
        fetch('/create_truck/' + language_code + '/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({selectedDate: selectedDate.value, object_id: objectObj.value, ecv: ecv.value, time_slot: pickedTimeSlot.textContent}),
        });

        Swal.fire({
          icon: 'success',
          title: isEnglish ? `Truck created` : `Vozidlo vytvorené`,
        })
        .then(() => {
            window.location.href = `/${language_code}/`;
        });
    } else {
        Swal.fire({
          icon: 'error',
          title: isEnglish ? `Can not pick Date in past` : `Nedá sa vybrať dátum v minulosti`,
        });
        selectedDate.style.border = '2px solid red';
    }
}


document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('calendar-add-truck');
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
    });

    calendar.render();

        // Get the navigation buttons
    var nextButton = calendarEl.querySelector('.fc-next-button');
    var prevButton = calendarEl.querySelector('.fc-prev-button');

    // Add click event listeners to the navigation buttons
    nextButton.addEventListener('click', function() {
        // Call your function for next month arrow clicked
        updateEvents(obj_id);
    });

    prevButton.addEventListener('click', function() {
        // Call your function for previous month arrow clicked
        updateEvents(obj_id);
    });
});

function updateEvents(obj_id) {
    $.ajax({
        url: '/check_available_slots_ahead/' + language_code + '/',
        type: 'GET',
        dataType: 'json',
        data: {
            obj_id: obj_id
        },
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