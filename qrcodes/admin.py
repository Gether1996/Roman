from django.contrib import admin
from django.utils.html import format_html

from .models import PaymentQRCode


@admin.register(PaymentQRCode)
class PaymentQRCodeAdmin(admin.ModelAdmin):
    list_display = (
        'title',
        'beneficiary_name',
        'iban',
        'amount',
        'currency',
        'variable_symbol',
        'is_active',
        'qr_preview_thumb',
        'updated_at',
    )
    list_filter = ('is_active', 'currency', 'updated_at')
    search_fields = ('title', 'beneficiary_name', 'iban', 'variable_symbol', 'payment_note')
    ordering = ('title',)
    readonly_fields = (
        'admin_instructions',
        'when_qr_is_created',
        'qr_code_preview',
        'pay_by_square_payload',
        'created_at',
        'updated_at',
    )
    fieldsets = (
        ('Návod pre administrátora', {
            'fields': ('admin_instructions', 'when_qr_is_created'),
            'description': 'Túto časť si prečítajte pred prvým vytvorením QR kódu.',
        }),
        ('Základné údaje', {
            'fields': ('title', 'is_active', 'beneficiary_name', 'iban', 'swift'),
            'description': 'Najprv vyplňte povinné údaje o príjemcovi platby.',
        }),
        ('Údaje o platbe', {
            'fields': ('amount', 'currency', 'variable_symbol', 'constant_symbol', 'specific_symbol', 'due_date', 'payment_note'),
            'description': 'Sem patria údaje, ktoré sa majú zákazníkovi automaticky predvyplniť v bankovej aplikácii.',
        }),
        ('Doplňujúce údaje o príjemcovi', {
            'classes': ('collapse',),
            'fields': ('beneficiary_address_1', 'beneficiary_address_2'),
            'description': 'Tieto polia sú nepovinné. Vyplňte ich len vtedy, ak chcete mať pri platbe doplnenú aj adresu.',
        }),
        ('Vygenerovaný QR kód', {
            'fields': ('qr_code_preview', 'pay_by_square_payload'),
            'description': 'QR kód a technický PAY by square payload sa zobrazia po prvom uložení záznamu.',
        }),
        ('Systémové informácie', {
            'classes': ('collapse',),
            'fields': ('created_at', 'updated_at'),
        }),
    )

    def admin_instructions(self, obj):
        return format_html(
            """
            <div style="max-width:62rem;line-height:1.6;">
              <p><strong>Na čo táto sekcia slúži:</strong> v tejto sekcii si vytvoríte QR kód na platbu. Zákazník ho potom naskenuje vo svojej bankovej aplikácii a údaje sa mu predvyplnia automaticky.</p>
              <p><strong>Ako postupovať krok za krokom:</strong></p>
              <ol>
                <li>Vyplňte <strong>Názov QR kódu</strong>, aby ste sa v administrácii vedeli orientovať.</li>
                <li>Vyplňte <strong>Meno príjemcu alebo firmy</strong> a <strong>IBAN</strong>. Tieto údaje sú najdôležitejšie.</li>
                <li>Zadajte <strong>Sumu</strong>, ktorú má zákazník zaplatiť.</li>
                <li>Ak používate párovanie platieb, doplňte <strong>Variabilný symbol</strong>. Ostatné symboly sú nepovinné.</li>
                <li>Ak chcete, doplňte <strong>Poznámku k platbe</strong> a prípadne <strong>Dátum splatnosti</strong>.</li>
                <li>Záznam <strong>uložte</strong>. Až po uložení sa v spodnej časti zobrazí QR kód.</li>
                <li>Hotový QR kód následne môžete použiť tam, kde ho potrebujete zobraziť alebo odovzdať zákazníkovi.</li>
              </ol>
              <p><strong>Povinné polia:</strong> Názov QR kódu, Meno príjemcu alebo firmy, IBAN, Suma.</p>
              <p><strong>Odporúčané polia:</strong> Variabilný symbol, Poznámka k platbe, SWIFT pri zahraničných účtoch.</p>
              <p><strong>Nepovinné polia:</strong> Konštantný symbol, Špecifický symbol, Adresa príjemcu, Dátum splatnosti.</p>
            </div>
            """
        )

    admin_instructions.short_description = 'Ako vytvoriť QR kód'

    def when_qr_is_created(self, obj):
        return format_html(
            """
            <div style="max-width:62rem;line-height:1.6;">
              <p><strong>Kedy sa QR kód vytvorí:</strong> QR kód sa vygeneruje automaticky po prvom uložení formulára, ak sú vyplnené povinné údaje.</p>
              <p><strong>Čo uvidíte po uložení:</strong> v sekcii <em>Vygenerovaný QR kód</em> sa zobrazí náhľad QR kódu a technický text, z ktorého bol vytvorený.</p>
              <p><strong>Ak sa QR kód nezobrazí:</strong> najčastejšie chýba IBAN alebo suma, prípadne ešte nebol formulár uložený.</p>
              <p><strong>Ako ho používať:</strong> zákazník otvorí bankovú aplikáciu, zvolí skenovanie QR kódu a aplikácia mu predvyplní platobné údaje.</p>
            </div>
            """
        )

    when_qr_is_created.short_description = 'Kedy sa QR kód vytvorí a ako ho používať'

    def qr_preview_thumb(self, obj):
        if not obj.pk:
            return 'Najprv uložte'
        qr_code = obj.get_qr_code_base64()
        if not qr_code:
            return 'Nedostupné'
        return format_html(
            '<img src="data:image/png;base64,{}" alt="QR kód" style="width:56px;height:56px;border-radius:8px;" />',
            qr_code,
        )

    qr_preview_thumb.short_description = 'QR'

    def qr_code_preview(self, obj):
        if not obj.pk:
            return 'QR kód sa zobrazí po prvom uložení záznamu.'
        qr_code = obj.get_qr_code_base64()
        if not qr_code:
            return 'QR kód sa zatiaľ nepodarilo vytvoriť.'
        return format_html(
            '<img src="data:image/png;base64,{}" alt="QR kód" style="width:220px;height:220px;border-radius:16px;padding:10px;background:#fff;border:1px solid rgba(0,0,0,0.08);" />',
            qr_code,
        )

    qr_code_preview.short_description = 'Náhľad QR kódu'

    def pay_by_square_payload(self, obj):
        if not obj.pk:
            return 'Technický PAY by square payload sa zobrazí po uložení.'
        payload = obj.get_pay_by_square_payload()
        if not payload:
            return 'Payload sa zatiaľ nepodarilo vytvoriť.'
        return format_html(
            '<div style="max-width:48rem;overflow-wrap:anywhere;font-family:monospace;font-size:12px;line-height:1.5;">{}</div>',
            payload,
        )

    pay_by_square_payload.short_description = 'Technický PAY by square payload'
