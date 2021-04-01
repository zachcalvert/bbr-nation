from django.contrib import admin

from content.models import Content, Page, Member, Nickname


class MemberAdmin(admin.ModelAdmin):
    list_display = ['name', 'groupme_id']
    search_fields = ['name',]

    fields = (
        'name',
        'groupme_id',
        'avatar_url',
    )
    readonly_fields = ('groupme_id',)


class ContentAdmin(admin.ModelAdmin):
    list_display = ['__str__', 'creator', 'creator_nickname', 'create_date', 'kind', 'text', 'likes']
    list_filter = ('creator', 'kind',)
    search_fields = ['name',]

    fields = (
        'creator',
        'creator_nickname',
        'create_date',
        'media_url',
        'text',
        'likes',
    )
    readonly_fields = fields

admin.site.register(Member, MemberAdmin)
admin.site.register(Nickname)
admin.site.register(Content, ContentAdmin)
admin.site.register(Page)