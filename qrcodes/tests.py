from django.test import TestCase

from qrcodes.models import PaymentQRCode


class PaymentQRCodeModelTests(TestCase):
    def test_generates_payload_and_qr_preview(self):
        payment = PaymentQRCode.objects.create(
            title='Permanentka',
            beneficiary_name='Masaze Vlcince',
            iban='SK12 8330 0000 0091 1111 1118',
            swift='FIOZSKBAXXX',
            amount='49.90',
            variable_symbol='20260001',
            constant_symbol='0308',
            specific_symbol='1',
            payment_note='Permanentka',
        )

        payload = payment.get_pay_by_square_payload()
        qr_base64 = payment.get_qr_code_base64()

        self.assertEqual(payment.iban, 'SK1283300000009111111118')
        self.assertEqual(payment.variable_symbol, '20260001')
        self.assertTrue(payload)
        self.assertTrue(qr_base64)
