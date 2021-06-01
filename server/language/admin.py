from django.contrib import admin

from language.models import Word


class WordAdmin(admin.ModelAdmin):
    list_display = ('name', 'pos', 'tags')
    list_filter = ('pos', 'tags')


admin.site.register(Word, WordAdmin)