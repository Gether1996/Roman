from django.shortcuts import render
from django.utils.translation import activate
from viewer.models import GalleryPhoto, VoucherPhoto, Reservation
from accounts.models import CustomUser
from django.utils.translation import gettext_lazy as _
from django.http import JsonResponse


def switch_language(request, language_code):
    if request.method == 'POST':
        activate(language_code)
        request.session['django_language'] = language_code
        return JsonResponse({"status": "success"})
    return JsonResponse({"status": "error"})