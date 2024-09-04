from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=30)
    surname = models.CharField(max_length=30)
    phone_number = models.CharField(max_length=30, default=None, blank=True, null=True)

    # Set username to be non-unique
    username = models.CharField(max_length=30, unique=False)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name', 'surname', 'username']