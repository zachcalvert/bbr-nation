# Generated by Django 3.1.10 on 2021-05-14 05:33

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('bot', '0005_auto_20210510_2207'),
    ]

    operations = [
        migrations.AddField(
            model_name='request',
            name='is_check_in',
            field=models.BooleanField(default=False),
        ),
    ]
