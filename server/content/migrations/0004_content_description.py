# Generated by Django 3.1.7 on 2021-04-02 01:06

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('content', '0003_auto_20210402_0052'),
    ]

    operations = [
        migrations.AddField(
            model_name='content',
            name='description',
            field=models.TextField(blank=True, null=True),
        ),
    ]
