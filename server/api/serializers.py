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


class TeamSerializer(serializers.HyperlinkedModelSerializer):

    class Meta:
        model = Team
        fields = '__all__'


class SeasonSerializer(serializers.HyperlinkedModelSerializer):
    teams = serializers.SerializerMethodField('get_teams')

    class Meta:
        model = Season
        fields = ['year', 'teams']
        extra_kwargs = {
            'url': {'lookup_field': 'year'}
        }

    def get_teams(self, obj):
        return obj.get_teams()

