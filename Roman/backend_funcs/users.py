from django.contrib.auth.hashers import make_password
from django.http import JsonResponse
from django.contrib.auth import login, authenticate
import json
from django.contrib.auth import logout as django_logout
from django.shortcuts import redirect
from accounts.models import CustomUser
from viewer.models import AlreadyMadeReservation
from django.utils.translation import gettext_lazy as _
import re


def login_api(request):
    if request.method == 'POST':
        json_data = json.loads(request.body.decode('utf-8'))
        user_in_db_exists = CustomUser.objects.filter(email=json_data['email']).exists()
        if user_in_db_exists:
            user = authenticate(request, email=json_data['email'], password=json_data['password'])
            if user is not None:
                login(request, user)
                return JsonResponse({'status': 'success', 'message': _('Prihlásenie úspešné.')})
            else:
                return JsonResponse({'status': 'error', 'message': _('Nesprávne heslo.')})
        else:
            return JsonResponse({'status': 'error', 'message': _('Užívateľ s týmto emailom neexistuje.')})
    return JsonResponse({'status': 'error', 'message': _('Zlý request')})


def logout(request):
    django_logout(request)
    return redirect('homepage')


def registration(request):
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
                return JsonResponse({'status': 'error', 'message': _('Email už existuje.')})

            user = CustomUser.objects.create(
                name=name,
                surname=surname,
                email=email,
                password=make_password(password),
                phone_number=phone_number,
            )

            login(request, user)
            return JsonResponse({'status': 'success', 'message': _('Registrácia úspešná - prihlasujem.')})

        except Exception as e:
            return JsonResponse({'status': 'error', 'message': f'{e}'})

    return JsonResponse({'status': 'error', 'message': _('Zlý request')})


def delete_saved_person(request):
    if request.method == 'DELETE':
        json_data = json.loads(request.body.decode('utf-8'))

        saved_person = AlreadyMadeReservation.objects.get(id=int(json_data['id']))
        saved_person.delete()
        return JsonResponse({'status': 'success'})
    return JsonResponse({'status': 'error'})