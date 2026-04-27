from django.contrib import admin
from django.utils.html import format_html

from .models import GalleryPhoto, VoucherPhoto, Reservation, TurnedOffDay, PaymentQRCode

@admin.register(GalleryPhoto)
class PhotoAdmin(admin.ModelAdmin):
    list_display = ('photo', 'id')


@admin.register(VoucherPhoto)
class VoucherAdmin(admin.ModelAdmin):
    list_display = ('photo', 'id')


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = (
        'user', 'name_surname', 'email', 'phone_number', 'datetime_from',
        'datetime_to', 'active', 'worker', 'status', 'created_at', 'updated_at'
    )
    list_filter = ('active', 'status', 'datetime_from', 'datetime_to')
    search_fields = ('name_surname', 'email', 'phone_number', 'worker')
    ordering = ('-created_at',)
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
    list_filter = ('worker', 'date', 'whole_day', 'time_from', 'time_to')


@admin.register(PaymentQRCode)
class PaymentQRCodeAdmin(admin.ModelAdmin):
    list_display = (
        'title', 'beneficiary_name', 'iban', 'amount', 'currency', 'variable_symbol',
        'is_active', 'qr_preview_thumb', 'updated_at'
    )
    list_filter = ('is_active', 'currency', 'updated_at')
    search_fields = ('title', 'beneficiary_name', 'iban', 'variable_symbol', 'payment_note')
    ordering = ('title',)
    readonly_fields = ('qr_code_preview', 'pay_by_square_payload', 'created_at', 'updated_at')
    fieldsets = (
        ('QR Payment Setup', {
            'fields': ('title', 'is_active', 'beneficiary_name', 'iban', 'swift')
        }),
        ('Payment Details', {
            'fields': ('amount', 'currency', 'variable_symbol', 'constant_symbol', 'specific_symbol', 'due_date', 'payment_note')
        }),
        ('Beneficiary Details', {
            'classes': ('collapse',),
            'fields': ('beneficiary_address_1', 'beneficiary_address_2')
        }),
        ('Generated Preview', {
            'fields': ('qr_code_preview', 'pay_by_square_payload'),
            'description': 'After saving, the admin shows the generated PAY by square QR code and raw payload.',
        }),
        ('System Fields', {
            'classes': ('collapse',),
            'fields': ('created_at', 'updated_at')
        }),
    )

    def qr_preview_thumb(self, obj):
        if not obj.pk:
            return 'Save first'
        qr_code = obj.get_qr_code_base64()
        if not qr_code:
            return 'Unavailable'
        return format_html(
            '<img src="data:image/png;base64,{}" alt="QR code" style="width:56px;height:56px;border-radius:8px;" />',
            qr_code,
        )

    qr_preview_thumb.short_description = 'QR'

    def qr_code_preview(self, obj):
        if not obj.pk:
            return 'Save the payment profile to generate the QR code preview.'
        qr_code = obj.get_qr_code_base64()
        if not qr_code:
            return 'QR preview is unavailable.'
        return format_html(
            '<img src="data:image/png;base64,{}" alt="QR code preview" style="width:220px;height:220px;border-radius:16px;padding:10px;background:#fff;border:1px solid rgba(0,0,0,0.08);" />',
            qr_code,
        )

    qr_code_preview.short_description = 'QR code preview'

    def pay_by_square_payload(self, obj):
        if not obj.pk:
            return 'Save the payment profile to generate the PAY by square payload.'
        payload = obj.get_pay_by_square_payload()
        if not payload:
            return 'Payload is unavailable.'
        return format_html(
            '<div style="max-width:48rem;overflow-wrap:anywhere;font-family:monospace;font-size:12px;line-height:1.5;">{}</div>',
            payload,
        )

    pay_by_square_payload.short_description = 'PAY by square payload'
