from django.contrib.auth.models import User, Group
from rest_framework import serializers

from content.models import Image, Video, Quote, Page


class UserSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = User
        fields = ['url', 'username', 'email', 'groups']


class GroupSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Group
        fields = ['url', 'name']


class VideoSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Video
        fields = '__all__'


class ImageSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Image
        fields = '__all__'


class QuoteSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Quote
        fields = '__all__'


class PageSerializer(serializers.HyperlinkedModelSerializer):
    videos = VideoSerializer(read_only=True, many=True)

    class Meta:
        model = Page
        fields = '__all__'
