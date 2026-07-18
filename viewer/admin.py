from django.contrib import admin
from django.utils.html import format_html

from .models import (
    AlreadyMadeReservation,
    GalleryPhoto,
    Reservation,
    Review,
    TurnedOffDay,
    VoucherPhoto,
)


def _photo_src(photo):
    """Resolve the URL of a stored photo.

    Legacy entries are stored as 'static/images/foo.jpg' (served from /static/),
    while newly uploaded ones live under MEDIA (photo.url). Handle both.
    """
    if not photo:
        return ''
    value = str(photo)
    if value.startswith('static/'):
        return '/' + value
    try:
        return photo.url
    except ValueError:
        return value if value.startswith('/') else '/' + value


class ImagePreviewMixin:
    """Adds a small thumbnail (list view) and a large preview (edit form)."""

    def thumbnail(self, obj):
        src = _photo_src(obj.photo)
        if not src:
            return '—'
        return format_html(
            '<img src="{}" loading="lazy" '
            'style="height:56px;width:80px;object-fit:cover;border-radius:6px;'
            'border:1px solid rgba(255,255,255,0.15);background:#fff;" />',
            src,
        )
    thumbnail.short_description = 'Náhľad'

    def preview_large(self, obj):
        src = _photo_src(obj.photo)
        if not src:
            return '—'
        return format_html(
            '<img src="{}" style="max-height:420px;max-width:100%;height:auto;'
            'border-radius:10px;border:1px solid rgba(0,0,0,0.15);background:#fff;" />',
            src,
        )
    preview_large.short_description = 'Náhľad'


@admin.register(GalleryPhoto)
class PhotoAdmin(ImagePreviewMixin, admin.ModelAdmin):
    list_display = ('thumbnail', 'photo', 'id')
    list_display_links = ('thumbnail', 'photo')
    readonly_fields = ('preview_large',)
    fields = ('photo', 'preview_large')


@admin.register(VoucherPhoto)
class VoucherAdmin(ImagePreviewMixin, admin.ModelAdmin):
    list_display = ('thumbnail', 'photo', 'id')
    list_display_links = ('thumbnail', 'photo')
    readonly_fields = ('preview_large',)
    fields = ('photo', 'preview_large')


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = (
        'name_surname', 'worker', 'datetime_from', 'datetime_to',
        'massage_name', 'active', 'status', 'phone_number', 'email', 'created_at'
    )
    list_filter = ('worker', 'active', 'status', 'datetime_from')
    search_fields = ('name_surname', 'email', 'phone_number', 'worker', 'massage_name')
    ordering = ('-datetime_from',)
    date_hierarchy = 'datetime_from'
    list_per_page = 50
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        (None, {
            'fields': ('user', 'name_surname', 'email', 'phone_number', 'datetime_from', 'datetime_to', 'active', 'worker', 'status')
        }),
        ('Additional Info', {
            'classes': ('collapse',),
            'fields': ('special_request', 'personal_note', 'cancellation_reason')
        }),
        ('Timestamps', {
            'classes': ('collapse',),
            'fields': ('created_at', 'updated_at')
        }),
    )

@admin.register(TurnedOffDay)
class TurnedOffDayAdmin(admin.ModelAdmin):
    list_display = (
        'worker', 'date', 'whole_day', 'time_from', 'time_to'
    )
    list_filter = ('worker', 'whole_day', 'date')
    search_fields = ('worker',)
    date_hierarchy = 'date'
    ordering = ('-date',)


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('name_surname', 'worker', 'stars', 'short_message', 'created_at')
    list_filter = ('worker', 'stars', 'created_at')
    search_fields = ('name_surname', 'message', 'worker')
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)

    def short_message(self, obj):
        if not obj.message:
            return '—'
        return (obj.message[:70] + '…') if len(obj.message) > 70 else obj.message
    short_message.short_description = 'Správa'


@admin.register(AlreadyMadeReservation)
class AlreadyMadeReservationAdmin(admin.ModelAdmin):
    list_display = ('name_surname', 'phone_number', 'email')
    search_fields = ('name_surname', 'email', 'phone_number')
    ordering = ('name_surname',)
