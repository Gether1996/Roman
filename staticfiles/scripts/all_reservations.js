function fetchFilteredData(page = 1, sort_by, order, reload) {
    var filters = {
        name_surname: document.getElementById('sort_name_surname').value,
        email: document.getElementById('sort_email').value,
        phone_number: document.getElementById('sort_phone_number').value,
        date: document.getElementById('sort_date').value,
        slot: document.getElementById('sort_slot').value,
        worker: document.getElementById('sort_worker').value,
        created_at: document.getElementById('sort_created_at').value,
        special_request: document.getElementById('sort_special_request').value,
        status: document.getElementById('sort_status').value,
        page: page
    };

    var queryString = new URLSearchParams(filters).toString();
    var url = `/get_all_reservations_data/?${queryString}&sort_by=${sort_by}&order=${order}`;
    console.log(url);

    fetch(url)
        .then(response => response.json())
        .then(data => {
            updateTable(data.reservations);
            updatePaginateElements(data.pagination);
        })
        .catch(error => console.error('Error fetching data:', error));

    var url = new URL(window.location.href);
    url.searchParams.set('page', page);
    url.searchParams.set('sort_by', sort_by);
    url.searchParams.set('order', order);
    window.history.pushState({}, '', url);
    if (reload === 'reload') {
        window.location.reload();
    }
}

function updateTable(reservations) {
    if (!Array.isArray(reservations)) {
        console.error('Expected an array of files but received:', reservations);
        return;
    }

    var tbody = document.querySelector('tbody');
    tbody.innerHTML = '';

    reservations.forEach(reservation => {
        var successIcon = reservation.active ?
            '<i style="color: green;" class="fa-solid fa-circle-check"></i>' :
            '<i style="color: red;" class="fa-solid fa-circle-xmark"></i>';

        var actionButton = reservation.active ?
            `<button class="action-button" style='background-color: #dd3c3c; margin-bottom: 3px;' onclick="cancelReservation('${reservation.id}', '${reservation.name_surname}')">Zrušiť</button>` :
            `<button class="action-button" style='background-color: #238b55; margin-bottom: 3px;' onclick="approveReservation('${reservation.id}', '${reservation.name_surname}')">Schváliť</button>`;

        var row = document.createElement('tr');
        row.className = 'files-row';
        row.innerHTML = `
            <td>${reservation.name_surname}</td>
            <td>${reservation.email}</td>
            <td>${reservation.phone_number}</td>
            <td>${reservation.date}</td>
            <td>${reservation.slot}</td>
            <td>${reservation.worker}</td>
            <td>${reservation.created_at}</td>
            <td>${reservation.special_request}</td>
            <td>${reservation.status}</td>
            <td>${reservation.personal_note}</td>
            <td class="text-align-center">${successIcon}</td>
            <td>${reservation.cancellation_reason}</td>
            <td class="text-align-center">
                ${actionButton}
                <button class="action-button" style='background-color: #238b55; margin-left: 2px;' onclick="addNote('${reservation.id}', '${reservation.name_surname}', '${reservation.personal_note}')">Poznámka</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function updatePaginateElements(pagination) {
    var paginators = document.getElementsByClassName('paginator');

    for (var i = 0; i < paginators.length; i++) {
        var paginator = paginators[i];

        paginator.innerHTML = '';

        if (pagination.current_page > 1) {
            paginator.innerHTML += `<button class="btn paginator-button" title="${isEnglish? 'First' : 'Prvá'}" onclick="fetchFilteredData(1, '${current_sort_by}', '${current_order}', 'reload')"><i class="fa-regular fa-arrow-left-to-line"></i></button>`;
        }

        if (pagination.has_previous) {
            paginator.innerHTML += `<button class="btn paginator-button" title="${isEnglish? 'Previous' : 'Predchádzajúca'}" onclick="fetchFilteredData(${pagination.current_page - 1}, '${current_sort_by}', '${current_order}', 'reload')"><i class="fa-solid fa-arrow-left"></i></button>`;
        }

        const total_pages = pagination.total_pages;
        const current_page = pagination.current_page;
        const max_visible_pages = 7;
        let start_page, end_page;

        // Always try to center the current page within the visible range
        if (total_pages <= max_visible_pages) {
            // If there are fewer pages than the max visible, show them all
            start_page = 1;
            end_page = total_pages;
        } else {
            // Calculate start and end pages to keep the current page centered
            start_page = Math.max(1, current_page - Math.floor(max_visible_pages / 2));
            end_page = Math.min(total_pages, current_page + Math.floor(max_visible_pages / 2));

            // Adjust if we are at the beginning of the pagination range
            if (start_page === 1) {
                end_page = max_visible_pages;
            }

            // Adjust if we are at the end of the pagination range
            if (end_page === total_pages) {
                start_page = total_pages - max_visible_pages + 1;
            }
        }

        // Add page numbers
        for (let page = start_page; page <= end_page; page++) {
            if (page === current_page) {
                paginator.innerHTML += `<span style="background-color: #a7b8e7;" class="paginator-button btn">${page}</span>`;
            } else {
                paginator.innerHTML += `<button class="btn paginator-button" onclick="fetchFilteredData(${page}, '${current_sort_by}', '${current_order}', 'reload')">${page}</button>`;
            }
        }

        if (pagination.has_next) {
            paginator.innerHTML += `<button class="btn paginator-button" title="${isEnglish? 'Next' : 'Nasledujúca'}" onclick="fetchFilteredData(${pagination.current_page + 1}, '${current_sort_by}', '${current_order}', 'reload')"><i class="fa-solid fa-arrow-right"></i></button>`;
        }

        if (pagination.current_page < pagination.total_pages) {
            paginator.innerHTML += `<button class="btn paginator-button" title="${isEnglish? 'Last' : 'Posledná'}" onclick="fetchFilteredData(${pagination.total_pages}, '${current_sort_by}', '${current_order}', 'reload')"><i class="fa-regular fa-arrow-right-to-line"></i></button>`;
        }
    }

    var predefinedOptions = [5, 10, 20, 50, 100];
    let additionalOption = '';

    if (!predefinedOptions.includes(pagination.files_per_page)) {
        additionalOption = `<option value="${pagination.files_per_page}" selected>${pagination.files_per_page}</option>`;
    }

    paginator.innerHTML += `
        <select id="items-per-page-select" onchange="saveFilesPerPage(this.value)">
            ${additionalOption}
            <option value="5" ${pagination.files_per_page == 5 ? 'selected' : ''}>5</option>
            <option value="10" ${pagination.files_per_page == 10 ? 'selected' : ''}>10</option>
            <option value="20" ${pagination.files_per_page == 20 ? 'selected' : ''}>20</option>
            <option value="50" ${pagination.files_per_page == 50 ? 'selected' : ''}>50</option>
            <option value="100" ${pagination.files_per_page == 100 ? 'selected' : ''}>100</option>
        </select>
    `;

    let startFile, endFile;

    if (pagination.total_files === 0) {
        startFile = 0;
        endFile = 0;
    } else {
        startFile = (pagination.current_page - 1) * pagination.files_per_page + 1;
        endFile = Math.min(pagination.current_page * pagination.files_per_page, pagination.total_files);
    }

    paginator.innerHTML += `
        <span class="employee-count">
            Zobrazené ${startFile}-${endFile} (${pagination.total_files})
        </span>
    `;
}

fetchFilteredData(page, current_sort_by, current_order, 'no');

function saveFilesPerPage(value) {
    var body = {files_per_page: value};
    sendFetchRequest(body);
}

function sendFetchRequest(body) {
    Swal.fire({
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
                    window.location.reload();
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

function removeDiacritics(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function filterTable() {
    var filters = {};
    document.querySelectorAll('.searching-input-table').forEach(input => {
        filters[input.getAttribute('data-filter')] = removeDiacritics(input.value.toLowerCase());
    });

    var rows = document.querySelectorAll('#filesBody .files-row');

    rows.forEach(row => {
        var name_surname = removeDiacritics(row.children[0].textContent.toLowerCase());
        var email = removeDiacritics(row.children[1].textContent.toLowerCase());
        var phone_number = row.children[2].textContent.toLowerCase();
        var date = row.children[3].textContent.toLowerCase();
        var slot = row.children[4].textContent.toLowerCase();
        var worker = row.children[5].textContent.toLowerCase();
        var created_at = row.children[6].textContent.toLowerCase();
        var special_request = removeDiacritics(row.children[7].textContent.toLowerCase());
        var status = removeDiacritics(row.children[8].textContent.toLowerCase());

        // Determine if the row matches the filter criteria
        var matches = Object.keys(filters).every(key => {
            var filterValue = filters[key];
            switch (key) {
                case 'name_surname':
                    return name_surname.includes(filterValue);
                case 'email':
                    return email.includes(filterValue);
                case 'phone_number':
                    return phone_number.includes(filterValue);
                case 'date':
                    return date.includes(filterValue);
                case 'slot':
                    return slot.includes(filterValue);
                case 'worker':
                    return worker.includes(filterValue);
                case 'created_at':
                    return created_at.includes(filterValue);
                case 'special_request':
                    return special_request.includes(filterValue);
                case 'status':
                    return status.includes(filterValue);
                default:
                    return true;
            }
        });

        row.style.display = matches ? '' : 'none';
    });
    toggleClearButtonVisibility();
}

function toggleClearButtonVisibility() {
    var hasValue = Array.from(document.querySelectorAll('.searching-input-table')).some(input => input.value.trim() !== '');
    var clearButton = document.querySelector('.cancel-filter-button');
    if (hasValue) {
        clearButton.classList.remove('hidden-initially');
    } else {
        clearButton.classList.add('hidden-initially');
    }
}

function removeAllFilters() {
    var clearButton = document.querySelector('.cancel-filter-button');
    clearButton.classList.add('hidden-initially');
    document.querySelectorAll('.searching-input-table').forEach(input => {
        input.value = '';
    });
    fetchFilteredData(page, current_sort_by, current_order, 'no');
}

document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.searching-input-table').forEach(input => {
        input.addEventListener('input', filterTable);
    });

    filterTable();
});

function handleKeyDown(event) {
    if (event.key === 'Enter') {
        fetchFilteredData(page, current_sort_by, current_order, 'no');
    }
}

function handleInputChange(event) {
    var inputValue = event.target.value.trim();

    if (inputValue === '') {
        fetchFilteredData(page, current_sort_by, current_order, 'no');
    }
}

function attachEventListeners() {
    var inputs = document.querySelectorAll('.searching-input-table');

    inputs.forEach(input => {
        input.addEventListener('keydown', handleKeyDown);
        input.addEventListener('input', handleInputChange);
    });
}

document.addEventListener('DOMContentLoaded', attachEventListeners);


function cancelReservation(reservationId, name) {
    Swal.fire({
        title: `Naozaj zrušiť rezerváciu na meno ${name}?`,
        text: "Môžete uviesť poznámku k zrušeniu (voliteľné):",
        input: 'text',
        showCancelButton: true,
        confirmButtonText: "Áno, zrušiť rezerváciu",
        cancelButtonText: "Zrušiť",
        icon: "question",
        preConfirm: (note) => {
            return fetch(`/cancel_reservation/`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify({id: reservationId, note: note })
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    Swal.fire({
                        icon: "success",
                        timer: 600,
                        showConfirmButton: false
                    }).then(() => {
                        fetchFilteredData(page, current_sort_by, current_order, 'no');
                    });
                } else {
                    Swal.fire("Chyba", "Vyskytol sa problém pri rušení rezervácie.", "error");
                }
            })
            .catch(error => {
                Swal.fire("Chyba", "Vyskytol sa problém s požiadavkou.", "error");
            });
        }
    });
}

function addNote(reservationId, name, note) {
    Swal.fire({
        title: `Pridať poznámku rezervácii na meno ${name}`,
        input: 'text',
        inputPlaceholder: note ? note : 'Zadajte poznámku',
        showCancelButton: true,
        confirmButtonText: "Uložiť",
        cancelButtonText: "Zrušiť",
        preConfirm: (note) => {
            if (!note) {
                return 'AAAAA';
            }

            return fetch(`/add_personal_note/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify({id: reservationId, note: note })
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    Swal.fire({
                        icon: "success",
                        timer: 600,
                        showConfirmButton: false
                    }).then(() => {
                        fetchFilteredData(page, current_sort_by, current_order, 'no');
                    });
                } else {
                    Swal.fire("Chyba", "Vyskytol sa problém pri rušení rezervácie.", "error");
                }
            })
            .catch(error => {
                Swal.fire("Chyba", "Vyskytol sa problém s požiadavkou.", "error");
            });
        }
    });
}

function approveReservation(reservationId, name) {
    Swal.fire({
        title: `Naozaj schváliť rezerváciu na meno ${name}?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Áno, schváliť",
        cancelButtonText: "Zrušiť",
        preConfirm: () => {
            return fetch(`/approve_reservation/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify({id: reservationId })
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    Swal.fire({
                        icon: "success",
                        timer: 600,
                        showConfirmButton: false
                    }).then(() => {
                        fetchFilteredData(page, current_sort_by, current_order, 'no');
                    });
                } else {
                    Swal.fire("Chyba", "Vyskytol sa problém pri schvaľovaní rezervácie.", "error");
                }
            })
            .catch(error => {
                Swal.fire("Chyba", "Vyskytol sa problém s požiadavkou.", "error");
            });
        }
    });
}