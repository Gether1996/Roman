from django.shortcuts import render
from django.utils.translation import activate
from django.http import JsonResponse
from viewer.models import GalleryPhoto, VoucherPhoto


def homepage(request):
    language_code = request.session.get('django_language', 'sk')
    photos = GalleryPhoto.objects.all()
    vouchers = VoucherPhoto.objects.all()

    activate(language_code)
    return render(request, 'homepage.html', {'photos': photos, 'vouchers': vouchers})


def switch_language(request, language_code):
    if request.method == 'POST':
        activate(language_code)
        request.session['django_language'] = language_code
        return JsonResponse({"status": "success"})
    return JsonResponse({"status": "error"})