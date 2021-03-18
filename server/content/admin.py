from django.contrib import admin

from content.models import Video, Image, Quote, Page


class VideoAdmin(admin.ModelAdmin):
    list_display = ['__str__', 'text', 'creator', 'create_date', 'upload']
    list_filter = ('creator',)


class ImageAdmin(admin.ModelAdmin):
    list_display = ['__str__', 'text', 'creator', 'create_date', 'upload']
    list_filter = ('creator',)


class QuoteAdmin(admin.ModelAdmin):
    list_display = ['__str__', 'text', 'creator', 'create_date']
    list_filter = ('creator',)


admin.site.register(Video, VideoAdmin)
admin.site.register(Image, ImageAdmin)
admin.site.register(Quote, QuoteAdmin)
admin.site.register(Page)