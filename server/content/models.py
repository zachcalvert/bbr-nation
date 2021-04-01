from django.contrib.auth.models import User
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils.text import slugify


class Member(models.Model):
    name = models.CharField(max_length=50)
    groupme_id = models.CharField(max_length=50, null=True, blank=True)
    avatar_url = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self):
        return self.name

    def get_nicks(self):
        return [n.nickname for n in Nickname.objects.filter(member=self)]


class Nickname(models.Model):
    nickname = models.CharField(max_length=100)
    member = models.ForeignKey(Member, null=True, blank=True, on_delete=models.SET_NULL, related_name='nicknames')

    def __str__(self):
        return self.nickname


class Content(models.Model):
    KIND_CHOICES = (
        ('TEXT', 'Text'),
        ('IMAGE', 'Image'),
        ('VIDEO', 'Video'),
    )
    name = models.CharField(max_length=100, null=True, blank=True, db_index=True)
    creator = models.ForeignKey(Member, null=True, blank=True, on_delete=models.SET_NULL, related_name='content')
    creator_nickname = models.CharField(max_length=200, null=True, blank=True)
    create_date = models.DateTimeField(null=True, blank=True)
    likes = models.IntegerField(default=0)
    upload = models.FileField(upload_to='uploads/%Y/%m/%d/', null=True, blank=True)
    text = models.TextField(null=True, blank=True)
    kind = models.CharField(max_length=10, choices=KIND_CHOICES, default='TEXT')
    avatar_url = models.CharField(max_length=255, null=True, blank=True)
    media_url = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        ordering = ['?']
        verbose_name_plural = 'Content'

    def __str__(self):
        return self.name


class Page(models.Model):
    name = models.CharField(max_length=100, null=True, blank=True)
    slug = models.SlugField(null=True, blank=True)
    contents = models.ManyToManyField(Content, null=True, blank=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return str(self.name)
