from django.contrib import admin

from vocab.models import Person, Place, Phrase


def mark_as_unused(modeladmin, request, queryset):
    for phrase in queryset:
        phrase.used = 0
        phrase.save()
mark_as_unused.short_description = 'Mark as unused'


class PersonAdmin(admin.ModelAdmin):
    list_display = ['name', 'used']
    list_filter = ['used',]
    fields = ['name', 'used']


class PhraseAdmin(admin.ModelAdmin):
    list_display = ['text', 'kind', 'used']
    list_filter = ['used', 'kind']
    fields = ['text', 'kind', 'used']
    actions = [mark_as_unused,]


class PlaceAdmin(admin.ModelAdmin):
    list_display = ['name', 'used']
    list_filter = ['used',]
    fields = ['name', 'used']


admin.site.register(Phrase, PhraseAdmin)
admin.site.register(Person, PersonAdmin)
admin.site.register(Place, PlaceAdmin)
