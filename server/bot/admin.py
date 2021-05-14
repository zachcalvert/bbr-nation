from django.contrib import admin

from bot.models import GroupMeBot, Thought


def mark_as_unused(modeladmin, request, queryset):
    for thought in queryset:
        thought.used = 0
        thought.save()
mark_as_unused.short_description = 'Mark as unused'


class ThoughtAdmin(admin.ModelAdmin):
    list_display = ('text', 'approved', 'sentiment', 'member', 'player')
    list_filter = ('approved', 'used', 'sentiment', 'is_update')
    actions = [mark_as_unused, ]


admin.site.register(Thought, ThoughtAdmin)
admin.site.register(GroupMeBot)
