from django.contrib.auth.models import User, Group
from rest_framework import serializers

from content.models import Content, Page, Member


class ContentSerializer(serializers.ModelSerializer):
    creator_name = serializers.SerializerMethodField('get_creator_name')

    class Meta:
        model = Content
        fields = ['name', 'creator_nickname', 'creator_name', 'create_date', 'likes', 'text', 'kind', 'avatar_url', 'media_url']
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
