from django.contrib import admin
from adminsortable2.admin import SortableInlineAdminMixin

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


class PageInline(admin.TabularInline):
    model = Content.pages.through
    extra = 1


class ContentAdmin(admin.ModelAdmin):
    list_display = ['__str__', 'creator', 'create_date', 'display_name', 'description', 'kind', 'text', 'likes']
    list_filter = ('creator', 'kind',)
    inlines = (PageInline,)
    search_fields = ['name',]

    fields = (
        'name',
        'creator',
        'creator_nickname',
        'display_name',
        'description',
        'create_date',
        'upload',
        'text',
        'likes',
    )
    readonly_fields = (
        'likes',
    )


class ContentTabularInline(SortableInlineAdminMixin, admin.TabularInline):
    model = Page.contents.through
    extra = 0


class PageAdmin(admin.ModelAdmin):
    list_display = ['name']
    fields = ['name', 'slug']
    inlines = (ContentTabularInline,)


admin.site.register(Member, MemberAdmin)
admin.site.register(Nickname)
admin.site.register(Content, ContentAdmin)
admin.site.register(Page, PageAdmin)