# Generated by Django 3.2 on 2021-04-13 19:50

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('football', '0008_auto_20210405_0235'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='playerseason',
            options={'ordering': ['-total_points']},
        ),
        migrations.AlterModelOptions(
            name='season',
            options={'ordering': ['-year']},
        ),
    ]
