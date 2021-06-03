from django.db import models


class PhraseQuerySet(models.QuerySet):
    def yeses(self):
        return self.filter(kind='YES')

    def times(self):
        return self.filter(kind='TIME')

    def qualifiers(self):
        return self.filter(kind='QUALIFIER')

    def exclamations(self):
        return self.filter(pos='EXCLAMATIONS')

    def questions(self):
        return self.filter(pos='QUESTION')

    def suffixes(self):
        return self.filter(pos='SUFFIX')


class PhraseManager(models.Manager):
    def get_queryset(self):
        return PhraseQuerySet(self.model, using=self._db)

    def yeses(self):
        return self.get_queryset().yeses()

    def times(self):
        return self.get_queryset().times()

    def qualifiers(self):
        return self.get_queryset().qualifiers()

    def exclamations(self):
        return self.get_queryset().exclamations()

    def questions(self):
        return self.get_queryset().questions()

    def suffixes(self):
        return self.get_queryset().suffixes()


class Phrase(models.Model):
    KIND_CHOICES = (
        ('YES', 'YES'),
        ('TIME', 'TIME'),
        ('QUESTION', 'QUESTION'),
        ('ADVERB', 'ADVERB'),
        ('EXCLAMATION', 'EXCLAMATION'),
        ('QUESTION', 'QUESTION'),
        ('SUFFIX', 'SUFFIX'),
        ('EMOJI', 'EMOJI'),
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
