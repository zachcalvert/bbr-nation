from django.contrib import admin

from content.models import Content, Page


class ContentAdmin(admin.ModelAdmin):
    list_display = ['__str__', 'user', 'create_date', 'kind', 'upload', 'text']
    list_filter = ('user', 'kind',)


admin.site.register(Content, ContentAdmin)
admin.site.register(Page)