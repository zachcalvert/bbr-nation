import json
import random
import requests

from django.contrib.postgres.fields import ArrayField
from django.db import models

from content.models import Member

GIS_ID = "cc646ee172e69377d"
GOOGLE_SEARCH_API_KEY = "AIzaSyCknrR34a7r"


class Season(models.Model):
    year = models.CharField(max_length=4)
    members = models.ManyToManyField(Member, related_name='seasons')
    winner = models.ForeignKey(Member, null=True, blank=True, on_delete=models.SET_NULL, related_name='winner_season')
    piercee = models.ForeignKey(Member, null=True, blank=True, on_delete=models.SET_NULL, related_name='piercee_season')
    complete = models.BooleanField(default=True)

    class Meta:
        ordering = ['-year']

    def __str__(self):
        return self.year

    def get_teams(self):
        return [
            {
                "id": team.id,
                "name": team.name,
                "image_url": team.logo_url,
                "wins": team.wins,
                "losses": team.losses,
                "standing": team.standing,
                "final_standing": team.final_standing,
                "manager": team.manager.name,
                "points_for": team.points_for,
                "points_against": team.points_against
            } for team in self.teams.all()
        ]


class Player(models.Model):
    name = models.CharField(max_length=100)
    espn_id = models.CharField(max_length=20, null=True, blank=True)
    nickname = models.CharField(max_length=30, null=True, blank=True)
    position = models.CharField(max_length=10, null=True, blank=True)

    def __str__(self):
        return self.name

    def get_image_url(self):
        url =  f'https://www.googleapis.com/customsearch/v1?q={self.name}&num=10&cx={GIS_ID}&searchType=image&key={GOOGLE_SEARCH_API_KEY}CP4PQ-z2IUhHouIR_GaLXFQ'
        response = requests.get(url)

        if response.status_code == 200:
            content = json.loads(response.content)
            if 'items' in content:
                index = random.choice(range(len(content['items'])))
                image_url = content['items'][index]['link']
                return image_url

        return None

    def get_seasons(self):
        return [
            {
                "year": ps.season.year,
                "position_rank": ps.position_rank,
                "points_scored": ps.total_points,
                "team_id": ps.team.id,
                "team_name": ps.team.name,
                "owner": ps.team.manager.name
            } for ps in self.seasons.order_by('-season__year')
        ]


class Team(models.Model):
    name = models.CharField(max_length=50)
    season = models.ForeignKey(Season, null=True, on_delete=models.SET_NULL, related_name='teams')
    manager = models.ForeignKey(Member, null=True, on_delete=models.SET_NULL, related_name='teams')
    players = models.ManyToManyField(Player)
    wins = models.IntegerField()
    losses = models.IntegerField()
    ties = models.IntegerField()
    standing = models.IntegerField()
    final_standing = models.IntegerField()
    logo_url = models.URLField()
    points_for = models.IntegerField()
    points_against = models.IntegerField()
    games_played = models.IntegerField()

    class Meta:
        ordering = ['standing']

    def __str__(self):
        return f'{self.name} ({self.season.year})'

    @property
    def all_time_rank(self):
        return Team.objects.filter(points_for__gt=self.points_for).count() + 1

    @property
    def all_time_unluckiest(self):
        return Team.objects.filter(points_against__gt=self.points_against).count() + 1

    @property
    def champ(self):
        return self.season.winner_id == self.manager.id

    @property
    def pierced(self):
        return self.season.piercee_id == self.manager.id

    @property
    def year(self):
        return self.season.year


class PlayerSeason(models.Model):
    season = models.ForeignKey(Season, null=True, on_delete=models.SET_NULL)
    team = models.ForeignKey(Team, null=True, blank=True, on_delete=models.SET_NULL)
    player = models.ForeignKey(Player, null=True, on_delete=models.SET_NULL, related_name='seasons')
    position_rank = models.IntegerField()
    total_points = models.IntegerField()

    class Meta:
        ordering = ['-total_points']

    def __str__(self):
        return f'{self.season} {self.player.name}'


class NFLSeason(models.Model):
    year = models.CharField(max_length=4)
    current = models.BooleanField(default=False)

    def __str__(self):
        return self.year


class NFLConference(models.Model):
    name = models.CharField(max_length=50)

    def __str__(self):
        return self.name


class NFLDivision(models.Model):
    name = models.CharField(max_length=50)
    conference = models.ForeignKey(NFLConference, on_delete=models.CASCADE)

    def __str__(self):
        return f'The {self.name}'

    def total_record(self):
        wins = 0
        losses = 0
        for team in self.teams.all():
            wins += team.wins
            losses += team.losses

        return f'{wins}-{losses}'


class NFLTeam(models.Model):
    name = models.CharField(max_length=50)
    division = models.ForeignKey(NFLDivision, on_delete=models.CASCADE, related_name='teams')
    nicknames = ArrayField(models.CharField(max_length=50), blank=True)
    wins = models.IntegerField(default=0)
    losses = models.IntegerField(default=0)
    ties = models.IntegerField(default=0)

    def __str__(self):
        return self.name

    def record(self):
        return f'{self.wins}-{self.losses}'
