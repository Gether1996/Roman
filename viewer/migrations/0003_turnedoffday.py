# Generated by Django 5.0.4 on 2024-08-18 12:11

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('viewer', '0002_reservation'),
    ]

    operations = [
        migrations.CreateModel(
            name='TurnedOffDay',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('worker', models.CharField(max_length=100)),
                ('date', models.DateField()),
                ('whole_day', models.BooleanField()),
                ('time_from', models.TimeField()),
                ('time_to', models.TimeField()),
            ],
        ),
    ]
