from django.contrib import admin

from content.models import Video, Image, Text, Page

admin.site.register(Video)
admin.site.register(Image)
admin.site.register(Text)
admin.site.register(Page)