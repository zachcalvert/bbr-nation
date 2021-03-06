import re

from django.contrib.auth.models import User, Group

from rest_framework import serializers

from bot.models import Thought
from content.models import Content, Page, Member, ImageSlider, Image
from football.models import Player, PlayerSeason, Season, Team


class ContentSerializer(serializers.ModelSerializer):
    creator_name = serializers.SerializerMethodField('get_creator_name')
    text = serializers.SerializerMethodField()

    class Meta:
        model = Content
        fields = ['id', 'name', 'display_name', 'description', 'creator_nickname', 'creator_name', 'create_date', 'likes', 'text', 'kind', 'avatar_url', 'upload']
        extra_kwargs = {
            'url': {'lookup_field': 'name'}
        }

    def get_creator_name(self, obj):
        return obj.creator.name

    def strip_urls(self, text):
        result = re.sub(r"http\S+", "", text)
        return result

    def get_text(self, obj):
        return self.strip_urls(obj.text)


class ImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Image
        fields = '__all__'


class ImageSliderSerializer(serializers.ModelSerializer):
    images = ImageSerializer(many=True, read_only=True)
    class Meta:
        model = ImageSlider
        fields = '__all__'


class PageSerializer(serializers.HyperlinkedModelSerializer):
    image_sliders = ImageSliderSerializer(many=True, read_only=True)

    class Meta:
        model = Page
        fields = ['id', 'name', 'slug', 'image_sliders']
        extra_kwargs = {
            'url': {'lookup_field': 'slug'}
        }


class UserSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = ('username',)


class MemberSerializer(serializers.HyperlinkedModelSerializer):

    class Meta:
        model = Member
        fields = ['id', 'url', 'name', 'groupme_id', 'avatar_url']
        extra_kwargs = {
            'url': {'lookup_field': 'name'}
        }


class MemberDetailsSerializer(serializers.HyperlinkedModelSerializer):
    nicks = serializers.SerializerMethodField('get_nicks')
    best_finish = serializers.SerializerMethodField('get_best_finish')
    worst_finish = serializers.SerializerMethodField('get_worst_finish')
    champ_years = serializers.SerializerMethodField('get_champ_years')
    pierced_years = serializers.SerializerMethodField('get_pierced_years')
    teams = serializers.SerializerMethodField('get_teams')

    class Meta:
        model = Member
        fields = ['id', 'name', 'groupme_id', 'avatar_url', 'nicks', 'champ_years', 'pierced_years', 'best_finish', 'worst_finish', 'teams']
        extra_kwargs = {
            'url': {'lookup_field': 'name'}
        }
    
    def get_nicks(self, obj):
        return obj.get_nicks()

    def get_best_finish(self, obj):
        try:
            return obj.get_best_finish()
        except KeyError:
            return []

    def get_worst_finish(self, obj):
        try:
            return obj.get_worst_finish()
        except KeyError:
            return []
    
    def get_champ_years(self, obj):
        return [s.year for s in Season.objects.filter(winner=obj)]
    
    def get_pierced_years(self, obj):
        return [s.year for s in Season.objects.filter(piercee=obj)]

    def get_teams(self, obj):
        return [
            {
                "id": team.id,
                "name": team.name,
                "wins": team.wins,
                "losses": team.losses,
                "points_for": team.points_for,
                "points_against": team.points_against,
                "final_standing": team.final_standing,
                "year": team.season.year,
            } for team in obj.teams.all().order_by('-season__year')
        ]


class GroupSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Group
        fields = ['url', 'name']


class PlayerSerializer(serializers.HyperlinkedModelSerializer):

    class Meta:
        model = Player
        fields = ['id', 'url', 'name', 'nickname', 'position']


class PlayerSeasonSerializer(serializers.HyperlinkedModelSerializer):
    season = serializers.SerializerMethodField('get_season')
    team_id = serializers.SerializerMethodField('get_team_id')
    team_name = serializers.SerializerMethodField('get_team_name')
    name = serializers.SerializerMethodField('get_player_name')
    player_id = serializers.SerializerMethodField('get_player_id')
    position = serializers.SerializerMethodField('get_player_position')

    class Meta:
        model = PlayerSeason
        fields = ['season', 'player', 'name', 'player_id', 'position', 'team_id', 'team_name', 'position_rank', 'total_points']

    def get_season(self, obj):
        return obj.season.year

    def get_team_id(self, obj):
        return obj.team.id

    def get_team_name(self, obj):
        return obj.team.name

    def get_player_id(self, obj):
        return obj.player.id

    def get_player_name(self, obj):
        return obj.player.name

    def get_player_position(self, obj):
        return obj.player.position


class PlayerDetailsSerializer(serializers.HyperlinkedModelSerializer):
    image_url = serializers.SerializerMethodField('get_image_url')
    seasons = serializers.SerializerMethodField('get_seasons')

    class Meta:
        model = Player
        fields = ['id', 'name', 'position', 'image_url', 'seasons']

    def get_image_url(self, obj):
        return obj.get_image_url()

    def get_seasons(self, obj):
        return obj.get_seasons()


class TeamSerializer(serializers.HyperlinkedModelSerializer):
    manager = serializers.SerializerMethodField('get_manager_name')
    year = serializers.SerializerMethodField()
    
    class Meta:
        model = Team
        fields = ['id', 'name', 'manager', 'wins', 'losses', 'points_for', 'points_against', 'year']

    def get_manager_name(self, obj):
        return obj.manager.name

    def get_year(self, obj):
        return obj.season.year


class TeamDetailsSerializer(serializers.HyperlinkedModelSerializer):
    manager = serializers.SerializerMethodField('get_manager_name') 
    players = serializers.SerializerMethodField('get_players')
    all_time_rank = serializers.SerializerMethodField('get_all_time_rank')
    unlucky = serializers.SerializerMethodField('get_unlucky')

    class Meta:
        model = Team
        fields = [
            'id',
            'name',
            'players',
            'logo_url',
            'manager',
            'wins',
            'losses',
            'standing',
            'final_standing',
            'all_time_rank',
            'unlucky',
            'points_for',
            'points_against',
            'champ',
            'pierced',
            'year'
        ]

    def get_manager_name(self, obj):
        return obj.manager.name

    def get_players(self, obj):
        return [{
            "id": player.id,
            "name": player.name,
            "position": player.position
        } for player in obj.players.all()]

    def get_all_time_rank(self, obj):
        return obj.all_time_rank

    def get_unlucky(self, obj):
        return obj.all_time_unluckiest


class SeasonSerializer(serializers.HyperlinkedModelSerializer):
    teams = serializers.SerializerMethodField('get_teams')
    winner = serializers.SerializerMethodField('get_winner')
    piercee = serializers.SerializerMethodField('get_piercee')

    class Meta:
        model = Season
        fields = ['year', 'teams', 'winner', 'piercee']
        extra_kwargs = {
            'url': {'lookup_field': 'year'}
        }

    def get_teams(self, obj):
        return obj.get_teams()

    def get_winner(self, obj):
        return obj.winner.name

    def get_piercee(self, obj):
        return obj.piercee.name


class ThoughtSerializer(serializers.ModelSerializer):
    player = serializers.SerializerMethodField('get_player')

    class Meta:
        model = Thought
        fields = ['id', 'text', 'player', 'sentiment', 'is_update']

    def update(self, instance, validated_data):
        instance.text = validated_data.get('text', instance.text)
        instance.sentiment = validated_data.get('sentiment', instance.sentiment)
        instance.is_update = validated_data.get('is_update', instance.is_update)
        instance.approved = True
        instance.save()
        return instance

    def get_player(self, obj):
        if obj.player:
            return obj.player.name
        return None
