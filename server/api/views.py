from django.shortcuts import render

# Create your views here.
from django.contrib.auth.models import User, Group
from django.contrib.auth import authenticate
from rest_framework import viewsets
from rest_framework import permissions
from rest_framework.decorators import action
from rest_framework.response import Response

from api import serializers
from content.models import Video, Image, Page, Quote


class UserViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to be viewed or edited.
    """
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = serializers.UserSerializer
    permission_classes = [permissions.IsAuthenticated]


class GroupViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows groups to be viewed or edited.
    """
    queryset = Group.objects.all()
    serializer_class = serializers.GroupSerializer
    permission_classes = [permissions.IsAuthenticated]


class QuoteViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows text content to be viewed or edited.
    """
    queryset = Quote.objects.all()
    serializer_class = serializers.QuoteSerializer

    @action(detail=False)
    def random(self, request):
        quote = Quote.objects.order_by('?').first()
        serializer = serializers.QuoteSerializer(quote, context={'request': request})
        return Response(serializer.data)


class ImageViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows images to be viewed or edited.
    """
    queryset = Image.objects.all()
    serializer_class = serializers.ImageSerializer

    @action(detail=False)
    def random(self, request):
        image = Image.objects.order_by('?').first()
        serializer = serializers.ImageSerializer(image, context={'request': request})
        return Response(serializer.data)


class VideoViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows groups to be viewed or edited.
    """
    queryset = Video.objects.all()
    serializer_class = serializers.VideoSerializer

    @action(detail=False)
    def random(self, request):
        video = Video.objects.order_by('?').first()
        serializer = serializers.VideoSerializer(video, context={'request': request})
        return Response(serializer.data)


class PageViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows groups to be viewed or edited.
    """
    queryset = Page.objects.all()
    serializer_class = serializers.PageSerializer
