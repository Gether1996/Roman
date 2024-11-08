document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded");

    var calendarEl = document.getElementById('calendar_view');
    if (!calendarEl) {
        console.error('Calendar element not found!');
        return;
    }
    console.log("Calendar element found:", calendarEl);

    let eventMinHeight = 40;

    // Check screen width and set the initial view accordingly
    function getInitialView() {
        return window.innerWidth < 500 ? 'timeGridDay' : 'timeGridWeek';
    }

    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: getInitialView(),
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'timeGridDay,timeGridWeek,dayGridMonth',
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

        events: events,
        eventMinHeight: eventMinHeight,  // Set the min height here based on the calculated value
        eventContent: function(info) {
            console.log("Event content being processed");
            let title = info.event.title;
            let startTime = info.timeText;
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

    console.log("Calendar initialized with eventMinHeight:", eventMinHeight);
    calendar.render();
});