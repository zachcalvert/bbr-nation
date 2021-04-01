from django.contrib.auth.models import User, Group
from rest_framework import serializers

from content.models import Content, Page


class ContentSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Content
        fields = '__all__'
        extra_kwargs = {
            'url': {'lookup_field': 'name'}
        }


class PageSerializer(serializers.HyperlinkedModelSerializer):
    contents = ContentSerializer(read_only=True, many=True)

    class Meta:
        model = Page
        fields = '__all__'


class UserSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = User
        fields = ['url', 'username', 'email', 'groups']


class UserDetailSerializer(serializers.HyperlinkedModelSerializer):
    content = ContentSerializer(read_only=True, many=True)

    class Meta:
        model = User
        fields = ['url', 'username', 'email', 'groups', 'content']


class GroupSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Group
        fields = ['url', 'name']
