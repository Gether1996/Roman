import base64
from io import BytesIO

from django.db.models import *

import qrcode

try:
    import pay_by_square
except ImportError:  # pragma: no cover - dependency is required in production
    pay_by_square = None
from accounts.models import CustomUser


class GalleryPhoto(Model):
    photo = ImageField(upload_to='images/')


class VoucherPhoto(Model):
    photo = ImageField(upload_to='images/')


class TurnedOffDay(Model):
    worker = CharField(max_length=100)
    date = DateField()
    whole_day = BooleanField()
    time_from = TimeField(blank=True, null=True)
    time_to = TimeField(blank=True, null=True)

    def formatted_date(self):
        """Returns the date in DD.MM.YYYY format (e.g., '18.08.2024')."""
        return self.date.strftime('%d.%m.%Y')

    def formatted_time_range(self):
        """Returns a string of the time range (HH:MM - HH:MM) if both time_from and time_to are present."""
        if self.time_from and self.time_to:
            return f"{self.time_from.strftime('%H:%M')} - {self.time_to.strftime('%H:%M')}"
        else:
            return f"-"

class Reservation(Model):
    massage_name = CharField(max_length=250, default="Masáž", null=True, blank=True)
    user = ForeignKey(CustomUser, on_delete=CASCADE, default=None, blank=True, null=True)
    name_surname = CharField(max_length=150)
    email = EmailField(default=None, blank=True, null=True)
    phone_number = CharField(max_length=20, default=None, blank=True, null=True)
    datetime_from = DateTimeField()
    datetime_to = DateTimeField()
    active = BooleanField(default=False)
    worker = CharField(max_length=100)
    status = CharField(max_length=50)
    created_at = DateTimeField()
    updated_at = DateTimeField()
    special_request = CharField(max_length=200, default=None, null=True, blank=True)
    personal_note = CharField(max_length=200, default=None, null=True, blank=True)
    cancellation_reason = CharField(max_length=254, default=None, blank=True, null=True)

    def get_date_string(self):
        """Returns the date in DD.MM.YYYY format."""
        return self.datetime_from.strftime('%d.%m.%Y')

    def get_time_range_string(self):
        """Returns the time range in HH:MM - HH:MM format."""
        time_from = self.datetime_from.strftime('%H:%M')
        time_to = self.datetime_to.strftime('%H:%M')
        return f'{time_from}-{time_to}'

    def get_created_at_string(self):
        """Returns the created_at timestamp in DD.MM.YYYY HH:MM:SS format."""
        return self.created_at.strftime('%d.%m.%Y %H:%M:%S')

    def get_color(self):
        if self.cancellation_reason:
            return '#9ca3af'  # grey - cancelled
        if not self.active:
            return '#d97706'  # amber - pending approval
        if self.worker == "Evka":
            return '#db2777'  # pink - Evka approved
        return '#0f7e7a'  # teal - Roman approved

class AlreadyMadeReservation(Model):
    name_surname = CharField(max_length=150, unique=True)
    email = EmailField(default=None, blank=True, null=True)
    phone_number = CharField(max_length=20, default=None, blank=True, null=True)


class Review(Model):
    name_surname = CharField(max_length=150)
    worker = CharField(max_length=100)
    message = TextField()
    created_at = DateTimeField()
    stars = IntegerField()


class PaymentQRCode(Model):
    title = CharField(max_length=120)
    beneficiary_name = CharField(max_length=150)
    iban = CharField(max_length=34)
    swift = CharField(max_length=11, blank=True)
    amount = DecimalField(max_digits=10, decimal_places=2, default=0)
    currency = CharField(max_length=3, default='EUR')
    variable_symbol = CharField(max_length=10, blank=True)
    constant_symbol = CharField(max_length=4, blank=True)
    specific_symbol = CharField(max_length=10, blank=True)
    payment_note = CharField(max_length=140, blank=True)
    beneficiary_address_1 = CharField(max_length=70, blank=True)
    beneficiary_address_2 = CharField(max_length=70, blank=True)
    due_date = DateField(blank=True, null=True)
    is_active = BooleanField(default=True)
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)

    class Meta:
        ordering = ('title',)
        verbose_name = 'Payment QR code'
        verbose_name_plural = 'Payment QR codes'

    def __str__(self):
        return self.title

    def clean(self):
        self.iban = ''.join((self.iban or '').split()).upper()
        self.swift = ''.join((self.swift or '').split()).upper()
        self.currency = (self.currency or 'EUR').upper()
        self.variable_symbol = ''.join((self.variable_symbol or '').split())
        self.constant_symbol = ''.join((self.constant_symbol or '').split())
        self.specific_symbol = ''.join((self.specific_symbol or '').split())

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def get_pay_by_square_payload(self):
        if pay_by_square is None or not self.iban:
            return ''

        return pay_by_square.generate(
            amount=float(self.amount),
            iban=self.iban,
            swift=self.swift,
            date=self.due_date,
            beneficiary_name=self.beneficiary_name,
            currency=self.currency or 'EUR',
            variable_symbol=self.variable_symbol,
            constant_symbol=self.constant_symbol,
            specific_symbol=self.specific_symbol,
            note=self.payment_note,
            beneficiary_address_1=self.beneficiary_address_1,
            beneficiary_address_2=self.beneficiary_address_2,
        )

    def get_qr_code_base64(self):
        payload = self.get_pay_by_square_payload()
        if not payload:
            return ''

        image = qrcode.make(payload)
        buffer = BytesIO()
        image.save(buffer, format='PNG')
        return base64.b64encode(buffer.getvalue()).decode('ascii')
