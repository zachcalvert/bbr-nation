from django.db import models
from django.db.models.fields import related

from content.models import Member


class Contestant(models.Model):
    name = models.CharField(max_length=100)
    profession = models.CharField(max_length=100, null=True, blank=True)
    age = models.IntegerField(default=0)
    image = models.FileField(upload_to='uploads/%Y/%m/%d/', null=True, blank=True)
    drafted = models.BooleanField(default=False)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']


class Draft(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class DraftPick(models.Model):
    draft = models.ForeignKey(Draft, null=True, on_delete=models.SET_NULL, related_name='picks')
    draftee = models.ForeignKey(Contestant, null=True, on_delete=models.SET_NULL)
    drafter = models.ForeignKey(Member, null=True, on_delete=models.SET_NULL)
    player = models.CharField(max_length=100, null=True, blank=True)
    pick = models.IntegerField(default=0)

    def __str__(self):
        try:
            return f'{self.pick}: {self.draftee.name} ({self.player})'
        except AttributeError:
            return self.id

