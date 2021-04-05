# Generated by Django 3.1.7 on 2021-04-04 18:09

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('football', '0006_auto_20210404_0446'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='playerseason',
            options={'ordering': ['position_rank']},
        ),
        migrations.AlterModelOptions(
            name='team',
            options={'ordering': ['standing']},
        ),
        migrations.AddField(
            model_name='team',
            name='games_played',
            field=models.IntegerField(default=1),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='team',
            name='points_against',
            field=models.IntegerField(default=1),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='team',
            name='points_for',
            field=models.IntegerField(default=1),
            preserve_default=False,
        ),
    ]
