let worker = null;
let duration = null;
let timeSlot = null;

function moveToBottom() {
    setTimeout(() => {
        window.scrollTo({
            top: document.body.scrollHeight,
            behavior: 'smooth'
        });
    }, 250);
}

function resetDateInput() {
    var dateInput = document.getElementById("date");
    if (dateInput) {
        if (dateInput.value) {
            dateInput.value = "";
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const bigButtons = document.querySelectorAll('.option-button-person');
    bigButtons.forEach(button => {
        button.addEventListener('click', function() {
            allSelectedElements = document.querySelectorAll('.selected');
            allSelectedElements.forEach(btn => btn.classList.remove('selected'));
            this.classList.add('selected');
            worker = this.id;

            hiddenTimeSlotAll = document.querySelectorAll('.add-hidden-timeSlots');
            hiddenSlotsSecondAll = document.querySelectorAll('.add-hidden-second');
            hiddenSlotsThirdAll = document.querySelectorAll('.add-hidden-third');
            hiddenTimeSlotAll.forEach(element => {
                if (!element.classList.contains('hidden-element-timeSlots')) {
                    element.classList.add('hidden-element-timeSlots');
                }
            });
            hiddenSlotsSecondAll.forEach(element => {
                if (!element.classList.contains('hidden-element-second')) {
                    element.classList.add('hidden-element-second');
                }
            });
            hiddenSlotsThirdAll.forEach(element => {
                if (!element.classList.contains('hidden-element-third')) {
                    element.classList.add('hidden-element-third');
                }
            });

            var hiddenElements = document.querySelectorAll('.hidden-element-first');
            hiddenElements.forEach(element => {
                element.classList.remove('hidden-element-first');
            });
            resetDateInput();
        });
    });

    const optionButtons = document.querySelectorAll('.option-button-time');
    optionButtons.forEach(button => {
        button.addEventListener('click', function() {
            optionButtons.forEach(btn => btn.classList.remove('selected'));
            this.classList.add('selected');
            duration = this.id;

            var mainContainer = document.getElementById('reservation-box-container');
            var finishButton = document.querySelector('.finish-reservation-button');

            if (superUser === "true") {

                var userSelectButton = document.createElement('button');
                userSelectButton.classList.add('user-select', 'big-button');
                userSelectButton.textContent = 'Vybrať uživateľa';

                // Append the button to the main container
                mainContainer.appendChild(userSelectButton);

                // Event listener to open Swal.fire when the button is clicked
                userSelectButton.addEventListener('click', function() {
                    displayUserSelect(userOptions);
                });
            }

            if (!finishButton) {
              finishButton = document.createElement('button');
              finishButton.textContent = isEnglish ? 'Create reservation' : 'Vytvoriť rezerváciu';
              finishButton.classList.add('finish-reservation-button');
              finishButton.classList.add('add-hidden-third');
              finishButton.classList.add('big-button');
              finishButton.onclick = createReservation;

              mainContainer.appendChild(finishButton);
            }

            var hiddenElements = document.querySelectorAll('.hidden-element-third');
            hiddenElements.forEach(element => {
                element.classList.remove('hidden-element-third');
            });

            moveToBottom();
        });
    });
});

function displayUserSelect(userOptions) {
    // Create the HTML structure for the Swal.fire modal content
    let htmlContent = '<div id="userSelectList" class="swal2-user-select-list">';

    // Populate the div with options from userOptions
    userOptions.forEach(function(option) {
        htmlContent += `
            <div class="saved-person-container">
                <span class="user-info saved-person-text" data-id="${option.id}" data-email="${option.email}" data-phone="${option.phone}" data-name_surname="${option.name_surname}">
                    ${option.name_surname}
                </span>
                <button onclick="deleteSavedPerson('${option.id}', '${option.name_surname}')" class="saved-person-delete-button" title="Vymazať">❌</button>
            </div>
        `;
    });

    htmlContent += '</div>';

    Swal.fire({
        title: 'Vybrať uživateľa',
        html: htmlContent,
        showCancelButton: true,
        showConfirmButton: false,
        didOpen: () => {
            // Attach click event listener to all user-info elements
            document.querySelectorAll('.user-info').forEach(function(element) {
                element.addEventListener('click', function() {
                    var selectedNameSurname = this.dataset.name_surname;
                    var selectedEmail = this.dataset.email;
                    var selectedPhone = this.dataset.phone;

                    // Update the input fields with the selected user's data
                    document.getElementById('name_surname').value = selectedNameSurname;
                    document.getElementById('email').value = selectedEmail;
                    document.getElementById('phone').value = selectedPhone;

                    Swal.close();
                });
            });
        }
    });
}

function deleteSavedPerson(id, name_surname) {
    Swal.fire({
        title: `Určite vymazať ${name_surname}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Áno',
    }).then((result) => {
        if (result.isConfirmed) {
            // Send a fetch request to delete the user
            fetch('/delete_saved_person/', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken,
                },
                body: JSON.stringify({ id: id })
            })
            .then(response => response.json())
            .then(data => {
                console.log(data);  // Log the response to ensure it's correct
                if (data.status === 'success') {
                    userOptions = userOptions.filter(option => option.id !== id.toString());
                    displayUserSelect(userOptions);
                } else {
                    Swal.fire('Error', 'Failed to delete the user', 'error');
                }
            })
            .catch(error => {
                // Display the error message using Swal.fire
                Swal.fire('Error', error.message || 'An unknown error occurred', 'error');
            });
        }
    });
}

$(document).ready(function() {
  // Function to add highlight to the cell
  function addHighlight(cell) {
    if (cell.find('.fc-event').length > 0) { // Check if there are any events in this cell
      cell.addClass('highlight-cell');
    }
  }

  // Function to remove highlight from the cell
  function removeHighlight(cell) {
    cell.removeClass('highlight-cell');
  }

  // Hover over the entire day cell
  $(document).on('mouseenter', '.fc-daygrid-day', function() {
    addHighlight($(this));
  });

  $(document).on('mouseleave', '.fc-daygrid-day', function() {
    removeHighlight($(this));
  });
});


function pickDate(clickedDateElement = null) {

    if (clickedDateElement) {
        // Remove the class from any previously clicked date (if needed)
        const previouslySelected = document.querySelector('.selected-date');
        if (previouslySelected) {
            previouslySelected.classList.remove('selected-date');
        }

        // Add the new class to the clicked date element
        clickedDateElement.classList.add('selected-date');
    }
    var mainContainer = document.getElementById('time-slot-container');
    var selectedDate = document.getElementById('date');

    hiddenTimeSlotAll = document.querySelectorAll('.add-hidden-timeSlots');
    hiddenTimeSlotAll.forEach(element => {
        element.classList.remove('hidden-element-timeSlots');
    });

    mainContainer.innerHTML = '';
    selectedDate.style.border = '1px solid black';

    if (worker) {

        Swal.fire({
            allowOutsideClick: false, // Prevent closing by clicking outside
            allowEscapeKey: false,   // Prevent closing by pressing the Esc key
            allowEnterKey: false,    // Prevent closing by pressing the Enter key
            didOpen: () => {
                Swal.showLoading();  // Show loading animation
            }
        });

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
                    var fragment = document.createDocumentFragment();
                    var parser = new DOMParser();
                    var doc = parser.parseFromString(slotsHtml, 'text/html');
                    var slots = Array.from(doc.querySelectorAll('button'));

                    slots.forEach(slot => fragment.appendChild(slot));
                    mainContainer.appendChild(fragment);
                } else {
                    var textForApending = document.createElement('p');
                    textForApending.textContent = isEnglish ? 'No free slots left for today': 'Na dnes už nie sú voľné sloty';
                    mainContainer.appendChild(textForApending);
                }

                Swal.close();
                moveToBottom();

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
  var dateObj = new Date(date); // Create a Date object
  var day = String(dateObj.getDate()).padStart(2, '0'); // Get day with padding
  var month = String(dateObj.getMonth() + 1).padStart(2, '0'); // Get month with padding (starts at 0)
  var year = dateObj.getFullYear();
  return `${day}.${month}.${year}`; // Return formatted date
}

function selectTimeSlot(button) {
    var previouslySelectedButton = document.getElementById('picked-time-slot');
    if (previouslySelectedButton) {
      previouslySelectedButton.removeAttribute('id');
      previouslySelectedButton.classList.remove('selected');
    }

    button.id = 'picked-time-slot';
    button.classList.add('selected');
    timeSlot = button.textContent.trim();

    var hiddenElements = document.querySelectorAll('.hidden-element-second');
    hiddenElements.forEach(element => {
        element.classList.remove('hidden-element-second');
    });

    moveToBottom();
}

function createReservation() {
    var selectedDate = document.getElementById('date').value;
    var nameSurname = document.getElementById('name_surname');
    var email = document.getElementById('email');
    var phone = document.getElementById('phone');
    var note = document.getElementById('note');

    nameSurname.style.border = '1px solid black';
    email.style.border = '1px solid black';
    phone.style.border = '1px solid black';

    function showError(field, message) {
        field.style.border = '2px solid red';
        Swal.fire({
            icon: 'error',
            title: message,
        });
    }

    var errorMessage = null;

    if (superUser === "true") {
        if (!nameSurname.value) {
            errorMessage = isEnglish ? `Please enter your name and surname` : `Zadajte svoje meno a priezvisko`;
            showError(nameSurname, errorMessage);
        }
    } else {
        if (!nameSurname.value) {
            errorMessage = isEnglish ? `Please enter your name and surname` : `Zadajte svoje meno a priezvisko`;
            showError(nameSurname, errorMessage);
        } else if (!email.value) {
            errorMessage = isEnglish ? `Please enter your email address` : `Zadajte svoju e-mailovú adresu`;
            showError(email, errorMessage);
        } else if (!phone.value) {
            errorMessage = isEnglish ? `Please enter your phone number` : `Zadajte svoje telefónne číslo`;
            showError(phone, errorMessage);
        }

        var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email.value)) {
            errorMessage = isEnglish ? `Enter a valid email, please` : `Zadajte prosím správny email`;
            showError(email, errorMessage);
        }
    }

    if (errorMessage) {
        return;
    }

    if (!duration) {
        Swal.fire({
            icon: 'error',
            title: isEnglish ? `Choose a duration please` : `Vyberte si ešte dĺžku trvania prosím`,
        });
        return;
    }

    var dateParts = selectedDate.split('-');
    var formattedDate = `${dateParts[2]}.${dateParts[1]}.${dateParts[0]}`;

    // Convert the timeSlot to a Date object
    var timeParts = timeSlot.split(':');
    var startTime = new Date();
    startTime.setHours(parseInt(timeParts[0]));
    startTime.setMinutes(parseInt(timeParts[1]));

    // Ensure that duration is treated as minutes and add it to the start time
    startTime.setMinutes(startTime.getMinutes() + parseInt(duration));

    // Format the end time
    var endTime = `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`;

    var recapMessage = `
        <table style="width:100%; text-align:left;">
            <tr>
                <td>${isEnglish ? 'Date' : 'Dátum'}</td>
                <td>${formattedDate}</td>
            </tr>
            <tr>
                <td>Slot</td>
                <td>${timeSlot} - ${endTime}</td>
            </tr>
            <tr>
                <td>${isEnglish ? 'Name and Surname' : 'Meno a priezvisko'}</td>
                <td>${nameSurname.value}</td>
            </tr>
            <tr>
                <td>Email:</td>
                <td>${email.value}</td>
            </tr>
            <tr>
                <td>${isEnglish ? 'Phone' : 'Telefón'}</td>
                <td>${phone.value}</td>
            </tr>
            <tr>
                <td>${isEnglish ? 'Note' : 'Poznámka'}</td>
                <td>${note.value || (isEnglish ? 'None' : 'Žiadna')}</td>
            </tr>
            <tr>
                <td>${isEnglish ? 'Massager' : 'Masér'}</td>
                <td>${worker}</td>
            </tr>
        </table>
    `;

    Swal.fire({
        title: isEnglish ? 'Please confirm your reservation details' : 'Prosím, potvrďte údaje o rezervácii',
        html: recapMessage,
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: isEnglish ? 'Confirm' : 'Potvrdiť',
        cancelButtonText: isEnglish ? 'Cancel' : 'Zrušiť'
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({
                allowOutsideClick: false, // Prevent closing by clicking outside
                allowEscapeKey: false,   // Prevent closing by pressing the Esc key
                allowEnterKey: false,    // Prevent closing by pressing the Enter key
                didOpen: () => {
                    Swal.showLoading();  // Show loading animation
                }
            });

            // Proceed with reservation if confirmed
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
                    nameSurname: nameSurname.value,
                    email: email.value,
                    phone: phone.value,
                    note: note.value
                }),
            }).then((response) => {
                if (response.ok) {
                    Swal.close();
                    Swal.fire({
                        icon: 'success',
                        title: isEnglish ? `Reservation created` : `Rezervácia vytvorená`,
                    }).then(() => {
                        window.location.href = `/`;
                    });
                } else {
                    throw new Error('Failed to create reservation');
                }
            }).catch((error) => {
                Swal.close();
                Swal.fire({
                    icon: 'error',
                    title: isEnglish ? `Reservation failed` : `Rezervácia zlyhala`,
                    text: error.message
                });
            });
        }
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
          pickDate(info.dayEl);
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

            const dayCellSelector = `.fc-day[data-date="${info.event.startStr.split('T')[0]}"]`;
            const dayCellElement = document.querySelector(dayCellSelector);

            // Pass the day cell element to pickDate if found
            if (dayCellElement) {
                pickDate(dayCellElement);
            } else {
                pickDate();
            }
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
    // Show the loading Swal
    Swal.fire({
        allowOutsideClick: false, // Prevent closing by clicking outside
        allowEscapeKey: false,   // Prevent closing by pressing the Esc key
        allowEnterKey: false,    // Prevent closing by pressing the Enter key
        didOpen: () => {
            Swal.showLoading();  // Show loading animation
        }
    });

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

                Swal.close();
                moveToBottom();
            } else {
                // Close the Swal and show error
                Swal.close();
                Swal.fire({
                    title: 'Error',
                    text: 'Error fetching events: ' + response.error,
                    icon: 'error'
                });
            }
        },
        error: function(xhr, status, error) {
            // Close the Swal and show error
            Swal.close();
            Swal.fire({
                title: 'Error',
                text: 'Error fetching events: ' + error,
                icon: 'error'
            });
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    // Get references to the input fields
    var nameSurname = document.getElementById('name_surname');
    var email = document.getElementById('email');
    var phone = document.getElementById('phone');
    var note = document.getElementById('note');

    // Function to trigger the button click
    function triggerButtonClick() {
        var finishButton = document.querySelector('.finish-reservation-button');
        if (finishButton) {
            console.log('Triggering button click'); // Debugging log
            finishButton.click();
        } else {
            console.error('Button with class "finish-reservation-button" not found.');
        }
    }

    // Function to handle the keydown event
    function handleKeyDown(event) {
        if (event.key === 'Enter') { // Check if Enter key was pressed
            event.preventDefault(); // Prevent default Enter key behavior (like form submission)
            console.log('Enter key pressed'); // Debugging log
            triggerButtonClick(); // Trigger button click
        }
    }

    // Function to add event listeners to fields
    function addEventListeners() {
        if (nameSurname) nameSurname.addEventListener('keydown', handleKeyDown);
        if (email) email.addEventListener('keydown', handleKeyDown);
        if (phone) phone.addEventListener('keydown', handleKeyDown);
        if (note) note.addEventListener('keydown', handleKeyDown);
    }

    // Use MutationObserver to detect when the button is added
    var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (document.querySelector('.finish-reservation-button')) {
                console.log('Button found, adding event listeners');
                addEventListeners();
                observer.disconnect(); // Stop observing once button is found and listeners are added
            }
        });
    });

    // Start observing the document body for changes
    observer.observe(document.body, { childList: true, subtree: true });
});

var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.addedNodes.length > 0) {
            // Check if the specific container has been added
            if (document.querySelector('.hidden-element-third')) {
                // Perform the asterisk toggle based on superUser value
                toggleAsterisks();
                observer.disconnect();  // Stop observing once content is loaded
            }
        }
    });
});

observer.observe(document.body, { childList: true, subtree: true });

function toggleAsterisks() {
    if (superUser === "true") {
        document.querySelector('.email-required').style.display = 'none';
        document.querySelector('.phone-required').style.display = 'none';
    } else {
        document.querySelector('.email-required').style.display = 'inline';
        document.querySelector('.phone-required').style.display = 'inline';
    }
}
