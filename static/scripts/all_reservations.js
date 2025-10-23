function fetchFilteredData(page = 1, sort_by, order, reload) {
    var filters = {
        name_surname: document.getElementById('sort_name_surname').value,
        email: document.getElementById('sort_email').value,
        phone_number: document.getElementById('sort_phone_number').value,
        date: document.getElementById('sort_date').value,
        slot: document.getElementById('sort_slot').value,
        type: document.getElementById('sort_type').value,
        worker: document.getElementById('sort_worker').value,
        created_at: document.getElementById('sort_created_at').value,
        special_request: document.getElementById('sort_special_request').value,
        status: document.getElementById('sort_status').value,
        page: page
    };

    var urlParams = new URLSearchParams(window.location.search);
    var worker_from_url = urlParams.get('worker');
    if (worker_from_url) {
        filters.worker = worker_from_url;
    }

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

        var actionButton = '';        
        if (!reservation.cancellation_reason) {
            actionButton = reservation.active ?
                `<button class="action-button" style='background-color: #dd3c3c;' onclick="deactivateReservation('${reservation.id}', '${reservation.name_surname}')">Deaktivovať</button>` :
                `<button class="action-button" style='background-color: #238b55;' onclick="approveReservation('${reservation.id}', '${reservation.name_surname}')">Schváliť</button>`;
        }

        var row = document.createElement('tr');
        row.className = 'files-row';
        row.innerHTML = `
            <td>${reservation.worker}</td>
            <td>${reservation.date}</td>
            <td style="white-space: nowrap;">${reservation.slot}</td>
            <td style="white-space: nowrap;">${reservation.massage_name}</td>
            <td>${reservation.name_surname}</td>
            <td>${reservation.email}</td>
            <td style="white-space: nowrap;">${reservation.phone_number}</td>
            <td>${reservation.created_at}</td>
            <td>${reservation.special_request}</td>
            <td>${reservation.status}</td>
            <td>${reservation.personal_note}</td>
            <td class="text-align-center">${successIcon}</td>
            <td>${reservation.cancellation_reason}</td>
            <td>
            <div style="display: flex; gap: 4px; align-items: center; justify-content: center;">
                ${actionButton}
                <button title="Poznámka" class="action-button" style="background-color: #238b55;" onclick="addNote('${reservation.id}', '${reservation.name_surname}', '${reservation.personal_note}')">
                <i class="fa-solid fa-pen-to-square"></i>
                </button>
                <button title="Vymazať" class="action-button" style="background-color: #dd3c3c;" onclick="deleteReservation('${reservation.id}', '${reservation.name_surname}')">
                <i class="fa-solid fa-trash"></i>
                </button>
            </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function updatePaginateElements(pagination) {
  const paginators = document.getElementsByClassName('paginator');

  const totalPages  = Number(pagination.total_pages) || 1;
  const currentPage = Number(pagination.current_page) || 1;
  const perPage     = Number(pagination.files_per_page) || 10;
  const totalFiles  = Number(pagination.total_files) || 0;

  // i18n
  const t = isEnglish ? {
    first: 'First', prev: 'Previous', next: 'Next', last: 'Last',
    showing: 'Showing', clear: 'Clear filter'
  } : {
    first: 'Prvá', prev: 'Predchádzajúca', next: 'Nasledujúca', last: 'Posledná',
    showing: 'Zobrazené', clear: 'Zrušiť filter'
  };

  // windowed pages
  const maxVisible = 7;
  let startPage, endPage;
  if (totalPages <= maxVisible) {
    startPage = 1; endPage = totalPages;
  } else {
    startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    endPage   = Math.min(totalPages, currentPage + Math.floor(maxVisible / 2));
    if (startPage === 1) endPage = maxVisible;
    if (endPage === totalPages) startPage = totalPages - maxVisible + 1;
  }

  // range text
  const startFile = totalFiles === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const endFile   = totalFiles === 0 ? 0 : Math.min(currentPage * perPage, totalFiles);

  // (optional) detect if filters are active (customize if you have your own flag)
  const filtersActive =
    (typeof areFiltersActive === 'function' && areFiltersActive()) ||
    !!document.querySelector('.cancel-filter-button:not(.hidden-initially)');

  // helper to make a pagination li
  const li = (label, page, {disabled=false, active=false, title='' } = {}) => {
    const cls = ['page-item', disabled ? 'disabled' : '', active ? 'active' : ''].join(' ').trim();
    const onclick = (!disabled && !active)
      ? `onclick="fetchFilteredData(${page}, '${current_sort_by}', '${current_order}', 'reload')"`
      : '';
    return `<li class="${cls}" ${onclick}>
              <span class="page-link" role="button" ${title ? `title="${title}"` : ''}>${label}</span>
            </li>`;
  };

  // build list
  let ul = `
    <nav aria-label="Page navigation">
      <ul class="pagination pagination-sm mb-0 flex-wrap">
        ${li('«', 1, {disabled: currentPage <= 1, title: t.first})}
        ${li('‹', currentPage - 1, {disabled: currentPage <= 1, title: t.prev})}
  `;

  for (let p = startPage; p <= endPage; p++) ul += li(String(p), p, {active: p === currentPage});

  ul += `
        ${li('›', currentPage + 1, {disabled: currentPage >= totalPages, title: t.next})}
        ${li('»', totalPages, {disabled: currentPage >= totalPages, title: t.last})}
  `;

  // items-per-page select
  const predefined = [5, 10, 20, 50, 100];
  const extraOpt = predefined.includes(perPage) ? '' : `<option value="${perPage}" selected>${perPage}</option>`;

  ul += `
        <li class="page-item ms-2">
          <div class="d-flex align-items-center">
            <select id="items-per-page-select" class="form-select form-select-sm w-auto" style="cursor:pointer;"
                    onchange="saveFilesPerPage(this.value)">
              ${extraOpt}
              <option value="5" ${perPage == 5 ? 'selected' : ''}>5</option>
              <option value="10" ${perPage == 10 ? 'selected' : ''}>10</option>
              <option value="20" ${perPage == 20 ? 'selected' : ''}>20</option>
              <option value="50" ${perPage == 50 ? 'selected' : ''}>50</option>
              <option value="100" ${perPage == 100 ? 'selected' : ''}>100</option>
            </select>
          </div>
        </li>

        <!-- counter as a disabled page item -->
        <li class="page-item disabled ms-2">
          <span class="page-link bg-transparent border-0 text-muted">
            ${t.showing} ${startFile}&ndash;${endFile} (${totalFiles})
          </span>
        </li>

        <!-- clear filter button inside the paginator -->
        <li class="page-item ms-2 ${filtersActive ? '' : 'd-none'}">
            <button type="button"
                    class="btn btn-danger btn-sm py-0 px-2 d-inline-flex align-items-center cancel-filter-button"
                    style="line-height: 1.2; height: calc(1.5em + .5rem + 2px);"
                    onclick="removeAllFilters()">
                <i class="fa-solid fa-filter me-1"></i> ${t.clear}
            </button>
        </li>
      </ul>
    </nav>
  `;

  const html = `
    <div class="d-flex flex-wrap align-items-center justify-content-between w-100 gap-2">
      ${ul}
    </div>
  `;

  for (let i = 0; i < paginators.length; i++) {
    paginators[i].innerHTML = html;
  }
}

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
        // Update these indices according to your new column order
        var worker = removeDiacritics(row.children[0].textContent.toLowerCase());      // Updated: Worker
        var date = row.children[1].textContent.toLowerCase();                         // Updated: Date
        var slot = row.children[2].textContent.toLowerCase();                         // Updated: Slot
        var type = row.children[3].textContent.toLowerCase();                         // Updated: Slot
        var name_surname = removeDiacritics(row.children[4].textContent.toLowerCase()); // Updated: Name and Surname
        var email = removeDiacritics(row.children[5].textContent.toLowerCase());       // Updated: Email
        var phone_number = row.children[6].textContent.toLowerCase();                  // Updated: Phone Number
        var created_at = row.children[7].textContent.toLowerCase();                    // Updated: Created At
        var special_request = removeDiacritics(row.children[8].textContent.toLowerCase()); // Updated: Special Request
        var status = removeDiacritics(row.children[9].textContent.toLowerCase());       // Updated: Status

        // Determine if the row matches the filter criteria
        var matches = Object.keys(filters).every(key => {
            var filterValue = filters[key];
            switch (key) {
                case 'worker':
                    return worker.includes(filterValue);
                case 'date':
                    return date.includes(filterValue);
                case 'slot':
                    return slot.includes(filterValue);
                case 'type':
                    return type.includes(filterValue);
                case 'name_surname':
                    return name_surname.includes(filterValue);
                case 'email':
                    return email.includes(filterValue);
                case 'phone_number':
                    return phone_number.includes(filterValue);
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
  const hasValue = Array.from(document.querySelectorAll('.searching-input-table'))
    .some(input => input.value.trim() !== '');

  const clearButton = document.querySelector('.cancel-filter-button');
  if (!clearButton) return; // nothing to toggle if it's not on the page

  clearButton.classList.toggle('hidden-initially', !hasValue);
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

function deactivateReservation(reservationId, name) {
    Swal.fire({
        title: `Naozaj deaktivovať rezerváciu na meno ${name}?`,
        text: "Môžete uviesť poznámku k zrušeniu (voliteľné):",
        input: 'text',
        showCancelButton: true,
        confirmButtonText: "Áno",
        cancelButtonText: "Zrušiť",
        icon: "question",
    }).then((result) => {
        if (result.isConfirmed) {
            // Fetch the note input from the user
            const note = result.value || '';

            fetch(`/deactivate_reservation_by_admin/`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify({ id: reservationId, note: note })
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
                return 'Pridajte poznámku';
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

function deleteReservation(reservationId, name) {
    Swal.fire({
        title: `Vymazať natrvalo rezerváciu na meno ${name}?`,
        showCancelButton: true,
        confirmButtonText: "Áno",
        cancelButtonText: "Zrušiť",
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`/delete_reservation/`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify({ id: reservationId })
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
                    Swal.fire("Chyba", "Vyskytol sa problém pri mazaní rezervácie.", "error");
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
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`/approve_reservation/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify({ id: reservationId })
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

function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}

function pickDate(option) {
    let date;
    if (option === 'today') {
        date = new Date();
    } else if (option === 'tomorrow') {
        date = new Date();
        date.setDate(date.getDate() + 1);
    }

    document.getElementById('sort_date').value = formatDate(date);
    document.getElementById('customDatePicker').value = '';  // Clear the date picker value
    fetchFilteredData(page, current_sort_by, current_order, 'no');
    toggleClearButtonVisibility();
}

function pickMassager(name) {
    document.getElementById('sort_worker').value = name;
    fetchFilteredData(page, current_sort_by, current_order, 'no');
    toggleClearButtonVisibility();
}

function setCustomDate(event) {
    const selectedDate = new Date(event.target.value);
    document.getElementById('sort_date').value = formatDate(selectedDate);
    fetchFilteredData(page, current_sort_by, current_order, 'no');
    toggleClearButtonVisibility();
}