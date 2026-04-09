from django.contrib.auth.hashers import make_password
from django.http import JsonResponse
from django.contrib.auth import login, authenticate
import json
from django.contrib.auth import logout as django_logout
from django.shortcuts import redirect
from accounts.models import CustomUser
from viewer.models import AlreadyMadeReservation
from django.utils.translation import gettext_lazy as _
from django.utils.translation import activate
import re


def login_api(request):
    activate(request.session.get('django_language', 'sk'))
    if request.method == 'POST':
        json_data = json.loads(request.body.decode('utf-8'))
        user_in_db_exists = CustomUser.objects.filter(email=json_data['email']).exists()
        if user_in_db_exists:
            user = authenticate(request, email=json_data['email'], password=json_data['password'])
            if user is not None:
                login(request, user)
                return JsonResponse({'status': 'success', 'message_sk': 'Prihlásenie úspešné.', 'message_en': 'Login successful.'})
            else:
                return JsonResponse({'status': 'error', 'message_sk': 'Nesprávne heslo.', 'message_en': 'Incorrect password.'}, status=400)
        else:
            return JsonResponse({'status': 'error', 'message_sk': 'Užívateľ s týmto emailom neexistuje.', 'message_en': 'No user with this email exists.'}, status=400)
    return JsonResponse({'status': 'error', 'message_sk': 'Zlý request.', 'message_en': 'Bad request.'}, status=405)


def logout(request):
    activate(request.session.get('django_language', 'sk'))
    django_logout(request)
    return redirect('homepage')


def registration(request):
    activate(request.session.get('django_language', 'sk'))
    if request.method == 'POST':
        try:
            json_data = json.loads(request.body.decode('utf-8'))

            name = json_data.get('name')
            surname = json_data.get('surname')
            email = json_data.get('email')
            password = json_data.get('password')
            phone_number = json_data.get('phone_number')

            # Check if the user already exists
            if CustomUser.objects.filter(email=email).exists():
                return JsonResponse({'status': 'error', 'message_sk': 'Email už existuje.', 'message_en': 'This email is already registered.'}, status=400)

            user = CustomUser.objects.create(
                name=name,
                surname=surname,
                email=email,
                password=make_password(password),
                phone_number=phone_number,
            )

            login(request, user)
            return JsonResponse({'status': 'success', 'message_sk': 'Registrácia úspešná.', 'message_en': 'Registration successful.'})

        except Exception as e:
            return JsonResponse({'status': 'error', 'message_sk': str(e), 'message_en': str(e)}, status=500)

    return JsonResponse({'status': 'error', 'message_sk': 'Zlý request.', 'message_en': 'Bad request.'}, status=405)


def delete_saved_person(request):
    activate(request.session.get('django_language', 'sk'))
    if request.method == 'DELETE':
        json_data = json.loads(request.body.decode('utf-8'))

        saved_person = AlreadyMadeReservation.objects.get(id=int(json_data['id']))
        saved_person.delete()
        return JsonResponse({'status': 'success'})
    return JsonResponse({'status': 'error'})
