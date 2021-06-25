# Generated by Django 3.1.11 on 2021-06-16 22:31

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('bachelorette', '0003_contestant_drafted'),
    ]

    operations = [
        migrations.AlterField(
            model_name='draftpick',
            name='draft',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='picks', to='bachelorette.draft'),
        ),
    ]