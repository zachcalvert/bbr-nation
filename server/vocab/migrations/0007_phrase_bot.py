# Generated by Django 3.1.11 on 2021-06-26 03:37

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('bot', '0014_auto_20210626_0322'),
        ('vocab', '0006_auto_20210618_1627'),
    ]

    operations = [
        migrations.AddField(
            model_name='phrase',
            name='bot',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='bot.groupmebot'),
        ),
    ]
