from django.db import models


class Content(models.Model):
    upload = models.FileField(upload_to='uploads/%Y/%m/%d/')
