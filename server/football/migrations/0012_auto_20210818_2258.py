# Generated by Django 3.1.13 on 2021-08-18 22:58

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('football', '0011_create_nfl_teams'),
    ]

    operations = [
        migrations.AddField(
            model_name='player',
            name='active',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='player',
            name='stud',
            field=models.BooleanField(default=False),
        ),
    ]
