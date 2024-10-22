function formatDateWithoutTimezone(dateString) {
    // Split on the '+' or 'Z' to remove the timezone part
    return dateString.split('+')[0].split('Z')[0];
}

let debounceTimer;
const debounceDelay = 150; // 300ms delay

document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('calendar');
    var calendar;

    function initializeCalendar() {
        if (calendar) {
            calendar.destroy();
        }

        const isMobile = window.matchMedia('(max-width: 500px)').matches;
        const initialView = isMobile ? 'dayGridDay' : 'timeGridWeek';

        calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: initialView,
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: isMobile ? 'dayGridDay,dayGridMonth' : 'timeGridWeek,dayGridMonth',
            },
            slotDuration: '01:00:00',
            slotMinTime: '07:00',
            slotMaxTime: '22:00',
            allDaySlot: false,
            expandRows: true,

            eventTimeFormat: {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit'
            },
            firstDay: 1,
            dayHeaderFormat: { weekday: 'short' },
            locale: 'sk',
            buttonText: {
                today: 'Dnes',
                week: 'Týždeň',
                month: 'Mesiac',
                day: 'Deň',
            },

            events: function(fetchInfo, successCallback, failureCallback) {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    fetch(`/fetch_reservations/?start=${formatDateWithoutTimezone(fetchInfo.startStr)}&end=${formatDateWithoutTimezone(fetchInfo.endStr)}`)
                        .then(response => {
                            if (!response.ok) {
                                throw new Error('Network response was not ok');
                            }
                            return response.json();
                        })
                        .then(data => {
                            successCallback(data);
                        })
                        .catch(error => {
                            console.error('Error fetching reservations:', error);
                            failureCallback(error);
                        });
                }, debounceDelay);
            },

            eventMinHeight: 50,
            eventContent: function(info) {
                let title = info.event.title;
                let startTime = info.timeText;
                let phone = info.event.extendedProps.phone;
                let email = info.event.extendedProps.email;
                let active = info.event.extendedProps.active;

                let contentEl = document.createElement('div');
                contentEl.classList.add('event-card');

                let timeEl = document.createElement('div');
                timeEl.classList.add('event-time');
                timeEl.innerText = startTime;

                let titleEl = document.createElement('div');
                titleEl.classList.add('event-title');
                titleEl.innerHTML = title;

                let detailsEl = document.createElement('div');
                detailsEl.classList.add('event-details');

                if (active === "False") {
                    let activeEl = document.createElement('span');
                    activeEl.classList.add('event-active');
                    activeEl.innerText = `Nepotvrdené`;
                    detailsEl.appendChild(activeEl);
                    detailsEl.appendChild(document.createElement('br'));
                }
                if (phone) {
                    let phoneEl = document.createElement('span');
                    phoneEl.classList.add('event-phone');
                    phoneEl.innerText = `Phone: ${phone}`;
                    detailsEl.appendChild(phoneEl);
                    detailsEl.appendChild(document.createElement('br'));
                }
                if (email) {
                    let emailEl = document.createElement('span');
                    emailEl.classList.add('event-email');
                    emailEl.innerText = `Email: ${email}`;
                    detailsEl.appendChild(emailEl);
                    detailsEl.appendChild(document.createElement('br'));
                }

                if (phone || email) {
                    calendar.setOption('eventMinHeight', 80);
                } else {
                    calendar.setOption('eventMinHeight', 50);
                }

                contentEl.appendChild(timeEl);
                contentEl.appendChild(titleEl);
                contentEl.appendChild(detailsEl);

                return { domNodes: [contentEl] };
            },

            eventDidMount: function(info) {
                if (info.event.backgroundColor) {
                    info.el.style.backgroundColor = info.event.backgroundColor;
                }
                if (info.event.borderColor) {
                    info.el.style.borderColor = info.event.borderColor;
                }
                if (info.event.textColor) {
                    info.el.style.color = info.event.textColor;
                }
            }
        });

        calendar.render();
    }

    initializeCalendar();
    window.addEventListener('resize', initializeCalendar);
});