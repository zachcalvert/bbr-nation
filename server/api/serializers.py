from django.contrib.auth.models import User, Group
from rest_framework import serializers

from content.models import Content, Page


class UserSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = User
        fields = ['url', 'username', 'email', 'groups']


class GroupSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Group
        fields = ['url', 'name']


class ContentSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Content
        fields = '__all__'


class PageSerializer(serializers.HyperlinkedModelSerializer):
    contents = ContentSerializer(read_only=True, many=True)

    class Meta:
        model = Page
        fields = '__all__'
