from django.db.models import *
from accounts.models import CustomUser

class GalleryPhoto(Model):
    photo = ImageField(upload_to='static/images/')


class VoucherPhoto(Model):
    photo = ImageField(upload_to='static/images/')


class Reservation(Model):
    user = ForeignKey(CustomUser, on_delete=CASCADE, default=None, blank=True, null=True)
    name_surname = CharField(max_length=150)
    email = EmailField()
    phone_number = CharField(max_length=20)
    datetime_from = DateTimeField()
    datetime_to = DateTimeField()
    active = BooleanField(default=True)
    worker = CharField(max_length=100)
    status = CharField(max_length=50)
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)
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
        return f'{time_from} - {time_to}'

    def get_created_at_string(self):
        """Returns the created_at timestamp in DD.MM.YYYY HH:MM:SS format."""
        return self.created_at.strftime('%d.%m.%Y %H:%M:%S')