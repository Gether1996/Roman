from django.contrib import admin
from .models import GalleryPhoto, VoucherPhoto

@admin.register(GalleryPhoto)
class PhotoAdmin(admin.ModelAdmin):
    list_display = ('photo', 'id')


@admin.register(VoucherPhoto)
class VoucherAdmin(admin.ModelAdmin):
    list_display = ('photo', 'id')
