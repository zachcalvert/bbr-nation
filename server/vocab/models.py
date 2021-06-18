from django.db import models


class Phrase(models.Model):
    KIND_CHOICES = (
        ('YES', 'YES'),
        ('TIME', 'TIME'),
        ('QUESTION', 'QUESTION'),
        ('ADVERB', 'ADVERB'),
        ('QUESTION', 'QUESTION'),
        ('SUFFIX', 'SUFFIX'),
        ('EMOJI', 'EMOJI'),
        ('ADJECTIVE', 'ADJECTIVE'),
        ('THING', 'THING'),
        ('OCCURRENCE', 'OCCURRENCE'),
    )
    used = models.IntegerField(default=0)
    kind = models.CharField(max_length=20, choices=KIND_CHOICES)
    text = models.CharField(max_length=100)

    def __str__(self):
        return self.text

    @staticmethod
    def get_next(kind):
        phrase = Phrase.objects.filter(kind=kind).annotate(models.Min('used')).order_by('used')[0]
        phrase.used += 1
        phrase.save()
        
        return phrase.text


class Person(models.Model):
    name = models.CharField(max_length=100)
    used = models.BooleanField(default=False)

    class Meta:
        verbose_name_plural = 'People'

    def __str__(self):
        return self.name

    @staticmethod
    def get_next():
        person = Person.objects.filter(used=False).order_by('?').first()
        person.used = True
        person.save()
        
        return person.name


class Place(models.Model):
    name = models.CharField(max_length=100)
    used = models.BooleanField(default=False)

    def __str__(self):
        return self.name

    @staticmethod
    def get_next():
        place = Place.objects.filter(used=False).order_by('?').first()
        place.used = True
        place.save()
        
        return place.name


class TeamName(models.Model):
    name = models.CharField(max_length=100)
    used = models.BooleanField(default=False)

    def __str__(self):
        return self.name

    @staticmethod
    def get_next():
        team_name = TeamName.objects.filter(used=False).order_by('?').first()
        team_name.used = True
        team_name.save()

        return team_name.name
