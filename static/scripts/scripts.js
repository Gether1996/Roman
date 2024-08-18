var Swal = Swal.mixin({
  confirmButtonColor: '#244b90',
  cancelButtonText: isEnglish ? 'Cancel' : 'Zrušiť',
});

function switchLanguage(language_code) {
  fetch("/switch_language/" + String(language_code) + '/', {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      'X-CSRFToken': csrfToken,
    },
  })
    .then(response => response.json())
    .then(data => {
        location.reload();
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


document.addEventListener('DOMContentLoaded', function() {
    var avatarIcon = document.getElementById('avatar-user-icon');
    var dropdownMenu = document.getElementById('dropdown-menu');
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

    avatarIcon.addEventListener('click', function() {
        toggleDropdown(dropdownMenu.style, dropdownMenu);
        event.stopPropagation();
    });

    languageButton.addEventListener('click', function(event) {
        toggleDropdown(dropdownMenuLanguages.style, dropdownMenuLanguages);
        event.stopPropagation();
    });

    window.addEventListener('click', function(event) {
        closeDropdownOnClickOutside(event, dropdownMenu.style, '#avatar-user-icon');
        closeDropdownOnClickOutside(event, dropdownMenuLanguages.style, '.navbar-language-button');
    });
});