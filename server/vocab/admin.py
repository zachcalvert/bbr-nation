from django.contrib import admin

from vocab.models import Person, Place, Phrase


class PersonAdmin(admin.ModelAdmin):
    list_display = ['name', 'used']
    list_filter = ['used',]
    fields = ['name', 'used']


class PhraseAdmin(admin.ModelAdmin):
    list_display = ['text', 'kind', 'used']
    list_filter = ['used', 'kind']
    fields = ['text', 'kind', 'used']


class PlaceAdmin(admin.ModelAdmin):
    list_display = ['name', 'used']
    list_filter = ['used',]
    fields = ['name', 'used']


admin.site.register(Phrase, PhraseAdmin)
admin.site.register(Person, PersonAdmin)
admin.site.register(Place, PlaceAdmin)
