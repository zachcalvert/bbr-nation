# Generated by Django 3.1.11 on 2021-06-03 22:42

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('vocab', '0002_auto_20210603_0115'),
    ]

    operations = [
        migrations.AlterField(
            model_name='phrase',
            name='kind',
            field=models.CharField(choices=[('YES', 'YES'), ('TIME', 'TIME'), ('QUESTION', 'QUESTION'), ('ADVERB', 'ADVERB'), ('QUESTION', 'QUESTION'), ('SUFFIX', 'SUFFIX'), ('EMOJI', 'EMOJI'), ('ADJECTIVE', 'ADJECTIVE'), ('THING', 'THING'), ('OCCURRENCE', 'OCCURRENCE')], max_length=20),
        ),
    ]
