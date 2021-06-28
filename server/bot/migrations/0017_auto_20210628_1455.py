# Generated by Django 3.1.11 on 2021-06-28 14:55

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('bot', '0016_auto_20210627_2149'),
    ]

    operations = [
        migrations.AlterField(
            model_name='gamecomment',
            name='time',
            field=models.CharField(blank=True, choices=[('START', 'Start'), ('DRAW', 'Draw'), ('CUT', 'Cut'), ('PLAY', 'Play'), ('HAND', 'Hand'), ('CRIB', 'Crib'), ('GAME', 'Game Over')], default='DRAW', max_length=100, null=True),
        ),
    ]
