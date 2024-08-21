const selectedDays = {
    roman: new Set(),
    evka: new Set()
};

function saveDaysAhead(person, days_ahead_person) {
    var days_ahead = document.getElementById(days_ahead_person).value;
    if (person === 'roman') {
        var body = {days_ahead_roman: days_ahead};
    } else {
        var body = {days_ahead_evka: days_ahead};
    }
    var title = 'Počet dní zmenený.';
    sendFetchRequest(body, title);
}

function saveTimeRange(person, time_from, time_to) {
    var time_from = document.getElementById(time_from).value;
    var time_to = document.getElementById(time_to).value;
    if (person === 'roman') {
        var body = {time_from_roman: time_from, time_to_roman: time_to};
    } else {
        var body = {time_from_evka: time_from, time_to_evka: time_to};
    }
    var title = 'Sloty zmenené.';
    sendFetchRequest(body, title);
}

function saveWorkingDays(person) {
    const selectedDaysForPerson = Array.from(selectedDays[person]);

    let body;
    if (person === 'roman') {
        body = {
            selected_days_roman: selectedDaysForPerson
        };
    } else {
        body = {
            selected_days_evka: selectedDaysForPerson
        };
    }

    var title = 'Pracovné dni boli zmenené.';
    sendFetchRequest(body, title);
}

function sendFetchRequest(body, title) {
    Swal.fire({
        title: 'Ukladanie...',
        didOpen: () => {
            Swal.showLoading();
            fetch('/save_settings/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify(body)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok.');
                }
                return response.json();
            })
            .then(data => {
                if (data.status === 'success') {
                    Swal.fire({
                        icon: 'success',
                        title: title,
                        showConfirmButton: false,
                        showCancelButton: false,
                        timer: 1000,
                    });
                    setTimeout(() => {
                        location.reload();
                    }, 1000);
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: data.message,
                        showConfirmButton: false,
                        showCancelButton: false,
                        timer: 1000,
                    });
                }
            })
            .catch(error => {
                console.error('There was a problem with the fetch operation:', error);
                Swal.fire({
                    title: 'Chyba pri ukladaní!',
                    text: 'Niečo sa pokazilo, skúste to znova.',
                    icon: 'error',
                    showConfirmButton: true,
                });
            });
        },
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
    });
}

document.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();

        // Get the currently focused element
        var focusedElement = document.activeElement;

        if (focusedElement && focusedElement.tagName === 'INPUT') {
            if (focusedElement.id === 'emps_per_page') {
                document.getElementById('save_emps_per_page_button').click();
            } else if (focusedElement.id === 'line_manager_emplid') {
                document.getElementById('save_emplid_button').click();
            }
        }
    }
});

function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

// Function to populate the select options with half-hour intervals
function populateTimeSelects(start_slot, end_slot, start_container, end_container) {
    var startSelect = document.getElementById(start_container);
    var endSelect = document.getElementById(end_container);

    // Loop from 00:00 (0 minutes) to 23:30 (1410 minutes) by 30-minute intervals
    for (let i = 0; i <= 1410; i += 30) {
        let hours = Math.floor(i / 60);
        let minutes = i % 60;
        let time = (hours < 10 ? '0' : '') + hours + ':' + (minutes < 10 ? '0' : '') + minutes;

        // Create and append option for start time select
        let startOption = document.createElement('option');
        startOption.value = time;
        startOption.text = time;
        if (time === start_slot) {
            startOption.selected = true;
        }
        startSelect.appendChild(startOption);

        // Create and append option for end time select
        let endOption = document.createElement('option');
        endOption.value = time;
        endOption.text = time;
        if (time === end_slot) {
            endOption.selected = true;
        }
        endSelect.appendChild(endOption);
    }
}

window.onload = populateTimeSelects(startingSlotHourRoman, endingSlotHourRoman, 'start_time_roman', 'end_time_roman');
window.onload = populateTimeSelects(startingSlotHourEvka, endingSlotHourEvka, 'start_time_evka', 'end_time_evka');

var dayLabels = {
    'Monday': 'Pon',
    'Tuesday': 'Ut',
    'Wednesday': 'Str',
    'Thursday': 'Št',
    'Friday': 'Pi',
    'Saturday': 'So',
    'Sunday': 'Ne'
};

function initializeWorkingDays(working_days_person, container_name, person) {
    var container = document.getElementById(container_name);

    Object.keys(dayLabels).forEach(day => {
        var button = document.createElement('button');
        button.innerText = dayLabels[day];
        button.value = day;
        button.className = 'day-button';

        // Pre-select the buttons based on workingDays
        if (working_days_person.includes(day)) {
            button.classList.add('selected');
            selectedDays[person].add(day); // Initialize selected days
        }

        // Add event listener for button clicks
        button.addEventListener('click', () => {
            button.classList.toggle('selected');
            if (button.classList.contains('selected')) {
                selectedDays[person].add(day);
            } else {
                selectedDays[person].delete(day);
            }
        });

        container.appendChild(button);
    });
}

window.onload = initializeWorkingDays(workingDaysRoman, 'working_days_container_roman', 'roman');
window.onload = initializeWorkingDays(workingDaysEvka, 'working_days_container_evka', 'evka');

function addTurnedOffDay() {
    Swal.fire({
        title: 'Pridať obmedzenie',
        html: `
            <label for="worker">Masér:</label>
            <select id="worker" class="swal2-input">
                <option value="Roman">Roman</option>
                <option value="Evka">Evka</option>
            </select>
            <label for="date">Dátum:</label>
            <input id="date" type="date" class="swal2-input" required>
            <label for="whole_day">Celý deň:</label>
            <select id="whole_day" class="swal2-input">
                <option value="true">Áno</option>
                <option value="false">Nie</option>
            </select>
            <div id="time_range_container" style="display: none;">
                <label for="time_from">Od:</label>
                <input id="time_from" type="time" class="swal2-input">
                <label for="time_to">Do:</label>
                <input id="time_to" type="time" class="swal2-input">
            </div>
        `,
        showCancelButton: true,
        preConfirm: () => {
            var worker = document.getElementById('worker').value;
            var date = document.getElementById('date').value;
            var whole_day = document.getElementById('whole_day').value === 'true';
            let time_from = null;
            let time_to = null;

            if (!whole_day) {
                time_from = document.getElementById('time_from').value;
                time_to = document.getElementById('time_to').value;
            }

            if (!worker || !date || (!whole_day && (!time_from || !time_to))) {
                Swal.showValidationMessage('Prosím vyplňte všetky polia');
                return false;
            }

            return { worker, date, whole_day, time_from, time_to };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const { worker, date, whole_day, time_from, time_to } = result.value;

            fetch('/add_turned_off_day/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken,
                },
                body: JSON.stringify({ worker, date, whole_day, time_from, time_to })
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    Swal.fire({
                        icon: 'success',
                        title: 'Obmedzenie pridané',
                        showConfirmButton: false,
                        showCancelButton: false,
                        timer: 1000,
                    });
                    setTimeout(() => {
                        location.reload();
                    }, 1000);
                } else {
                    Swal.fire('Chyba!', 'Nastala chyba pri pridávaní.', 'error');
                }
            })
            .catch(error => {
                Swal.fire('Chyba!', 'Nastala chyba pri pridávaní.', 'error');
            });
        }
    });

    document.getElementById('whole_day').addEventListener('change', function () {
        const timeRangeContainer = document.getElementById('time_range_container');
        if (this.value === 'false') {
            timeRangeContainer.style.display = 'block';
        } else {
            timeRangeContainer.style.display = 'none';
        }
    });
}

function cancelOffDay(turnedOffDayId) {
    Swal.fire({
        text: "Naozaj vymazať?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Áno',
        cancelButtonText: 'Zrušiť',
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`/delete_turned_off_day/`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify({ turnedOffDayId: turnedOffDayId })
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    Swal.fire({
                        icon: 'success',
                        title: data.message,
                        showConfirmButton: false,
                        showCancelButton: false,
                        timer: 1000,
                    });
                    setTimeout(() => {
                        location.reload();
                    }, 1000);
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: data.message,
                    });
                }
            })
            .catch(error => {
                Swal.fire('Chyba!', 'Nastala chyba pri mazani.', 'error');
            });
        }
    });
}