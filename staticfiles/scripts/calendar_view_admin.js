document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('calendar');
    calendar = new FullCalendar.Calendar(calendarEl, {

        initialView: 'timeGridWeek', // Ensure time grid is shown
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'timeGridWeek,dayGridMonth', // Add buttons to switch between week and month views
        },
        slotDuration: '01:00:00', // Each time slot represents 1 hour
        slotMinTime: '07:00', // Start at midnight
        slotMaxTime: '22:00', // End at midnight of the next day
        allDaySlot: false, // Remove "All Day" slot
        expandRows: true, // Ensure rows are tall enough to fit content

        // Set a custom height for each time slot (make time grid lines taller)
        slotLabelFormat: { hour: 'numeric', minute: '2-digit', hour12: false },
        height: 'auto', // Ensures calendar adapts its height
        contentHeight: 'auto', // Ensures full content height
        eventMinHeight: 50, // Minimum event height to show full content

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
            month: 'Mesiac', // Change button labels if needed
        },
        events: events, // Load your events array

        eventContent: function(info) {
            let title = info.event.title;
            let startTime = info.timeText;
            let phone = info.event.extendedProps.phone;
            let email = info.event.extendedProps.email;
            let active = info.event.extendedProps.active;

            // Creating the event content
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

            // Append elements to the main content element
            contentEl.appendChild(timeEl);
            contentEl.appendChild(titleEl);
            contentEl.appendChild(detailsEl);

            return { domNodes: [contentEl] };
        },
        eventDidMount: function(info) {
            if (info.event.backgroundColor) {
                info.el.style.backgroundColor = info.event.backgroundColor; // Set background color
            }
            if (info.event.borderColor) {
                info.el.style.borderColor = info.event.borderColor; // Set border color
            }
            if (info.event.textColor) {
                info.el.style.color = info.event.textColor; // Set text color
            }
        }
    });

    calendar.render();
});