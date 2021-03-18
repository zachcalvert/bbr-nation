from django.db import models
from django.utils.text import slugify


class Content(models.Model):
    name = models.CharField(max_length=100, null=True, blank=True)
    creator = models.CharField(max_length=200, null=True, blank=True)


class Video(Content):
    upload = models.FileField(upload_to='uploads/%Y/%m/%d/', null=True, blank=True)
    date = models.DateTimeField(auto_now_add=True)
    caption = models.TextField(null=True, blank=True)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return str(self.name)


class Image(Content):
    upload = models.FileField(upload_to='uploads/%Y/%m/%d/', null=True, blank=True)
    date = models.DateTimeField(auto_now_add=True)
    caption = models.TextField(null=True, blank=True)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return str(self.name)


class Text(Content):
    content = models.TextField()

    def __str__(self):
        return str(self.name)


class Page(models.Model):
    name = models.CharField(max_length=100, null=True, blank=True)
    slug = models.SlugField(null=True, blank=True, editable=False)
    videos = models.ManyToManyField(Video, null=True, blank=True)
    images = models.ManyToManyField(Image, null=True, blank=True)
    texts = models.ManyToManyField(Text, null=True, blank=True)

    def __str__(self):
        return str(self.name)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super(Page, self).save(*args, **kwargs)
    

