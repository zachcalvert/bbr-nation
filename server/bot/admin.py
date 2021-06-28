from django.contrib import admin

from bot.models import GameBot, GameComment, GroupMeBot, Request, Response, Thought


def mark_as_unused(modeladmin, request, queryset):
    for thought in queryset:
        thought.used = 0
        thought.save()
mark_as_unused.short_description = 'Mark as unused'


def add_to_bev(modeladmin, request, queryset):
    bot_id = GroupMeBot.objects.get(name='Bev').id
    for thought in queryset:
        t = {
            'bot_id': bot_id,
            'text': thought.text,
            'sentiment': thought.sentiment,
            'approved': thought.approved,
            'is_update': thought.is_update,
            'used': 0,
        }
        Thought.objects.create(**t)


def add_to_lish(modeladmin, request, queryset):
    bot_id = GroupMeBot.objects.get(name='Lish').id
    for thought in queryset:
        t = {
            'bot_id': bot_id,
            'text': thought.text,
            'sentiment': thought.sentiment,
            'approved': thought.approved,
            'is_update': thought.is_update,
            'used': 0,
        }
        Thought.objects.create(**t)


class RequestAdmin(admin.ModelAdmin):
    list_display = ('text', 'sentiment', 'sender', 'sender_name', 'sent_at', 'message_type', 'question_word', 'subject')
    list_filter = ('sentiment', 'message_type', 'question_word', 'bot', 'subject')


class ResponseAdmin(admin.ModelAdmin):
    list_display = ('request', 'text')


class ThoughtAdmin(admin.ModelAdmin):
    list_display = ('text', 'approved', 'sentiment', 'member', 'player')
    list_filter = ('bot', 'approved', 'used', 'sentiment', 'is_update')
    search_fields = ['text']
    actions = [mark_as_unused, add_to_bev, add_to_lish]


class GameCommentAdmin(admin.ModelAdmin):
    list_display = ['text', 'quality', 'time', 'personality']
    list_filter = ['quality', 'time', 'personality', 'used']
    fields = ['quality', 'time', 'personality', 'text']
    search_fields = ['text']


admin.site.register(GameBot)
admin.site.register(GameComment, GameCommentAdmin)

admin.site.register(GroupMeBot)
admin.site.register(Request, RequestAdmin)
admin.site.register(Response, ResponseAdmin)
admin.site.register(Thought, ThoughtAdmin)
