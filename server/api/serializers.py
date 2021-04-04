from django.contrib.auth.models import User, Group
from rest_framework import serializers

from content.models import Content, Page, Member
from football.models import Player, PlayerSeason, Season, Team


class ContentSerializer(serializers.ModelSerializer):
    creator_name = serializers.SerializerMethodField('get_creator_name')

    class Meta:
        model = Content
        fields = ['id', 'name', 'display_name', 'description', 'creator_nickname', 'creator_name', 'create_date', 'likes', 'text', 'kind', 'avatar_url', 'media_url']
        extra_kwargs = {
            'url': {'lookup_field': 'name'}
        }

    def get_creator_name(self, obj):
        return obj.creator.name


class PageSerializer(serializers.HyperlinkedModelSerializer):
    contents = ContentSerializer(read_only=True, many=True)

    class Meta:
        model = Page
        fields = '__all__'
        extra_kwargs = {
            'url': {'lookup_field': 'slug'}
        }


class UserSerializer(serializers.HyperlinkedModelSerializer):

    class Meta:
        model = User
        fields = ['url', 'username', 'email', 'groups']
        extra_kwargs = {
            'url': {'lookup_field': 'username'}
        }


class MemberSerializer(serializers.HyperlinkedModelSerializer):

    class Meta:
        model = Member
        fields = ['name', 'groupme_id', 'avatar_url']
        extra_kwargs = {
            'url': {'lookup_field': 'name'}
        }


class MemberDetailsSerializer(serializers.HyperlinkedModelSerializer):
    nicks = serializers.SerializerMethodField('get_nicks')

    class Meta:
        model = Member
        fields = ['name', 'groupme_id', 'avatar_url', 'nicks']
        extra_kwargs = {
            'url': {'lookup_field': 'name'}
        }
    
    def get_nicks(self, obj):
        return obj.get_nicks()


class GroupSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Group
        fields = ['url', 'name']


class PlayerSerializer(serializers.HyperlinkedModelSerializer):
    image_url = serializers.SerializerMethodField('get_image_url')

    class Meta:
        model = Player
        fields = ['name', 'image_url', 'nickname', 'position', 'image_url']

    def get_image_url(self, obj):
        return obj.get_image_url()


class PlayerSeasonSerializer(serializers.HyperlinkedModelSerializer):
    season = serializers.SerializerMethodField('get_season')
    team = serializers.SerializerMethodField('get_team')
    name = serializers.SerializerMethodField('get_player_name')
    position = serializers.SerializerMethodField('get_player_position')

    class Meta:
        model = PlayerSeason
        fields = ['season', 'player', 'name', 'position', 'team', 'position_rank', 'total_points']

    def get_season(self, obj):
        return obj.season.year

    def get_team(self, obj):
        return obj.team.id

    def get_player_name(self, obj):
        return obj.player.name

    def get_player_position(self, obj):
        return obj.player.position


class TeamSerializer(serializers.HyperlinkedModelSerializer):
    manager = serializers.SerializerMethodField('get_manager_name')
    players = serializers.SerializerMethodField('get_players')

    class Meta:
        model = Team
        fields = ['id', 'name', 'players', 'logo_url', 'manager', 'wins', 'losses', 'standing', 'final_standing']

    def get_manager_name(self, obj):
        return obj.manager.name

    def get_players(self, obj):
        return [{
            "id": player.id,
            "name": player.name,
            "position": player.position
        } for player in obj.players.all()]


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

