from django.shortcuts import render
from django.utils.translation import activate
from django.http import JsonResponse
from viewer.models import GalleryPhoto, VoucherPhoto, Reservation
from accounts.models import CustomUser
from django.utils.translation import gettext_lazy as _