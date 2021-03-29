from django.contrib import admin

from content.models import Content, Page


class ContentAdmin(admin.ModelAdmin):
    list_display = ['__str__', 'user', 'create_date', 'kind', 'text', 'media_url']
    list_filter = ('user', 'kind',)
    search_fields = ['name',]

    fields = (
        'user',
        'kind',
        'media_url',
        'text',
    )
    readonly_fields = fields

admin.site.register(Content, ContentAdmin)
admin.site.register(Page)