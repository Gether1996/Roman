from datetime import datetime
from django.db.models import *
from accounts.models import CustomUser


class GalleryPhoto(Model):
    photo = ImageField(upload_to='images/')
    caption = CharField(max_length=200, blank=True, default='')
    order = IntegerField(default=0)
    is_visible = BooleanField(default=True)

    class Meta:
        ordering = ('order', 'id')
        verbose_name = 'Fotka galérie'
        verbose_name_plural = 'Fotky galérie'

    def __str__(self):
        return f'Fotka #{self.pk}'


class VoucherPhoto(Model):
    photo = ImageField(upload_to='images/')
    caption = CharField(max_length=200, blank=True, default='')
    order = IntegerField(default=0)
    is_visible = BooleanField(default=True)

    class Meta:
        ordering = ('order', 'id')
        verbose_name = 'Poukážka'
        verbose_name_plural = 'Poukážky'

    def __str__(self):
        return f'Poukážka #{self.pk}'


class TurnedOffDay(Model):
    worker = CharField(max_length=100)
    date = DateField()
    whole_day = BooleanField()
    time_from = TimeField(blank=True, null=True)
    time_to = TimeField(blank=True, null=True)

    class Meta:
        verbose_name = 'Deň voľna / obmedzenie'
        verbose_name_plural = 'Dni voľna / obmedzenia'
        ordering = ('-date',)

    def __str__(self):
        return f'{self.worker} – {self.formatted_date()}'

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
    created_at = DateTimeField(default=datetime.now)
    updated_at = DateTimeField(default=datetime.now)
    special_request = CharField(max_length=200, default=None, null=True, blank=True)
    personal_note = CharField(max_length=200, default=None, null=True, blank=True)
    cancellation_reason = CharField(max_length=254, default=None, blank=True, null=True)
    consent_at = DateTimeField(default=None, blank=True, null=True)

    class Meta:
        verbose_name = 'Rezervácia'
        verbose_name_plural = 'Rezervácie'
        ordering = ('-datetime_from',)

    def __str__(self):
        return f'{self.name_surname} – {self.get_date_string()} {self.get_time_range_string()} ({self.worker})'

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
        if self.cancellation_reason or (self.status or '').startswith('Zrušená'):
            return '#9ca3af'  # grey - cancelled (by customer or therapist)
        if not self.active:
            return '#d97706'  # amber - pending approval
        if self.worker == "Evka":
            return '#db2777'  # pink - Evka approved
        return '#0f7e7a'  # teal - Roman approved

class AlreadyMadeReservation(Model):
    name_surname = CharField(max_length=150, unique=True)
    email = EmailField(default=None, blank=True, null=True)
    phone_number = CharField(max_length=20, default=None, blank=True, null=True)

    class Meta:
        verbose_name = 'Uložená osoba'
        verbose_name_plural = 'Uložené osoby'
        ordering = ('name_surname',)

    def __str__(self):
        return self.name_surname


class Review(Model):
    name_surname = CharField(max_length=150)
    worker = CharField(max_length=100)
    message = TextField()
    created_at = DateTimeField(default=datetime.now)
    stars = IntegerField()
    is_visible = BooleanField(default=True)

    class Meta:
        verbose_name = 'Hodnotenie'
        verbose_name_plural = 'Hodnotenia'
        ordering = ('-created_at',)

    def __str__(self):
        return f'{self.name_surname} – {self.stars}★ ({self.worker})'


class SiteContent(Model):
    """Editable website content (texts, prices, therapists, legal pages, ...).

    One row per section; `data` holds JSON text (TextField instead of JSONField
    so it works on every DB backend incl. mysql-connector)."""
    section = CharField(max_length=50, unique=True)
    data = TextField(default='{}')
    updated_at = DateTimeField(default=datetime.now)

    class Meta:
        verbose_name = 'Obsah webu'
        verbose_name_plural = 'Obsah webu'

    def __str__(self):
        return self.section


class SiteContentRevision(Model):
    """Previous versions of a content section so the admin can undo changes."""
    section = CharField(max_length=50, db_index=True)
    data = TextField(default='{}')
    created_at = DateTimeField(default=datetime.now)
    created_by = CharField(max_length=254, blank=True, default='')

    class Meta:
        ordering = ('-created_at', '-id')
        verbose_name = 'Verzia obsahu'
        verbose_name_plural = 'Verzie obsahu'


class MediaAsset(Model):
    """Images uploaded from the admin panel (therapist photos, technique images...)."""
    file = ImageField(upload_to='uploads/')
    name = CharField(max_length=200, blank=True, default='')
    created_at = DateTimeField(default=datetime.now)

    class Meta:
        ordering = ('-created_at',)
        verbose_name = 'Obrázok'
        verbose_name_plural = 'Obrázky'

    def __str__(self):
        return self.name or f'Obrázok #{self.pk}'


class ConfigEntry(Model):
    """System settings (therapists' schedules, booking rules, …).

    Same structure as the former config.ini: section / key / value, so the
    booking logic reads it exactly like before. Imported once from config.ini
    by `python manage.py import_config_ini` (run automatically on deploy).
    """
    section = CharField(max_length=50)
    key = CharField(max_length=80)
    value = TextField(blank=True, default='')
    updated_at = DateTimeField(default=datetime.now)

    class Meta:
        unique_together = ('section', 'key')
        ordering = ('section', 'key')
        verbose_name = 'Systémové nastavenie'
        verbose_name_plural = 'Systémové nastavenia'

    def __str__(self):
        return f'[{self.section}] {self.key}'


class AuditLog(Model):
    """History of all changes (shown in the admin panel: Systém → História zmien)."""
    created_at = DateTimeField(default=datetime.now, db_index=True)
    user = ForeignKey(CustomUser, on_delete=SET_NULL, null=True, blank=True)
    actor = CharField(max_length=200, blank=True, default='')       # name/e-mail snapshot
    actor_type = CharField(max_length=20, default='admin')          # admin / client / visitor / system
    action = CharField(max_length=30, db_index=True)                # create / update / delete / approve / cancel / ...
    area = CharField(max_length=30, db_index=True)                  # reservation / content / schedule / ...
    object_type = CharField(max_length=50, blank=True, default='')
    object_id = CharField(max_length=50, blank=True, default='', db_index=True)
    summary = CharField(max_length=500)
    changes = TextField(blank=True, default='')                     # JSON list [{field, label, old, new}]

    class Meta:
        ordering = ('-created_at', '-id')
        verbose_name = 'Záznam histórie'
        verbose_name_plural = 'História zmien'

    def __str__(self):
        return f'{self.created_at:%d.%m.%Y %H:%M} {self.actor}: {self.summary}'
