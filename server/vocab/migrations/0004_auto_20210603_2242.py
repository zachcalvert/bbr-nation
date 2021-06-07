# Generated by Django 3.1.11 on 2021-06-03 22:42

from django.db import migrations

from bot.vocab import phrases


def create_objects(apps, schema_editor):
    phrase_model = apps.get_model("vocab", "Phrase")

    for adjective in phrases.ADJECTIVES:
        phrase_model.objects.get_or_create(
            text=adjective,
            kind='ADJECTIVE'
        )

    for occurrence in phrases.OCCURRENCES:
        phrase_model.objects.get_or_create(
            text=occurrence,
            kind='OCCURRENCE'
        )

    for thing in phrases.THINGS:
        phrase_model.objects.get_or_create(
            text=thing,
            kind='THING'
        )

class Migration(migrations.Migration):

    dependencies = [
        ('vocab', '0003_auto_20210603_2242'),
    ]

    operations = [
        migrations.RunPython(create_objects, reverse_code=migrations.RunPython.noop),
    ]