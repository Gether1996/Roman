function login() {
    Swal.fire({
        title: isEnglish ? 'Login' : 'Prihlásenie',
        html:
            '<div class="swal-layout-login">' +
            '   <div class="swal-group">' +
            '       <input id="email-login" class="swal2-input" placeholder="Email">' +
            '   </div>' +
            '   <div class="swal-group">' +
            '       <div id="password-container">' +
            '           <input id="password" class="swal2-input" type="password" placeholder="' + (isEnglish ? 'Password' : 'Heslo') + '">' +
            '           <i class="toggle-password fas fa-eye" id="toggle-password-login" title="' + (isEnglish ? 'Show password' : 'Ukázať heslo') + '"></i>' +
            '       </div>' +
            '   </div>' +
            '</div>',
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: isEnglish ? 'Login' : 'Prihlásiť',
        didOpen: function () {

            document.querySelectorAll('#email-login, #password').forEach(function (input) {
                input.addEventListener('keyup', function (event) {
                    if (event.keyCode === 13) {
                        Swal.clickConfirm();
                    }
                });
            });

            document.getElementById('email-login').focus();

            var passwordInputs = [
                document.getElementById('password')
            ];

            var togglePasswords = [
                document.getElementById('toggle-password-login')
            ];

            passwordInputs.forEach(function (passwordInput) {
                if (!passwordInput) {
                    return;
                }
            });

            setupPasswordToggle(passwordInputs, togglePasswords);
        },
        preConfirm: () => {
            var emailInput = Swal.getPopup().querySelector('#email-login');
            var passwordInput = Swal.getPopup().querySelector('#password');
            var email = emailInput.value;
            var password = passwordInput.value;

            if (!password) {
                Swal.showValidationMessage(isEnglish ? 'Insert password please.' : 'Vložte prosím heslo.');
                return false;
            }

            if (!email || email.indexOf('@') === -1) {
                Swal.showValidationMessage(isEnglish ? 'Please enter a valid email address' : 'Prosím, zadajte platnú emailovú adresu');
                return false;
            }

            return { email, password };
        },
    }).then((result) => {
        if (result.isConfirmed) {
            var { email, password } = result.value;

            fetch('/login_api/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken,
                },
                body: JSON.stringify({ email, password })
            })
        .then(response => response.json())
        .then(data => {
                if (data.status === 'success') {
                    Swal.fire({
                        icon: 'success',
                        text: data.message
                    }).then(() => {
                        window.location.reload();
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        text: data.message
                    });
                }
            })
            .catch(error => {
                Swal.fire('Error', 'An error occurred during the login process.', 'error');
            });
        }
    });
}

function setupPasswordToggle(passwordInputs, togglePasswords) {
    togglePasswords.forEach(function (togglePassword, index) {
        togglePassword.addEventListener('click', function () {
            var passwordInput = passwordInputs[index];

            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                togglePassword.classList.remove('fa-eye');
                togglePassword.classList.add('fa-eye-slash');
                togglePassword.title = isEnglish ? 'Hide password' : 'Skryť heslo';
            } else {
                passwordInput.type = 'password';
                togglePassword.classList.remove('fa-eye-slash');
                togglePassword.classList.add('fa-eye');
                togglePassword.title = isEnglish ? 'Show password' : 'Ukázať heslo';
            }
        });
    });
}

function registration() {
    Swal.fire({
        title: isEnglish ? 'Registration' : 'Registrácia',
        html: `
            <div class="swal-layout">
                <div class="swal-group">
                    <input id="name" class="swal2-input" placeholder="${isEnglish ? 'Name' : 'Meno'}">
                </div>
                <div class="swal-group">
                    <input id="surname" class="swal2-input" placeholder="${isEnglish ? 'Surname' : 'Priezvisko'}">
                </div>
                <div class="swal-group">
                    <input id="email" class="swal2-input" placeholder="Email">
                </div>
                <div class="swal-group">
                    <input type="number" id="phone_number" class="swal2-input" placeholder="${isEnglish ? 'Phone' : 'Telefón'}">
                </div>
                <div class="swal-group" style="margin-left: 20px;">
                    <input id="password1" class="swal2-input" type="password" placeholder="${isEnglish ? 'Password' : 'Heslo'}" autocomplete="new-password">
                    <i class="toggle-password fas fa-eye" id="toggle-password-register" title="${isEnglish ? 'Show password' : 'Ukázať heslo'}"></i>
                </div>
                <div class="swal-group">
                    <input id="password2" class="swal2-input" type="password" placeholder="${isEnglish ? 'Confirm password' : 'Potvrdiť heslo'}" autocomplete="new-password">
                </div>
            </div>
        `,
        confirmButtonText: isEnglish ? 'Register' : 'Zaregistrovať',
        showCancelButton: true,
        didOpen: function () {

            document.querySelectorAll('#password1, #password2').forEach(function (input) {
                input.addEventListener('keyup', function (event) {
                    if (event.keyCode === 13) {
                        Swal.clickConfirm();
                    }
                });
            });

            var passwordInputs = [
                document.getElementById('password1'),
                document.getElementById('password2')
            ];

            var togglePasswords = [
                document.getElementById('toggle-password-register'),
                document.getElementById('toggle-password-register')
            ];

            passwordInputs.forEach(function (passwordInput) {
                if (!passwordInput) {
                    return;
                }
            });

            setupPasswordToggle(passwordInputs, togglePasswords);
        },
        preConfirm: () => {
            var name = Swal.getPopup().querySelector('#name').value;
            var surname = Swal.getPopup().querySelector('#surname').value;
            var email = Swal.getPopup().querySelector('#email').value;
            var phone_number = Swal.getPopup().querySelector('#phone_number').value;
            var password = Swal.getPopup().querySelector('#password1').value;
            var confirmPassword = Swal.getPopup().querySelector('#password2').value;
            var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailRegex.test(email)) {
                Swal.showValidationMessage(isEnglish ? 'Invalid email format' : 'Nesprávny formát emailu.');
                return false;
            }

            if (password !== confirmPassword) {
                Swal.showValidationMessage(isEnglish ? 'Passwords do not match' : 'Heslá sa nezhodujú.');
                return false;
            }

            if (!name || !surname || !email || !phone_number || !password || !confirmPassword) {
                Swal.showValidationMessage(isEnglish ? 'All fields must be filled.' : 'Všetky polia musia byť vyplnené.');
                return false;
            }

            if (password.length <= 7) {
                Swal.showValidationMessage(isEnglish ? 'Password must consist out of 8 characters minimum.' : 'Heslo musí obsahovať aspoň 8 znakov.');
                return false;
            }

            return { name, surname, email, phone_number, password, confirmPassword };
        },
    }).then((result) => {
        if (!result.dismiss && result.value) {
            var { name, surname, email, phone_number, password } = result.value;
            fetch('/registration/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify({ name, surname, email, phone_number, password }),
            }).then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    Swal.fire({
                        icon: 'success',
                        text: data.message
                    }).then(() => {
                        window.location.reload();
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        text: data.message
                    });
                }
            })
            .catch(error => {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'There was an error creating and sending the pin.'
                });
            }).finally(() => {
                stopLoading();
            });
        }
    });
}

function logoutConfirmation() {
    Swal.fire({
        title: 'Odhlásiť?',
        icon: 'question',
        iconColor: '#2c3e50',
        showCancelButton: true,
        confirmButtonText: 'Áno',
        cancelButtonText: 'Nie',
    }).then((result) => {
        if (result.isConfirmed) {
            window.location.href = "/logout/";
        }
    });
}