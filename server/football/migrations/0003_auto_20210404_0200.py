# Generated by Django 3.1.7 on 2021-04-04 02:00

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('football', '0002_auto_20210404_0157'),
    ]

    operations = [
        migrations.RenameField(
            model_name='team',
            old_name='finish_place',
            new_name='final_standing',
        ),
    ]
