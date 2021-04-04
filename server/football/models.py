from django.db import models

from content.models import Member


class Season(models.Model):
    year = models.CharField(max_length=4)
    members = models.ManyToManyField(Member, related_name='seasons')
    winner = models.ForeignKey(Member, null=True, blank=True, on_delete=models.SET_NULL, related_name='winner_season')
    piercee = models.ForeignKey(Member, null=True, blank=True, on_delete=models.SET_NULL, related_name='piercee_season')
    complete = models.BooleanField(default=True)

    def __str__(self):
        return self.year


class Player(models.Model):
    name = models.CharField(max_length=100)
    espn_id = models.CharField(max_length=20, null=True, blank=True)
    nickname = models.CharField(max_length=30, null=True, blank=True)
    position = models.CharField(max_length=10, null=True, blank=True)

    def __str__(self):
        return self.name


class Team(models.Model):
    name = models.CharField(max_length=50)
    season = models.ForeignKey(Season, null=True, on_delete=models.SET_NULL)
    manager = models.ForeignKey(Member, null=True, on_delete=models.SET_NULL, related_name='teams')
    players = models.ManyToManyField(Player)
    wins = models.IntegerField()
    losses = models.IntegerField()
    ties = models.IntegerField()
    final_standing = models.IntegerField()
    logo_url = models.URLField()

    def __str__(self):
        return f'{self.name} ({self.season.year})'


class PlayerSeason(models.Model):
    season = models.ForeignKey(Season, null=True, on_delete=models.SET_NULL)
    team = models.ForeignKey(Team, null=True, blank=True, on_delete=models.SET_NULL)
    player = models.ForeignKey(Player, null=True, on_delete=models.SET_NULL)
    position_rank = models.IntegerField()
    total_points = models.IntegerField()

    def __str__(self):
        return f'{self.season} {self.player.name}'
