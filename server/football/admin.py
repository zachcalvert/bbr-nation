from django.contrib import admin

from football.models import Season, Player, PlayerSeason, Team, NFLConference, NFLDivision, NFLTeam


def mark_as_stud(modeladmin, request, queryset):
    for player in queryset:
        player.stud = True
        player.save()
mark_as_stud.short_description = 'Mark as stud'


def mark_as_active(modeladmin, request, queryset):
    for player in queryset:
        player.active = True
        player.save()
mark_as_active.short_description = 'Mark as active'


class SeasonAdmin(admin.ModelAdmin):
    list_display = ('year', 'winner', 'piercee', 'complete')
    fields = ('year', 'members', 'winner', 'piercee', 'complete')
    readonly_fields = fields


class TeamAdmin(admin.ModelAdmin):
    list_display = ('name', 'manager', 'season', 'wins', 'losses', 'final_standing')
    list_filter = ('manager', 'season',)
    fields = ('name', 'manager', 'season', 'wins', 'losses', 'final_standing')
    readonly_fields = fields


class PlayerAdmin(admin.ModelAdmin):
    list_display = ('name', 'nickname', 'espn_id', 'position', 'active', 'stud')
    list_filter = ('stud', 'active')
    fields = ('name', 'nickname', 'espn_id', 'position')
    readonly_fields = ('name', 'espn_id', 'position')
    actions = [mark_as_active, mark_as_stud]


class PlayerSeasonAdmin(admin.ModelAdmin):
    list_display = ('player', 'season', 'team', 'position_rank', 'total_points')
    list_filter = ('season', 'team')
    fields = ('player', 'season', 'team', 'position_rank', 'total_points')
    readonly_fields = fields


class NFLTeamAdmin(admin.ModelAdmin):
    list_display = ('name', 'division', 'nicknames')
    list_filter = ('division',)
    fields = ('name', 'division', 'wins', 'losses', 'ties', 'nicknames')


admin.site.register(Season, SeasonAdmin)
admin.site.register(Team, TeamAdmin)
admin.site.register(Player, PlayerAdmin)
admin.site.register(PlayerSeason, PlayerSeasonAdmin)

admin.site.register(NFLConference)
admin.site.register(NFLDivision)
admin.site.register(NFLTeam, NFLTeamAdmin)
