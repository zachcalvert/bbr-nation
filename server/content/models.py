from django.contrib.auth.models import User
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils.text import slugify


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    groupme_id = models.CharField(max_length=50, null=True, blank=True)


class Content(models.Model):
    name = models.CharField(max_length=100, null=True, blank=True)
    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    creator = models.CharField(max_length=200, null=True, blank=True)
    create_date = models.DateTimeField(null=True, blank=True)
    likes = models.IntegerField(default=0)


class Video(Content):
    upload = models.FileField(upload_to='uploads/%Y/%m/%d/', null=True, blank=True)
    text = models.TextField(null=True, blank=True)

    class Meta:
        ordering = ['-create_date']

    def __str__(self):
        return str(self.name)


class Image(Content):
    upload = models.FileField(upload_to='uploads/%Y/%m/%d/', null=True, blank=True)
    text = models.TextField(null=True, blank=True)

    class Meta:
        ordering = ['-create_date']

    def __str__(self):
        return str(self.name)


class Quote(Content):
    text = models.TextField()

    class Meta:
        ordering = ['-create_date']

    def __str__(self):
        return str(self.name)


class Page(models.Model):
    name = models.CharField(max_length=100, null=True, blank=True)
    slug = models.SlugField(null=True, blank=True, editable=False)
    videos = models.ManyToManyField(Video, null=True, blank=True)
    images = models.ManyToManyField(Image, null=True, blank=True)
    quotes = models.ManyToManyField(Quote, null=True, blank=True)

    def __str__(self):
        return str(self.name)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super(Page, self).save(*args, **kwargs)
    

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()