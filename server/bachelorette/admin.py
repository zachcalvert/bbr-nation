from django.contrib import admin

# Register your models here.
from bachelorette.models import Contestant, Draft, DraftPick


def mark_as_unused(modeladmin, request, queryset):
    for contestant in queryset:
        contestant.drafted = False
        contestant.save()
mark_as_unused.short_description = 'Mark as undrafted'


class ContestantAdmin(admin.ModelAdmin):
    list_display = ('name', 'profession', 'age',)
    search_fields = ['name']
    actions = [mark_as_unused, ]


admin.site.register(Contestant, ContestantAdmin)
admin.site.register(Draft)
admin.site.register(DraftPick)