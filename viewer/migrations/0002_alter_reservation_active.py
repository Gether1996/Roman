# Generated by Django 5.0.4 on 2024-08-21 16:14

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('viewer', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='reservation',
            name='active',
            field=models.BooleanField(default=False),
        ),
    ]
