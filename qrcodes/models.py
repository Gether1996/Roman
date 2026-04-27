import base64
from io import BytesIO

from django.db import models

import qrcode

try:
    import pay_by_square
except ImportError:  # pragma: no cover - dependency is required in production
    pay_by_square = None


class PaymentQRCode(models.Model):
    title = models.CharField(
        'Názov QR kódu',
        max_length=120,
        help_text='Interný názov v administrácii, napríklad Permanentka, Darčeková poukážka alebo Záloha.',
    )
    beneficiary_name = models.CharField(
        'Meno príjemcu alebo firmy',
        max_length=150,
        help_text='Tento názov sa zobrazí pri platbe. Odporúča sa uviesť obchodné meno alebo meno účtu.',
    )
    iban = models.CharField(
        'IBAN',
        max_length=34,
        help_text='Povinné pole. Zadajte IBAN účtu, na ktorý má zákazník zaplatiť.',
    )
    swift = models.CharField(
        'SWIFT / BIC',
        max_length=11,
        blank=True,
        help_text='Odporúčané hlavne pri zahraničných účtoch alebo ak to vyžaduje vaša banka.',
    )
    amount = models.DecimalField(
        'Suma',
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text='Povinné pole. Suma, ktorá sa predvyplní po naskenovaní QR kódu.',
    )
    currency = models.CharField(
        'Mena',
        max_length=3,
        default='EUR',
        help_text='Bežne nechajte EUR.',
    )
    variable_symbol = models.CharField(
        'Variabilný symbol',
        max_length=10,
        blank=True,
        help_text='Odporúčané pri párovaní platieb. Ak ho nepoužívate, nechajte prázdne.',
    )
    constant_symbol = models.CharField(
        'Konštantný symbol',
        max_length=4,
        blank=True,
        help_text='Vyplňte len vtedy, ak ho reálne používate.',
    )
    specific_symbol = models.CharField(
        'Špecifický symbol',
        max_length=10,
        blank=True,
        help_text='Nepovinné pole pre doplnkové párovanie platieb.',
    )
    payment_note = models.CharField(
        'Poznámka k platbe',
        max_length=140,
        blank=True,
        help_text='Odporúčané. Napríklad Permanentka, Poukážka alebo názov služby.',
    )
    beneficiary_address_1 = models.CharField(
        'Adresa príjemcu - riadok 1',
        max_length=70,
        blank=True,
        help_text='Nepovinné. Môžete uviesť ulicu a číslo.',
    )
    beneficiary_address_2 = models.CharField(
        'Adresa príjemcu - riadok 2',
        max_length=70,
        blank=True,
        help_text='Nepovinné. Môžete uviesť PSČ a mesto.',
    )
    due_date = models.DateField(
        'Dátum splatnosti',
        blank=True,
        null=True,
        help_text='Nepovinné. Vyplňte len ak chcete zákazníkovi predvyplniť splatnosť.',
    )
    is_active = models.BooleanField(
        'Aktívny',
        default=True,
        help_text='Ak pole odškrtnete, záznam zostane uložený, ale budete ho vedieť odlíšiť ako neaktívny.',
    )
    created_at = models.DateTimeField('Vytvorené', auto_now_add=True)
    updated_at = models.DateTimeField('Naposledy upravené', auto_now=True)

    class Meta:
        ordering = ('title',)
        verbose_name = 'Platobný QR kód'
        verbose_name_plural = 'Platobné QR kódy'

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
