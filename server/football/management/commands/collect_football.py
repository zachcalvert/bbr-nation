"""
"""
import datetime
import json
import requests
import time

from django.core.management.base import BaseCommand

from content.models import Member
from football.espn_wrapper import ESPNWrapper
from football.models import Player, PlayerSeason, Season, Team


TEAM_USER_MAP = {
    2018: {
        1: 'calero',
        2: 'frank',
        3: 'vino',
        4: 'shane',
        5: 'greg',
        6: 'jerad',
        7: 'max',
        8: 'rene',
        9: 'walsh',
        10: 'cam',
        11: 'bk',
        12: 'trav'
    },
    2019: {
        1: 'calero',
        2: 'frank',
        3: 'vino',
        4: 'shane',
        5: 'greg',
        6: 'jerad',
        8: 'rene',
        9: 'walsh',
        11: 'bk',
        12: 'trav'
    },
    2020: {
        1: 'calero',
        2: 'j-shaw',
        3: 'vino',
        4: 'shane',
        5: 'greg',
        6: 'jerad',
        8: 'rene',
        9: 'walsh',
        11: 'bk',
        12: 'trav'
    }
}


class Command(BaseCommand):
    help = (  # noqa: Django required
        "Collect espn football records"
    )

    def handle(self, *args, **options):

        years = [2018, 2019,2020]

        for year in years:
            print(year)
            wrapper = ESPNWrapper(year=year)
            espn_season = wrapper.league
            season, _ = Season.objects.get_or_create(year=year)

            for espn_team in espn_season.teams:
                try:
                    member = Member.objects.get(name=TEAM_USER_MAP[year][espn_team.team_id])
                    season.members.add(member)
                except Member.DoesNotExist:
                    print(vars(espn_team))
                if not Team.objects.filter(season=season, name=espn_team.team_name).exists():
                    team_kwargs = {
                        "name": espn_team.team_name,
                        "season": season,
                        "manager": member,
                        "wins": espn_team.wins,
                        "losses": espn_team.losses,
                        "ties": espn_team.ties,
                        "logo_url": espn_team.logo_url,
                        "final_standing": espn_team.final_standing,
                        "standing": espn_team.standing
                    }
                    team = Team.objects.create(**team_kwargs)
                else:
                    team = Team.objects.get(season=season, name=espn_team.team_name)

                if espn_team.final_standing == 1:
                    season.winner = member
                    season.save()
                elif espn_team.standing == len(espn_season.teams):
                    season.piercee = member
                    season.save()

                for espn_player in espn_team.roster:
                    if not Player.objects.filter(name=espn_player.name).exists():
                        player, _ = Player.objects.get_or_create(
                            name=espn_player.name,
                            espn_id=espn_player.playerId,
                            position=espn_player.position
                        )
                    else:
                        player = Player.objects.get(name=espn_player.name)
                    
                    team.players.add(player)

                    if not PlayerSeason.objects.filter(season=season, player=player).exists():
                        player_season_kwargs = {
                            "season": season,
                            "team": team,
                            "player": player,
                            "position_rank": espn_player.posRank,
                            "total_points": espn_player.total_points
                        }
                        PlayerSeason.objects.create(**player_season_kwargs)