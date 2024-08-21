function deactivate(reservation_id) {
    Swal.fire({
        text: isEnglish ? "Are you sure? Please provide a reason:" : "Naozaj chcete zrušiť? Prosím, uveďte dôvod:",
        icon: 'warning',
        input: 'text',
        inputPlaceholder: isEnglish ? 'Enter reason here' : 'Zadajte dôvod',
        showCancelButton: true,
        confirmButtonText: isEnglish ? 'Yes' : 'Áno',
        cancelButtonText: isEnglish ? 'Cancel' : 'Zrušiť',
        inputValidator: (value) => {
            if (!value) {
                return isEnglish ? 'You need to provide a reason.' : 'Musíte uviesť dôvod.';
            }
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const reason = result.value;

            fetch(`/deactivate_reservation/`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify({
                    reservation_id: reservation_id,
                    reason: reason
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    Swal.fire({
                        icon: 'success',
                        title: data.message,
                        showConfirmButton: false,
                        showCancelButton: false,
                        timer: 1000,
                    });
                    setTimeout(() => {
                        location.reload();
                    }, 1000);
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: data.message,
                    });
                }
            })
            .catch(error => {
                Swal.fire('Error!', 'An error occurred while deactivating.', 'error');
            });
        }
    });
}
