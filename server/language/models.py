from django.db import models

from taggit.managers import TaggableManager


class WordQuerySet(models.QuerySet):
    def nouns(self):
        return self.filter(pos='NOUN')

    def pronouns(self):
        return self.filter(pos='PRONOUN')

    def verbs(self):
        return self.filter(pos='VERB')

    def adjectives(self):
        return self.filter(pos='ADJECTIVE')

    def adverbs(self):
        return self.filter(pos='ADVERB')

    def prepositions(self):
        return self.filter(pos='PREPOSITION')

    def conjuctions(self):
        return self.filter(pos='CONJUCTION')

    def interjections(self):
        return self.filter(pos='INTERJECTION')


class WordManager(models.Manager):
    def get_queryset(self):
        return WordQuerySet(self.model, using=self._db)

    def nouns(self):
        return self.get_queryset().nouns()

    def pronouns(self):
        return self.get_queryset().pronouns()

    def verbs(self):
        return self.get_queryset().verbs()

    def adjectives(self):
        return self.get_queryset().adjectives()

    def adverbs(self):
        return self.get_queryset().adverbs()

    def prepositions(self):
        return self.get_queryset().prepositions()

    def conjuctions(self):
        return self.get_queryset().conjuctions()

    def interjections(self):
        return self.get_queryset().interjections()
    

class Word(models.Model):
    POS_CHOICES = (
        ("NOUN", "NOUN"),
        ("PRONOUN", "PRONOUN"),
        ("VERB", "VERB"),
        ("ADJECTIVE", "ADJECTIVE"),
        ("ADVERB", "ADVERB"),
        ("PREPOSITION", "PREPOSITION"),
        ("CONJUNCTION", "CONJUNCTION"),
        ("INTERJECTION", "INTERJECTION"),
    )
    TENSE_CHOICES = (
        ('PAST', 'PAST'),
        ('PRESENT', 'PRESENT'),
        ('FUTURE', 'FUTURE'),
    )
    name = models.CharField(max_length=100)
    pos = models.CharField(max_length=20, choices=POS_CHOICES, null=True, blank=True)
    used = models.IntegerField(default=0)
    tense = models.CharField(max_length=100, choices=TENSE_CHOICES, null=True, blank=True)
    tags = TaggableManager()

    def __str__(self):
        return self.name
