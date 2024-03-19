from django.db.models import *

class Photo(Model):
    photo = ImageField(upload_to='static/images/')