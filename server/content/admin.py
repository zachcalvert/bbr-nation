from django.contrib import admin
from adminsortable2.admin import SortableInlineAdminMixin

from content.models import Content, Page, Member, Nickname, Image, ImageSlider


class MemberAdmin(admin.ModelAdmin):
    list_display = ['name', 'groupme_id', 'nfl_team']
    search_fields = ['name',]

    fields = (
        'name',
        'groupme_id',
        'avatar_url',
        'nfl_team'
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
        'kind',
        'creator',
        'creator_nickname',
        'display_name',
        'description',
        'create_date',
        'upload',
        'text',
        'likes',
        'avatar_url'
    )
    readonly_fields = (
        'likes',
    )


class ContentTabularInline(SortableInlineAdminMixin, admin.TabularInline):
    model = Page.contents.through
    extra = 0


class ImageSliderInline(admin.TabularInline):
    model = ImageSlider
    fields = ['name', 'description']
    readonly_fields = ['name']
    extra = 0


class PageAdmin(admin.ModelAdmin):
    list_display = ['name']
    fields = ['name', 'slug']
    inlines = (ImageSliderInline, ContentTabularInline,)


class ImageAdmin(admin.ModelAdmin):
    list_display = ['name', 'caption', 'upload']
    fields = ['name', 'caption', 'upload']


class ImageInline(SortableInlineAdminMixin, admin.TabularInline):
    model = Image.sliders.through
    extra = 0


class ImageSliderAdmin(admin.ModelAdmin):
    list_display = ['name']
    fields = ['name', 'page', 'description']
    inlines = (ImageInline,)


admin.site.register(Image, ImageAdmin)
admin.site.register(ImageSlider, ImageSliderAdmin)
admin.site.register(Member, MemberAdmin)
admin.site.register(Nickname)
admin.site.register(Content, ContentAdmin)
admin.site.register(Page, PageAdmin)