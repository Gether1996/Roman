function smoothScroll(targetId) {
    var target = document.getElementById(targetId);
    if (target) {
      var targetPosition = target.offsetTop - 170; // Get the target element's position with an additional 100px offset from the top
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
  const startPosition = window.pageYOffset;
  const distance = -startPosition;
  const duration = 1000;
  let start = null;

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

  function showP(number) {
    var pElement = document.getElementById('p' + number);
    if (pElement.classList.contains('visible')) {
      pElement.style.opacity = '0';
      setTimeout(function() {
        pElement.style.display = 'none';
      }, 10); // Delay display after opacity transition (300ms)
      pElement.classList.remove('visible');
    } else {
      pElement.style.display = 'block';
      setTimeout(function() {
        pElement.style.opacity = '1';
      }, 10);
      pElement.classList.add('visible');
    }
  }

var modal = document.getElementById("myModal");
var img = document.getElementById("img01");
var modalImg = document.getElementById("img01");

document.getElementsByClassName("close")[0].onclick = function() {
    modal.style.display = "none";
}

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

function openBiggerImage(photoSrc) {
    modal.style.display = "block";
    modalImg.src = photoSrc;
}


document.addEventListener('DOMContentLoaded', function() {
    var languageButton = document.querySelector('.navbar-language-button');
    var dropdownMenuLanguages = document.getElementById('dropdown-menu-languages');

    function toggleDropdown(dropdown, menu) {
        if (dropdown.opacity === '1') {
            dropdown.opacity = '0';
            setTimeout(function() {
                dropdown.display = 'none';
            }, 300);
        } else {
            dropdown.display = 'block';
            setTimeout(function() {
                dropdown.opacity = '1';
            }, 10);
        }
    }

    function closeDropdownOnClickOutside(event, dropdown, menu) {
        if (!event.target.matches(menu) && dropdown.opacity === '1') {
            dropdown.opacity = '0';
            setTimeout(function() {
                dropdown.display = 'none';
            }, 300);
        }
    }

    languageButton.addEventListener('click', function(event) {
        toggleDropdown(dropdownMenuLanguages.style, dropdownMenuLanguages);
        event.stopPropagation();
    });

    window.addEventListener('click', function(event) {
        closeDropdownOnClickOutside(event, dropdownMenuLanguages.style, '.navbar-language-button');
    });
});