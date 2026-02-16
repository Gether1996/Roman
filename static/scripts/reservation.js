let worker = null;
let duration = null;
let timeSlot = null;
let massageName = null;
let pickedDateGeneralData = null;

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

function revealFirst() {
    document.querySelectorAll('.add-hidden-first').forEach(element => {
        element.classList.remove('hidden-element-first');
    });
}

function revealSecond() {
    document.querySelectorAll('.add-hidden-second').forEach(element => {
        element.classList.remove('hidden-element-second');
    });
}

function revealThird() {
    document.querySelectorAll('.add-hidden-third').forEach(element => {
        element.classList.remove('hidden-element-third');
    });
}

function revealFourth() {
    document.querySelectorAll('.add-hidden-fourth').forEach(element => {
        element.classList.remove('hidden-element-fourth');
    });
}

function hideFirst() {
    document.querySelectorAll('.add-hidden-first').forEach(element => {
        element.classList.add('hidden-element-first');
    });
}

function hideSecond() {
    document.querySelectorAll('.add-hidden-second').forEach(element => {
        element.classList.add('hidden-element-second');
    });
}

function hideThird() {
    document.querySelectorAll('.add-hidden-third').forEach(element => {
        element.classList.add('hidden-element-third');
    });
}

function hideFourth() {
    document.querySelectorAll('.add-hidden-fourth').forEach(element => {
        element.classList.add('hidden-element-fourth');
    });
}

function hideAll() {
    hideFirst();
    hideSecond();
    hideThird();
    hideFourth();
}

document.addEventListener('DOMContentLoaded', function() {
    const bigButtons = document.querySelectorAll('.option-button-person');
    bigButtons.forEach(button => {
        button.addEventListener('click', function() {
            allSelectedElements = document.querySelectorAll('.selected');
            allSelectedElements.forEach(btn => btn.classList.remove('selected'));
            this.classList.add('selected');
            worker = this.id;

            hideAll();
            revealFirst();
            resetDateInput();
        });
    });

    const optionButtons = document.querySelectorAll('.option-button-time');
    optionButtons.forEach(button => {
        button.addEventListener('click', function() {
            optionButtons.forEach(btn => btn.classList.remove('selected'));
            this.classList.add('selected');
            duration = this.dataset.time;
            massageName = this.dataset.name;

            const mainContainer = document.getElementById('reservation-box-container');
            let finishButton = document.querySelector('.finish-reservation-button');

            // Check if the "Vybrať uživateľa" button already exists
            let userSelectButton = mainContainer.querySelector('.user-select');

            if (superUser === "true" && !userSelectButton) {
                // Create the button only if it does not exist
                userSelectButton = document.createElement('button');
                userSelectButton.classList.add('user-select', 'big-button', 'add-hidden-fourth');
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
                finishButton.innerHTML = isEnglish
                    ? `Create reservation`
                    : `Vytvoriť rezerváciu`;
                finishButton.classList.add('finish-reservation-button', 'add-hidden-fourth', 'big-button');
                finishButton.onclick = createReservation;

                mainContainer.appendChild(finishButton);
            }

            revealFourth();
            moveToBottom();
        });
    });
});

function openSmSystemMessage() {
  const t = isEnglish
    ? {
        heading: 'SM System "Season Pass"',
        sectionTitle: "Current pass options",
        oneEntry: "Single entry",
        threeEntries: "3 entries",
        fiveEntries: "5 entries",
        note1: "On your first visit we will issue a paper season pass.",
        note2:
          "This notice is for informational purposes. We’ll gladly provide more details in person or by phone.",
        close: "Close",
      }
    : {
        heading: "SM systém „permanentka“",
        sectionTitle: "Aktuálne možnosti permanentky",
        oneEntry: "Jeden vstup",
        threeEntries: "3 vstupy",
        fiveEntries: "5 vstupov",
        note1: "Pri prvej návšteve Vám vystavíme papierovú permanentku.",
        note2:
          "Toto oznámenie má informatívny charakter. Podrobnejšie informácie vám radi poskytneme osobne alebo telefonicky.",
        close: "Zavrieť",
      };

  const html = `
    <div>
      <div style="margin-bottom:12px;">
        <div style="margin-top:8px;font-size:18px;font-weight:700;">
          ${t.heading}
        </div>
      </div>

      <div style="
        padding:10px 12px;
        border:1px solid #e6e6e6;
        border-radius:8px;
        background:#fafafa;
        margin-bottom:12px;
        font-weight:600;
      ">
        ${t.sectionTitle}
      </div>

      <ul style="
        list-style:none;
        padding:0;
        margin:0 0 12px 0;
        border:1px solid #eee;
        border-radius:8px;
        overflow:hidden;
      ">
        <li style="
          display:flex;justify-content:space-between;align-items:center;
          padding:10px 12px;border-bottom:1px solid #eee;
        ">
          <span>${t.oneEntry}</span><span style="font-weight:600;">20&nbsp;€</span>
        </li>
        <li style="
          display:flex;justify-content:space-between;align-items:center;
          padding:10px 12px;border-bottom:1px solid #eee;
        ">
          <span>${t.threeEntries}</span><span style="font-weight:600;">45&nbsp;€</span>
        </li>
        <li style="
          display:flex;justify-content:space-between;align-items:center;
          padding:10px 12px;
        ">
          <span>${t.fiveEntries}</span><span style="font-weight:600;">75&nbsp;€</span>
        </li>
      </ul>

      <div style="
        border:1px solid #eee;
        border-radius:8px;
        padding:10px 12px;
        background:#f7f7f7;
        color:#444;
        font-size:12px;
      ">
        <p style="margin:0 0 6px 0;">${t.note1}</p>
        <p style="margin:0;">${t.note2}</p>
      </div>
    </div>
  `;

  Swal.fire({
    title: "",
    html: `
    <div style="text-align: center;">
      <div style="
        width: 80px;
        height: 80px;
        margin: 0 auto 1.5rem;
        background: linear-gradient(135deg, rgba(0, 128, 255, 0.1) 0%, rgba(0, 128, 255, 0.15) 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <i class="fa-solid fa-arrows-spin" style="font-size: 2rem; color: #0080ff;"></i>
      </div>
      <h2 style="
        font-size: 1.75rem;
        font-weight: 700;
        color: #2c3e50;
        margin-bottom: 0.5rem;
      ">
        ${t.heading}
      </h2>
      <p style="
        font-size: 1rem;
        color: #6c757d;
        margin-bottom: 2rem;
        line-height: 1.5;
      ">
        ${t.sectionTitle}
      </p>
      <div style="
        display: inline-block;
        padding: 0.5rem 1.25rem;
        background: linear-gradient(135deg, rgba(0, 128, 255, 0.1) 0%, rgba(0, 128, 255, 0.15) 100%);
        color: #0080ff;
        font-size: 0.9rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1px;
        border-radius: 50px;
        margin-bottom: 1.5rem;
      ">
        ${isEnglish ? 'Price list' : 'Cenník'}
      </div>
      <ul style="
        list-style: none;
        padding: 0;
        margin: 0 0 2rem 0;
        background: white;
        border: 2px solid #e9ecef;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      ">
        <li style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #f0f0f0;
          transition: background-color 0.2s ease;
        " onmouseover="this.style.background='linear-gradient(135deg, rgba(0, 128, 255, 0.03) 0%, rgba(0, 128, 255, 0.05) 100%)'" onmouseout="this.style.background='white'">
          <span style="font-size: 1rem; color: #2c3e50; font-weight: 500;">${t.oneEntry}</span>
          <span style="
            font-size: 1.1rem;
            font-weight: 700;
            color: #0080ff;
            background: linear-gradient(135deg, rgba(0, 128, 255, 0.1) 0%, rgba(0, 128, 255, 0.15) 100%);
            padding: 0.35rem 1rem;
            border-radius: 50px;
          ">20&nbsp;€</span>
        </li>
        <li style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #f0f0f0;
          transition: background-color 0.2s ease;
        " onmouseover="this.style.background='linear-gradient(135deg, rgba(0, 128, 255, 0.03) 0%, rgba(0, 128, 255, 0.05) 100%)'" onmouseout="this.style.background='white'">
          <span style="font-size: 1rem; color: #2c3e50; font-weight: 500;">${t.threeEntries}</span>
          <span style="
            font-size: 1.1rem;
            font-weight: 700;
            color: #0080ff;
            background: linear-gradient(135deg, rgba(0, 128, 255, 0.1) 0%, rgba(0, 128, 255, 0.15) 100%);
            padding: 0.35rem 1rem;
            border-radius: 50px;
          ">45&nbsp;€</span>
        </li>
        <li style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          transition: background-color 0.2s ease;
        " onmouseover="this.style.background='linear-gradient(135deg, rgba(0, 128, 255, 0.03) 0%, rgba(0, 128, 255, 0.05) 100%)'" onmouseout="this.style.background='white'">
          <span style="font-size: 1rem; color: #2c3e50; font-weight: 500;">${t.fiveEntries}</span>
          <span style="
            font-size: 1.1rem;
            font-weight: 700;
            color: #0080ff;
            background: linear-gradient(135deg, rgba(0, 128, 255, 0.1) 0%, rgba(0, 128, 255, 0.15) 100%);
            padding: 0.35rem 1rem;
            border-radius: 50px;
          ">75&nbsp;€</span>
        </li>
      </ul>
      <div style="
        border: 2px solid rgba(0, 128, 255, 0.15);
        border-radius: 16px;
        padding: 1.25rem 1.5rem;
        background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
        color: #495057;
        font-size: 0.95rem;
        line-height: 1.6;
        text-align: left;
        box-shadow: 0 2px 8px rgba(0, 128, 255, 0.08);
      ">
        <div style="
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        ">
          <i class="fa-solid fa-circle-info" style="color: #0080ff; font-size: 1.2rem; margin-top: 0.15rem; flex-shrink: 0;"></i>
          <p style="margin: 0; font-weight: 500;">${t.note1}</p>
        </div>
        <div style="
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        ">
          <i class="fa-solid fa-phone" style="color: #0080ff; font-size: 1.2rem; margin-top: 0.15rem; flex-shrink: 0;"></i>
          <p style="margin: 0;">${t.note2}</p>
        </div>
      </div>
    </div>
  `,
    icon: undefined,
    showConfirmButton: true,
    confirmButtonText: t.close,
    width: 600,
    background: "#fff",
    color: "#212529",
    confirmButtonColor: "#0080ff",
  });
}

function displayUserSelect(userOptions) {
    // Create the HTML structure for the Swal.fire modal content
    let htmlContent = `
        <input type="text" id="userSearchInput" class="swal2-input" placeholder="Hľadať užívateľa..." style="margin-bottom: 15px;">
        <div id="userSelectList" class="swal2-user-select-list">
    `;

    // Function to generate the user list based on filtered options
    function generateUserList(options) {
        return options.map(option => `
            <div class="saved-person-container">
                <span class="user-info saved-person-text" data-id="${option.id}" data-email="${option.email}" data-phone="${option.phone}" data-name_surname="${option.name_surname}">
                    ${option.name_surname}
                </span>
                <button onclick="deleteSavedPerson('${option.id}', '${option.name_surname}')" class="saved-person-delete-button" title="Vymazať">❌</button>
            </div>
        `).join('');
    }

    // Function to normalize and remove diacritics from text
    function normalizeText(text) {
        return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    }

    // Populate the div with options from userOptions
    htmlContent += generateUserList(userOptions);
    htmlContent += '</div>';

    Swal.fire({
        title: 'Vybrať uživateľa',
        html: htmlContent,
        showCancelButton: true,
        showConfirmButton: false,
        didOpen: () => {
            const searchInput = document.getElementById('userSearchInput');
            const userSelectList = document.getElementById('userSelectList');

            // Attach click event listener to all user-info elements
            function attachClickEvents() {
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

            attachClickEvents();

            // Filter function to search and display matching users
            searchInput.addEventListener('input', function() {
                const searchTerm = normalizeText(searchInput.value);

                // Filter the user options based on the normalized search term
                const filteredOptions = userOptions.filter(option =>
                    normalizeText(option.name_surname).includes(searchTerm)
                );

                // Update the user list with filtered options
                userSelectList.innerHTML = generateUserList(filteredOptions);

                // Re-attach click events to the newly generated elements
                attachClickEvents();
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
        } else {
            displayUserSelect(userOptions);
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
    var dateInput = document.getElementById('date');
    
    // Get the raw date value (YYYY-MM-DD format)
    pickedDateGeneralData = dateInput.value;
    
    // Display formatted date in the input (DD.MM.YYYY)
    dateInput.setAttribute('data-value', pickedDateGeneralData);
    dateInput.value = formatDateToSK(pickedDateGeneralData);

    revealSecond();
    hideThird();
    hideFourth();

    mainContainer.innerHTML = '';

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
            body: JSON.stringify({selectedDate: pickedDateGeneralData, worker: worker}),
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

function selectTimeSlot(button) {
  console.log(worker);
  var previouslySelectedButton = document.getElementById('picked-time-slot');
  if (previouslySelectedButton) {
    previouslySelectedButton.removeAttribute('id');
    previouslySelectedButton.classList.remove('selected');
  }

  hideFourth();

  button.id = 'picked-time-slot';
  button.classList.add('selected');
  timeSlot = button.textContent.trim();

  fetch(`/check_available_durations/${worker}/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrfToken
    },
    body: JSON.stringify({
      timeSlot: timeSlot,
      pickedDateGeneralData: pickedDateGeneralData
    })
  })
    .then(response => response.json())
    .then(data => {
      // Hide all duration options initially
      const allDurations = document.querySelectorAll('.option-button-time');
      allDurations.forEach(element => {
        element.classList.add('hidden-element-third');
        element.classList.remove('selected');
      });
      duration = null;

      const heading = document.getElementById('choose-duration-h2');
      heading.classList.remove('hidden-element-third');

    const availableDurations = data.available_durations;

    // Optional: dedupe the array if the API can return repeats
    const durationsToShow = [...new Set(availableDurations.map(String))];

    durationsToShow.forEach(d => {
    const matches = document.querySelectorAll(`.option-button-time[data-time="${d}"]`);
        matches.forEach(el => {
            // If this is the SM systém button, only show for Roman
            if (el.classList.contains('roman-only-button') && worker !== 'Roman') return;
            el.classList.remove('hidden-element-third');
        });
    });

      console.log('Available durations:', availableDurations);
    })
    .catch(error => {
      console.error('Error:', error);
    });

  moveToBottom();
}

function createReservation() {
    // Get the raw date in YYYY-MM-DD format (stored globally from pickDate)
    var selectedDate = pickedDateGeneralData;
    var dateInput = document.getElementById('date');
    var nameSurname = document.getElementById('name_surname');
    var email = document.getElementById('email');
    var phone = document.getElementById('phone');
    var note = document.getElementById('note');

    nameSurname.style.border = '1px solid black';
    email.style.border = '1px solid black';
    phone.style.border = '1px solid black';

    const errors = [];
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function flag(field, message) {
        field.style.border = '2px solid red';
        errors.push(message);
    }
    
    // Check if date is selected
    if (!selectedDate) {
        Swal.fire({
            icon: 'error',
            title: isEnglish ? `Please select a date` : `Prosím, vyberte dátum`,
        });
        return;
    }

    if (superUser === "true") {
        if (!nameSurname.value.trim()) {
            flag(nameSurname, isEnglish ? `Please enter your name and surname` : `Zadajte svoje meno a priezvisko`);
        }
        if (nameSurname.value.trim().length > 150) {
            flag(nameSurname, isEnglish ? `Name is too long (max 150 characters)` : `Meno je príliš dlhé (max 150 znakov)`);
        }
        } else {
        if (!nameSurname.value.trim()) {
            flag(nameSurname, isEnglish ? `Please enter your name and surname` : `Zadajte svoje meno a priezvisko`);
        }
        if (nameSurname.value.trim().length > 150) {
            flag(nameSurname, isEnglish ? `Name is too long (max 150 characters)` : `Meno je príliš dlhé (max 150 znakov)`);
        }

        if (!email.value.trim()) {
            flag(email, isEnglish ? `Please enter your email address` : `Zadajte svoju e-mailovú adresu`);
        } else if (!emailPattern.test(email.value.trim())) {
            flag(email, isEnglish ? `Enter a valid email, please` : `Zadajte prosím správny email`);
        }

        if (!phone.value.trim()) {
            flag(phone, isEnglish ? `Please enter your phone number` : `Zadajte svoje telefónne číslo`);
        }
        if (phone.value.trim().length > 20) {
            flag(phone, isEnglish ? `Phone number is too long (max 20 characters)` : `Telefónne číslo je príliš dlhé (max 20 znakov)`);
        }
    }

    // Validate note length (for both superuser and regular user)
    if (note.value.trim().length > 200) {
        note.style.border = '2px solid red';
        errors.push(isEnglish ? `Note is too long (max 200 characters)` : `Poznámka je príliš dlhá (max 200 znakov)`);
    }

    if (errors.length) {
        Swal.fire({
            icon: 'error',
            html: errors.map(e => `<div>${e}</div>`).join('')
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
                <td>${isEnglish ? 'Type' : 'Typ'}</td>
                <td>${massageName}</td>
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
                    massageName: massageName,
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
                return response.json().then(data => {
                    if (response.ok && data.status === 'success') {
                        Swal.close();
                        Swal.fire({
                            icon: 'success',
                            title: isEnglish ? data.message_en : data.message_sk,
                        }).then(() => {
                            window.location.href = `/`;
                        });
                    } else {
                        // Handle error response
                        throw {
                            status: response.status,
                            data: data
                        };
                    }
                });
            }).catch((error) => {
                Swal.close();
                
                // Default error messages
                let errorTitle = isEnglish ? 'Reservation failed' : 'Rezervácia zlyhala';
                let errorMessage = isEnglish 
                    ? 'An unexpected error occurred. Please try again.' 
                    : 'Vyskytla sa neočakávaná chyba. Skúste to prosím znova.';
                
                // If we have structured error data from backend
                if (error.data) {
                    errorMessage = isEnglish ? error.data.message_en : error.data.message_sk;
                    
                    // Add error code for debugging if available
                    if (error.data.error_code) {
                        console.error('Reservation error:', error.data.error_code, error.data);
                    }
                    
                    // Special handling for specific error types
                    if (error.data.error_code === 'TIME_SLOT_TAKEN') {
                        errorTitle = isEnglish ? 'Time slot unavailable' : 'Časový slot nie je dostupný';
                    } else if (error.data.error_code === 'INVALID_EMAIL') {
                        errorTitle = isEnglish ? 'Invalid email' : 'Neplatný email';
                    } else if (error.data.error_code === 'FIELD_TOO_LONG') {
                        errorTitle = isEnglish ? 'Input too long' : 'Príliš dlhý vstup';
                    }
                } else if (error.message) {
                    // Fallback for network errors or other exceptions
                    console.error('Network or other error:', error);
                }
                
                Swal.fire({
                    icon: 'error',
                    title: errorTitle,
                    text: errorMessage,
                    confirmButtonText: isEnglish ? 'OK' : 'OK'
                });
            });
        }
    });
}

function formatDateToSK(isoString) {
  const date = new Date(isoString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('calendar');
    var dateInput = document.getElementById('date');
    
    // Detect mobile
    const isMobile = window.innerWidth <= 500;

    calendar = new FullCalendar.Calendar(calendarEl, {

        initialView: 'dayGridMonth',
        eventTimeFormat: {
            hour12: false,
            hour: 'numeric',
            minute: 'numeric'
        },
        // Mobile-specific settings
        height: 'auto',
        contentHeight: 'auto',
        aspectRatio: isMobile ? 1 : 1.35,
        handleWindowResize: true,
        windowResizeDelay: 200,
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

          // Store raw date value
          dateInput.value = info.dateStr;
          pickDate(info.dayEl);
        },

        eventClick: function(info) {

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const clickedDate = new Date(info.event.startStr);

            if (clickedDate < today || info.event.extendedProps.nonClickable) {
                return;
            }

            // Store raw date value
            const rawDate = info.event.startStr.split('T')[0];
            dateInput.value = rawDate;

            const dayCellSelector = `.fc-day[data-date="${rawDate}"]`;
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
    
    // Handle window resize to update event display
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            // Update calendar dimensions on mobile
            const isMobileNow = window.innerWidth <= 500;
            if (isMobileNow) {
                calendar.setOption('height', 'auto');
                calendar.setOption('contentHeight', 'auto');
                calendar.setOption('aspectRatio', 1);
            } else {
                calendar.setOption('height', 'auto');
                calendar.setOption('contentHeight', 'auto');
                calendar.setOption('aspectRatio', 1.35);
            }
            
            // Refresh events if worker is selected
            if (worker) {
                updateEvents(worker);
            }
        }, 250);
    });
});

function updateEvents(worker) {
    const previouslySelected = document.querySelector('.selected-date');
    const userSelectButton = document.querySelector('.user-select');
    if (previouslySelected) {
        previouslySelected.classList.remove('selected-date');
    }
    if (userSelectButton) {
        userSelectButton.remove();
    }
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
                
                // Detect if mobile device
                const isMobile = window.innerWidth <= 500;
                
                // Process events and set correct language title
                const processedEvents = response.events.map(function(event) {
                    // Choose language
                    if (event.extendedProps && event.extendedProps.title_en && isEnglish) {
                        event.title = event.extendedProps.title_en;
                    }
                    
                    // Simplify for mobile - show only number
                    if (isMobile && event.extendedProps && event.extendedProps.available_count) {
                        event.title = String(event.extendedProps.available_count);
                    }
                    
                    return event;
                });
                
                calendar.addEventSource(processedEvents);

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