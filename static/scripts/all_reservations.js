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
            <td>${reservation.personal_note}</td>
            <td class="text-align-center">${successIcon}</td>
            <td>${reservation.status}</td>
            <td>${reservation.cancellation_reason}</td>
            <td class="text-align-center">
                <button class="action-button" style="margin-bottom: 2px;"><i style="font-size: 20px;" class="fa-solid fa-file-arrow-down"></i> .CSV</button>
                <button class="action-button"><i style="font-size: 20px;" class="fa-solid fa-file-arrow-down"></i> .GPG</button>
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
            paginator.innerHTML += `<button class="btn paginator-button" onclick="fetchFilteredData(1, '${current_sort_by}', '${current_order}', 'reload')"><i class="fa-regular fa-arrow-left-to-line"></i> Prvá</button>`;
        }

        if (pagination.has_previous) {
            paginator.innerHTML += `<button class="btn paginator-button" onclick="fetchFilteredData(${pagination.current_page - 1}, '${current_sort_by}', '${current_order}', 'reload')"><i class="fa-solid fa-arrow-left"></i> Predchádzajúca</button>`;
        }

        paginator.innerHTML += `<span class="current-page">Strana ${pagination.current_page} - ${pagination.total_pages}</span>`;

        if (pagination.has_next) {
            paginator.innerHTML += `<button class="btn paginator-button" onclick="fetchFilteredData(${pagination.current_page + 1}, '${current_sort_by}', '${current_order}', 'reload')">Nasledujúca <i class="fa-solid fa-arrow-right"></i></button>`;
        }

        if (pagination.current_page < pagination.total_pages) {
            paginator.innerHTML += `<button class="btn paginator-button" onclick="fetchFilteredData(${pagination.total_pages}, '${current_sort_by}', '${current_order}', 'reload')">Posledná <i class="fa-regular fa-arrow-right-to-line"></i></button>`;
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
        var file_name = row.children[0].textContent.toLowerCase();
        var status = removeDiacritics(row.children[1].textContent.toLowerCase());
        var recipient = row.children[2].textContent.toLowerCase();
        var created_at = row.children[3].textContent.toLowerCase();
        var sent_at = row.children[4].textContent.toLowerCase();

        // Determine if the row matches the filter criteria
        var matches = Object.keys(filters).every(key => {
            var filterValue = filters[key];
            switch (key) {
                case 'file_name':
                    return file_name.includes(filterValue);
                case 'status':
                    return status.includes(filterValue);
                case 'recipient':
                    return recipient.includes(filterValue);
                case 'created_at':
                    return created_at.includes(filterValue);
                case 'sent_at':
                    return sent_at.includes(filterValue);
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