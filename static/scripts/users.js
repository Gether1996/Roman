function login() {
    const t = {
        title: isEnglish ? 'Login' : 'Prihlásenie',
        subtitle: isEnglish ? 'Welcome back!' : 'Vitajte späť!',
        emailPlaceholder: 'Email',
        passwordPlaceholder: isEnglish ? 'Password' : 'Heslo',
        showPassword: isEnglish ? 'Show password' : 'Ukázať heslo',
        hidePassword: isEnglish ? 'Hide password' : 'Skryť heslo',
        confirmText: isEnglish ? 'Login' : 'Prihlásiť',
        cancelText: isEnglish ? 'Cancel' : 'Zrušiť',
        passwordRequired: isEnglish ? 'Insert password please.' : 'Vložte prosím heslo.',
        emailInvalid: isEnglish ? 'Please enter a valid email address' : 'Prosím, zadajte platnú emailovú adresu'
    };

    Swal.fire({
        title: '',
        html: `
            <div style="text-align: center; padding: 1.5rem 1rem;">
                <!-- Header Icon -->
                <div style="
                    width: 80px;
                    height: 80px;
                    margin: 0 auto 1.5rem;
                    background: linear-gradient(135deg, rgba(0, 128, 255, 0.1) 0%, rgba(0, 128, 255, 0.15) 100%);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 2px solid rgba(0, 128, 255, 0.2);
                ">
                    <i class="fa-solid fa-right-to-bracket" style="font-size: 2rem; color: #0080ff;"></i>
                </div>

                <!-- Title -->
                <h2 style="
                    font-size: 1.75rem;
                    font-weight: 700;
                    color: #2c3e50;
                    margin-bottom: 0.5rem;
                ">${t.title}</h2>
                
                <!-- Subtitle -->
                <p style="
                    font-size: 1rem;
                    color: #6c757d;
                    margin-bottom: 2rem;
                ">${t.subtitle}</p>

                <!-- Email Input -->
                <div style="margin-bottom: 1.5rem; position: relative;">
                    <div style="
                        position: absolute;
                        left: 1rem;
                        top: 50%;
                        transform: translateY(-50%);
                        color: #6c757d;
                        pointer-events: none;
                    ">
                        <i class="fa-solid fa-envelope"></i>
                    </div>
                    <input id="email-login" placeholder="${t.emailPlaceholder}" style="
                        width: 100%;
                        padding: 1rem 1rem 1rem 2.75rem;
                        border: 2px solid #e9ecef;
                        border-radius: 12px;
                        box-sizing: border-box;
                        font-size: 1rem;
                        transition: all 0.3s ease;
                        background: white;
                    " onfocus="this.style.borderColor='#0080ff'; this.style.boxShadow='0 4px 12px rgba(0, 128, 255, 0.15)'; this.previousElementSibling.querySelector('i').style.color='#0080ff'" onblur="this.style.borderColor='#e9ecef'; this.style.boxShadow='none'; this.previousElementSibling.querySelector('i').style.color='#6c757d'">
                </div>

                <!-- Password Input -->
                <div style="margin-bottom: 1.5rem; position: relative;">
                    <div style="
                        position: absolute;
                        left: 1rem;
                        top: 50%;
                        transform: translateY(-50%);
                        color: #6c757d;
                        pointer-events: none;
                    ">
                        <i class="fa-solid fa-lock"></i>
                    </div>
                    <input id="password" type="password" placeholder="${t.passwordPlaceholder}" style="
                        width: 100%;
                        padding: 1rem 3.5rem 1rem 2.75rem;
                        border: 2px solid #e9ecef;
                        border-radius: 12px;
                        box-sizing: border-box;
                        font-size: 1rem;
                        transition: all 0.3s ease;
                        background: white;
                    " onfocus="this.style.borderColor='#0080ff'; this.style.boxShadow='0 4px 12px rgba(0, 128, 255, 0.15)'; this.previousElementSibling.querySelector('i').style.color='#0080ff'" onblur="this.style.borderColor='#e9ecef'; this.style.boxShadow='none'; this.previousElementSibling.querySelector('i').style.color='#6c757d'">
                    <i class="toggle-password fas fa-eye" id="toggle-password-login" title="${t.showPassword}" style="
                        position: absolute;
                        right: 1rem;
                        top: 50%;
                        transform: translateY(-50%);
                        cursor: pointer;
                        color: #6c757d;
                        transition: color 0.3s ease;
                        margin: 0;
                    " onmouseover="this.style.color='#0080ff'" onmouseout="this.style.color='#6c757d'"></i>
                </div>
            </div>
        `,
        width: 550,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: `<i class="fa-solid fa-right-to-bracket" style="margin-right: 0.5rem;"></i>${t.confirmText}`,
        cancelButtonText: t.cancelText,
        confirmButtonColor: '#0080ff',
        cancelButtonColor: '#6c757d',
        customClass: {
            popup: 'login-modal',
            confirmButton: 'btn-modal-confirm',
            cancelButton: 'btn-modal-cancel'
        },
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
                Swal.showValidationMessage(t.passwordRequired);
                return false;
            }

            if (!email || email.indexOf('@') === -1) {
                Swal.showValidationMessage(t.emailInvalid);
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
    const t = {
        title: isEnglish ? 'Registration' : 'Registrácia',
        subtitle: isEnglish ? 'Create your account' : 'Vytvorte si účet',
        namePlaceholder: isEnglish ? 'Name' : 'Meno',
        surnamePlaceholder: isEnglish ? 'Surname' : 'Priezvisko',
        emailPlaceholder: 'Email',
        phonePlaceholder: isEnglish ? 'Phone' : 'Telefón',
        passwordPlaceholder: isEnglish ? 'Password' : 'Heslo',
        confirmPasswordPlaceholder: isEnglish ? 'Confirm password' : 'Potvrdiť heslo',
        showPassword: isEnglish ? 'Show password' : 'Ukázať heslo',
        hidePassword: isEnglish ? 'Hide password' : 'Skryť heslo',
        confirmText: isEnglish ? 'Register' : 'Zaregistrovať',
        cancelText: isEnglish ? 'Cancel' : 'Zrušiť',
        emailInvalid: isEnglish ? 'Invalid email format' : 'Nesprávny formát emailu.',
        passwordMismatch: isEnglish ? 'Passwords do not match' : 'Heslá sa nezhodujú.',
        allFieldsRequired: isEnglish ? 'All fields must be filled.' : 'Všetky polia musia byť vyplnené.',
        passwordMinLength: isEnglish ? 'Password must consist out of 8 characters minimum.' : 'Heslo musí obsahovať aspoň 8 znakov.'
    };

    Swal.fire({
        title: '',
        html: `
            <div style="text-align: center; padding: 1.5rem 1rem;">
                <!-- Header Icon -->
                <div style="
                    width: 80px;
                    height: 80px;
                    margin: 0 auto 1.5rem;
                    background: linear-gradient(135deg, rgba(0, 128, 255, 0.1) 0%, rgba(0, 128, 255, 0.15) 100%);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 2px solid rgba(0, 128, 255, 0.2);
                ">
                    <i class="fa-solid fa-user-plus" style="font-size: 2rem; color: #0080ff;"></i>
                </div>

                <!-- Title -->
                <h2 style="
                    font-size: 1.75rem;
                    font-weight: 700;
                    color: #2c3e50;
                    margin-bottom: 0.5rem;
                ">${t.title}</h2>
                
                <!-- Subtitle -->
                <p style="
                    font-size: 1rem;
                    color: #6c757d;
                    margin-bottom: 2rem;
                ">${t.subtitle}</p>

                <!-- Name Input -->
                <div style="margin-bottom: 1rem; position: relative;">
                    <div style="
                        position: absolute;
                        left: 1rem;
                        top: 50%;
                        transform: translateY(-50%);
                        color: #6c757d;
                        pointer-events: none;
                    ">
                        <i class="fa-solid fa-user"></i>
                    </div>
                    <input id="name" placeholder="${t.namePlaceholder}" style="
                        width: 100%;
                        padding: 1rem 1rem 1rem 2.75rem;
                        border: 2px solid #e9ecef;
                        border-radius: 12px;
                        box-sizing: border-box;
                        font-size: 1rem;
                        transition: all 0.3s ease;
                        background: white;
                    " onfocus="this.style.borderColor='#0080ff'; this.style.boxShadow='0 4px 12px rgba(0, 128, 255, 0.15)'; this.previousElementSibling.querySelector('i').style.color='#0080ff'" onblur="this.style.borderColor='#e9ecef'; this.style.boxShadow='none'; this.previousElementSibling.querySelector('i').style.color='#6c757d'">
                </div>

                <!-- Surname Input -->
                <div style="margin-bottom: 1rem; position: relative;">
                    <div style="
                        position: absolute;
                        left: 1rem;
                        top: 50%;
                        transform: translateY(-50%);
                        color: #6c757d;
                        pointer-events: none;
                    ">
                        <i class="fa-solid fa-user"></i>
                    </div>
                    <input id="surname" placeholder="${t.surnamePlaceholder}" style="
                        width: 100%;
                        padding: 1rem 1rem 1rem 2.75rem;
                        border: 2px solid #e9ecef;
                        border-radius: 12px;
                        box-sizing: border-box;
                        font-size: 1rem;
                        transition: all 0.3s ease;
                        background: white;
                    " onfocus="this.style.borderColor='#0080ff'; this.style.boxShadow='0 4px 12px rgba(0, 128, 255, 0.15)'; this.previousElementSibling.querySelector('i').style.color='#0080ff'" onblur="this.style.borderColor='#e9ecef'; this.style.boxShadow='none'; this.previousElementSibling.querySelector('i').style.color='#6c757d'">
                </div>

                <!-- Email Input -->
                <div style="margin-bottom: 1rem; position: relative;">
                    <div style="
                        position: absolute;
                        left: 1rem;
                        top: 50%;
                        transform: translateY(-50%);
                        color: #6c757d;
                        pointer-events: none;
                    ">
                        <i class="fa-solid fa-envelope"></i>
                    </div>
                    <input id="email" placeholder="${t.emailPlaceholder}" style="
                        width: 100%;
                        padding: 1rem 1rem 1rem 2.75rem;
                        border: 2px solid #e9ecef;
                        border-radius: 12px;
                        box-sizing: border-box;
                        font-size: 1rem;
                        transition: all 0.3s ease;
                        background: white;
                    " onfocus="this.style.borderColor='#0080ff'; this.style.boxShadow='0 4px 12px rgba(0, 128, 255, 0.15)'; this.previousElementSibling.querySelector('i').style.color='#0080ff'" onblur="this.style.borderColor='#e9ecef'; this.style.boxShadow='none'; this.previousElementSibling.querySelector('i').style.color='#6c757d'">
                </div>

                <!-- Phone Input -->
                <div style="margin-bottom: 1rem; position: relative;">
                    <div style="
                        position: absolute;
                        left: 1rem;
                        top: 50%;
                        transform: translateY(-50%);
                        color: #6c757d;
                        pointer-events: none;
                    ">
                        <i class="fa-solid fa-phone"></i>
                    </div>
                    <input type="number" id="phone_number" placeholder="${t.phonePlaceholder}" style="
                        width: 100%;
                        padding: 1rem 1rem 1rem 2.75rem;
                        border: 2px solid #e9ecef;
                        border-radius: 12px;
                        box-sizing: border-box;
                        font-size: 1rem;
                        transition: all 0.3s ease;
                        background: white;
                    " onfocus="this.style.borderColor='#0080ff'; this.style.boxShadow='0 4px 12px rgba(0, 128, 255, 0.15)'; this.previousElementSibling.querySelector('i').style.color='#0080ff'" onblur="this.style.borderColor='#e9ecef'; this.style.boxShadow='none'; this.previousElementSibling.querySelector('i').style.color='#6c757d'">
                </div>

                <!-- Password Input -->
                <div style="margin-bottom: 1rem; position: relative;">
                    <div style="
                        position: absolute;
                        left: 1rem;
                        top: 50%;
                        transform: translateY(-50%);
                        color: #6c757d;
                        pointer-events: none;
                    ">
                        <i class="fa-solid fa-lock"></i>
                    </div>
                    <input id="password1" type="password" placeholder="${t.passwordPlaceholder}" autocomplete="new-password" style="
                        width: 100%;
                        padding: 1rem 3.5rem 1rem 2.75rem;
                        border: 2px solid #e9ecef;
                        border-radius: 12px;
                        box-sizing: border-box;
                        font-size: 1rem;
                        transition: all 0.3s ease;
                        background: white;
                    " onfocus="this.style.borderColor='#0080ff'; this.style.boxShadow='0 4px 12px rgba(0, 128, 255, 0.15)'; this.previousElementSibling.querySelector('i').style.color='#0080ff'" onblur="this.style.borderColor='#e9ecef'; this.style.boxShadow='none'; this.previousElementSibling.querySelector('i').style.color='#6c757d'">
                    <i class="toggle-password fas fa-eye" id="toggle-password-register" title="${t.showPassword}" style="
                        position: absolute;
                        right: 1rem;
                        top: 50%;
                        transform: translateY(-50%);
                        cursor: pointer;
                        color: #6c757d;
                        transition: color 0.3s ease;
                        margin: 0;
                    " onmouseover="this.style.color='#0080ff'" onmouseout="this.style.color='#6c757d'"></i>
                </div>

                <!-- Confirm Password Input -->
                <div style="margin-bottom: 1.5rem; position: relative;">
                    <div style="
                        position: absolute;
                        left: 1rem;
                        top: 50%;
                        transform: translateY(-50%);
                        color: #6c757d;
                        pointer-events: none;
                    ">
                        <i class="fa-solid fa-lock"></i>
                    </div>
                    <input id="password2" type="password" placeholder="${t.confirmPasswordPlaceholder}" autocomplete="new-password" style="
                        width: 100%;
                        padding: 1rem 1rem 1rem 2.75rem;
                        border: 2px solid #e9ecef;
                        border-radius: 12px;
                        box-sizing: border-box;
                        font-size: 1rem;
                        transition: all 0.3s ease;
                        background: white;
                    " onfocus="this.style.borderColor='#0080ff'; this.style.boxShadow='0 4px 12px rgba(0, 128, 255, 0.15)'; this.previousElementSibling.querySelector('i').style.color='#0080ff'" onblur="this.style.borderColor='#e9ecef'; this.style.boxShadow='none'; this.previousElementSibling.querySelector('i').style.color='#6c757d'">
                </div>
            </div>
        `,
        width: 550,
        confirmButtonText: `<i class="fa-solid fa-user-plus" style="margin-right: 0.5rem;"></i>${t.confirmText}`,
        cancelButtonText: t.cancelText,
        showCancelButton: true,
        confirmButtonColor: '#0080ff',
        cancelButtonColor: '#6c757d',
        customClass: {
            popup: 'registration-modal',
            confirmButton: 'btn-modal-confirm',
            cancelButton: 'btn-modal-cancel'
        },
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
                Swal.showValidationMessage(t.emailInvalid);
                return false;
            }

            if (password !== confirmPassword) {
                Swal.showValidationMessage(t.passwordMismatch);
                return false;
            }

            if (!name || !surname || !email || !phone_number || !password || !confirmPassword) {
                Swal.showValidationMessage(t.allFieldsRequired);
                return false;
            }

            if (password.length <= 7) {
                Swal.showValidationMessage(t.passwordMinLength);
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
    const t = {
        title: isEnglish ? 'Logout?' : 'Odhlásiť?',
        subtitle: isEnglish ? 'Are you sure you want to logout?' : 'Naozaj sa chcete odhlásiť?',
        confirmText: isEnglish ? 'Yes, logout' : 'Áno, odhlásiť',
        cancelText: isEnglish ? 'Cancel' : 'Zrušiť'
    };

    Swal.fire({
        title: '',
        html: `
            <div style="text-align: center; padding: 1.5rem 1rem;">
                <!-- Header Icon -->
                <div style="
                    width: 80px;
                    height: 80px;
                    margin: 0 auto 1.5rem;
                    background: linear-gradient(135deg, rgba(220, 53, 69, 0.1) 0%, rgba(220, 53, 69, 0.15) 100%);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 2px solid rgba(220, 53, 69, 0.2);
                ">
                    <i class="fa-solid fa-right-from-bracket" style="font-size: 2rem; color: #dc3545;"></i>
                </div>

                <!-- Title -->
                <h2 style="
                    font-size: 1.75rem;
                    font-weight: 700;
                    color: #2c3e50;
                    margin-bottom: 0.5rem;
                ">${t.title}</h2>
                
                <!-- Subtitle -->
                <p style="
                    font-size: 1rem;
                    color: #6c757d;
                    margin-bottom: 1rem;
                ">${t.subtitle}</p>
            </div>
        `,
        width: 500,
        showCancelButton: true,
        confirmButtonText: `<i class="fa-solid fa-right-from-bracket" style="margin-right: 0.5rem;"></i>${t.confirmText}`,
        cancelButtonText: t.cancelText,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        customClass: {
            popup: 'logout-modal',
            confirmButton: 'btn-modal-confirm',
            cancelButton: 'btn-modal-cancel'
        }
    }).then((result) => {
        if (result.isConfirmed) {
            window.location.href = "/logout/";
        }
    });
}