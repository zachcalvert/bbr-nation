import json
import random
import requests

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
                "manager": team.manager.name
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

    class Meta:
        ordering = ['standing']

    def __str__(self):
        return f'{self.name} ({self.season.year})'


class PlayerSeason(models.Model):
    season = models.ForeignKey(Season, null=True, on_delete=models.SET_NULL)
    team = models.ForeignKey(Team, null=True, blank=True, on_delete=models.SET_NULL)
    player = models.ForeignKey(Player, null=True, on_delete=models.SET_NULL)
    position_rank = models.IntegerField()
    total_points = models.IntegerField()

    class Meta:
        ordering = ['position_rank']

    def __str__(self):
        return f'{self.season} {self.player.name}'
