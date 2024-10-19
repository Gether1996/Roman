from django.db.models import *
from accounts.models import CustomUser
from datetime import datetime, timedelta

def adjustment_hours():
    current_time = datetime.now()
    is_summer_time = current_time.dst() != timedelta(0)
    adjustment_hours = 2 if is_summer_time else 1
    return adjustment_hours

class GalleryPhoto(Model):
    photo = ImageField(upload_to='static/images/')


class VoucherPhoto(Model):
    photo = ImageField(upload_to='static/images/')


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
        return f'{time_from} - {time_to}'

    def get_created_at_string(self):
        """Returns the created_at timestamp in DD.MM.YYYY HH:MM:SS format."""
        return self.created_at.strftime('%d.%m.%Y %H:%M:%S')

    def get_created_at_string_adjusted(self):
        """Returns the created_at timestamp in DD.MM.YYYY HH:MM:SS format."""
        return (self.created_at + timedelta(hours=adjustment_hours())).strftime('%d.%m.%Y %H:%M:%S')

    def get_color(self):
        if not self.active:
            return '#8B0000'
        else:
            if self.worker == "Evka":
                return '#ff1493'
            else:
                return '#007bff'

class AlreadyMadeReservation(Model):
    name_surname = CharField(max_length=150, unique=True)
    email = EmailField(default=None, blank=True, null=True)
    phone_number = CharField(max_length=20, default=None, blank=True, null=True)