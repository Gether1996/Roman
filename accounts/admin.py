from django.contrib import admin
from django.contrib.auth.models import Group
from .models import CustomUser

admin.site.unregister(Group)

@admin.register(CustomUser)
class VoucherAdmin(admin.ModelAdmin):
    list_display = ('email', 'name', 'surname', 'username', 'phone_number')