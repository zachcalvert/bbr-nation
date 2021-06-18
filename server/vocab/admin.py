from django.contrib import admin

from vocab.models import Person, Place, Phrase, TeamName


def mark_as_unused(modeladmin, request, queryset):
    for phrase in queryset:
        phrase.used = 0
        phrase.save()
mark_as_unused.short_description = 'Mark as unused'


class PersonAdmin(admin.ModelAdmin):
    list_display = ['name', 'used']
    list_filter = ['used',]
    fields = ['name', 'used']
    search_fields = ['name']


class PhraseAdmin(admin.ModelAdmin):
    list_display = ['text', 'kind', 'used']
    list_filter = ['used', 'kind']
    search_fields = ['text']
    fields = ['text', 'kind', 'used']
    actions = [mark_as_unused,]


class PlaceAdmin(admin.ModelAdmin):
    list_display = ['name', 'used']
    list_filter = ['used',]
    search_fields = ['name']
    fields = ['name', 'used']


class TeamNameAdmin(admin.ModelAdmin):
    list_display = ['name', 'used']
    list_filter = ['used',]
    search_fields = ['name']
    fields = ['name', 'used']


admin.site.register(Phrase, PhraseAdmin)
admin.site.register(Person, PersonAdmin)
admin.site.register(Place, PlaceAdmin)
admin.site.register(TeamName, TeamNameAdmin)
