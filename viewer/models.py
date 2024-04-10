from django.db.models import *

class GalleryPhoto(Model):
    photo = ImageField(upload_to='static/images/')


class VoucherPhoto(Model):
    photo = ImageField(upload_to='static/images/')