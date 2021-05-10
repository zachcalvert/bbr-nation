from django.contrib import admin

from bot.models import GroupMeBot, Thought


class ThoughtAdmin(admin.ModelAdmin):
    list_display = ('text', 'approved', 'sentiment', 'member', 'player')
    list_filter = ('approved', 'used', 'sentiment', 'member', 'player')


admin.site.register(Thought, ThoughtAdmin)
admin.site.register(GroupMeBot)