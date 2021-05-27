from django.contrib import admin

from bot.models import GroupMeBot, Request, Response, Thought


def mark_as_unused(modeladmin, request, queryset):
    for thought in queryset:
        thought.used = 0
        thought.save()
mark_as_unused.short_description = 'Mark as unused'


class RequestAdmin(admin.ModelAdmin):
    list_display = ('text', 'sentiment', 'sender', 'sent_at', 'message_type', 'question_word', 'subject')
    list_filter = ('sentiment', 'message_type', 'question_word', 'bot', 'subject')


class ResponseAdmin(admin.ModelAdmin):
    list_display = ('text', 'request')


class ThoughtAdmin(admin.ModelAdmin):
    list_display = ('text', 'approved', 'sentiment', 'member', 'player')
    list_filter = ('approved', 'used', 'sentiment', 'is_update')
    actions = [mark_as_unused, ]


admin.site.register(GroupMeBot)
admin.site.register(Request, RequestAdmin)
admin.site.register(Response, ResponseAdmin)
admin.site.register(Thought, ThoughtAdmin)
