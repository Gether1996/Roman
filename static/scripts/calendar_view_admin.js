document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('calendar');
    var calendar;

    function initializeCalendar() {
        // Clear the calendar if it exists
        if (calendar) {
            calendar.destroy();
        }

        // Determine the view based on screen width
        const isMobile = window.matchMedia('(max-width: 500px)').matches;
        const initialView = isMobile ? 'dayGridDay' : 'timeGridWeek'; // Use single-day view for mobile

        calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: initialView,

            // Toolbar with buttons for week and month view
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: isMobile ? 'dayGridDay,dayGridMonth' : 'timeGridWeek,dayGridMonth',
            },

            // General settings
            slotDuration: '01:00:00',
            slotMinTime: '07:00', // Start at midnight
            slotMaxTime: '22:00', // End at midnight of the next day
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
                day: 'Deň', // Added for single day view
            },

            events: events,

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

    // Initialize the calendar on load
    initializeCalendar();

    // Reinitialize on window resize to adapt to screen size
    window.addEventListener('resize', initializeCalendar);
});
