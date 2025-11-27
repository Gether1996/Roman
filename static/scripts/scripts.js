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

document.addEventListener('DOMContentLoaded', function() {
    // Selectors for new navbar structure
    var avatarButton = document.querySelector('.user-avatar');
    var dropdownMenu = document.getElementById('dropdown-menu');
    var languageButton = document.querySelector('.language-toggle');
    var dropdownMenuLanguages = document.getElementById('dropdown-menu-languages');
    var mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    var navLinks = document.querySelector('.navbar-nav-center');
    var mobileMenuOverlay = document.querySelector('.mobile-menu-overlay');

    // Modern dropdown toggle with class-based approach
    function toggleDropdown(dropdown) {
        if (!dropdown) return;
        
        // Close other dropdowns first
        document.querySelectorAll('.dropdown-menu-custom').forEach(function(menu) {
            if (menu !== dropdown) {
                menu.classList.remove('show');
                menu.style.display = 'none';
            }
        });

        if (dropdown.classList.contains('show')) {
            dropdown.classList.remove('show');
            setTimeout(function() {
                dropdown.style.display = 'none';
            }, 300);
        } else {
            dropdown.style.display = 'flex';
            setTimeout(function() {
                dropdown.classList.add('show');
            }, 10);
        }
    }

    function closeAllDropdowns() {
        document.querySelectorAll('.dropdown-menu-custom').forEach(function(menu) {
            menu.classList.remove('show');
            setTimeout(function() {
                menu.style.display = 'none';
            }, 300);
        });
    }

    // Mobile menu toggle
    function toggleMobileMenu() {
        if (!mobileMenuToggle || !navLinks) return;
        
        mobileMenuToggle.classList.toggle('active');
        navLinks.classList.toggle('active');
        if (mobileMenuOverlay) {
            mobileMenuOverlay.classList.toggle('active');
        }
        document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
    }

    // Mobile menu toggle button
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function(event) {
            event.stopPropagation();
            toggleMobileMenu();
        });
    }

    // Mobile overlay click
    if (mobileMenuOverlay) {
        mobileMenuOverlay.addEventListener('click', function() {
            toggleMobileMenu();
        });
    }

    // Close mobile menu when clicking on nav links
    if (navLinks) {
        var navLinkItems = navLinks.querySelectorAll('.nav-link-item');
        navLinkItems.forEach(function(link) {
            link.addEventListener('click', function() {
                if (window.innerWidth <= 768 && navLinks.classList.contains('active')) {
                    toggleMobileMenu();
                }
            });
        });
    }

    // User avatar dropdown
    if (avatarButton && dropdownMenu) {
        avatarButton.addEventListener('click', function(event) {
            event.stopPropagation();
            toggleDropdown(dropdownMenu);
        });
    }

    // Language dropdown
    if (languageButton && dropdownMenuLanguages) {
        languageButton.addEventListener('click', function(event) {
            event.stopPropagation();
            toggleDropdown(dropdownMenuLanguages);
        });
    }

    // Close dropdowns when clicking outside
    window.addEventListener('click', function(event) {
        if (!event.target.closest('.dropdown')) {
            closeAllDropdowns();
        }
    });

    // Close dropdowns on escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeAllDropdowns();
            if (navLinks && navLinks.classList.contains('active')) {
                toggleMobileMenu();
            }
        }
    });

    // Add smooth scroll behavior for navbar
    var modernNavbar = document.querySelector('.modern-navbar');
    if (modernNavbar) {
        var lastScroll = 0;
        window.addEventListener('scroll', function() {
            var currentScroll = window.pageYOffset;
            
            // Add shadow on scroll
            if (currentScroll > 10) {
                modernNavbar.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.12)';
            } else {
                modernNavbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.08)';
            }
            
            lastScroll = currentScroll;
        });
    }
});