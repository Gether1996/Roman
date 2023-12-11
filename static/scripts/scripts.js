function smoothScroll(targetId) {
    var target = document.getElementById(targetId);
    if (target) {
      var targetPosition = target.offsetTop; // Get the target element's position
      var startPosition = window.pageYOffset; // Get current position
      var distance = targetPosition - startPosition;
      var duration = 1000; // Set the duration of the scroll in milliseconds
      let start = null;

      // Function to perform the scrolling animation
      function animation(currentTime) {
        if (start === null) {
          start = currentTime;
        }
        var timeElapsed = currentTime - start;
        var run = ease(timeElapsed, startPosition, distance, duration);
        window.scrollTo(0, run);
        if (timeElapsed < duration) {
          requestAnimationFrame(animation);
        }
      }

      // Easing function for smooth scrolling
      function ease(t, b, c, d) {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
      }

      requestAnimationFrame(animation);
    }
}

function scrollToTop() {
  const startPosition = window.pageYOffset; // Get current position
  const distance = -startPosition; // Calculate the distance to scroll to the top
  const duration = 1000; // Set the duration of the scroll in milliseconds
  let start = null;

  // Function to perform the scrolling animation
  function animation(currentTime) {
    if (start === null) {
      start = currentTime;
    }
    const timeElapsed = currentTime - start;
    const run = ease(timeElapsed, startPosition, distance, duration);
    window.scrollTo(0, run);
    if (timeElapsed < duration) {
      requestAnimationFrame(animation);
    }
  }

  // Easing function for smooth scrolling
  function ease(t, b, c, d) {
    t /= d / 2;
    if (t < 1) return c / 2 * t * t + b;
    t--;
    return -c / 2 * (t * (t - 2) - 1) + b;
  }

  requestAnimationFrame(animation);
}

function initMap() {
    var mapOptions = {
        center: { lat: 49.209475, lng: 18.769308 },
        zoom: 15, // Set the initial zoom level
    };

    var map = new google.maps.Map(document.getElementById("map"), mapOptions);

    var marker = new google.maps.Marker({
    position: { lat: 49.209475, lng: 18.769308 }, // Set the marker's position
    map: map, // Set the map to display the marker
    title: "My Marker", // Set a title for the marker (optional)
});
}

// Call the initMap function when the page loads
google.maps.event.addDomListener(window, "load", initMap);


function switchLanguage(language_code) {
  fetch("/switch_language/" + String(language_code) + '/', {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      'X-CSRFToken': csrf_token,
    },
  })
    .then(response => response.json())
    .then(data => {
      Swal.fire({
        position: 'top',
        title: (language_code === 'sk') ? 'Switching to slovak.' : 'Prepínam na angličtinu.',
        icon: 'info',
        iconColor: 'rgba(0, 0, 40, 0.9)',
        showConfirmButton: false,
        timer: 900
      });
      setTimeout(function () {
        location.reload();
      }, 900);
    })
    .catch(error => {
      console.error("Error switching language:", error);
    });
}