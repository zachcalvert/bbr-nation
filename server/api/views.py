from django.shortcuts import render

# Create your views here.
from django.contrib.auth.models import User, Group
from django.contrib.auth import authenticate
from rest_framework import viewsets
from rest_framework import permissions
from rest_framework.response import Response

from api import serializers
from content.models import Video, Image, Text, Page


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


class TextViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows text content to be viewed or edited.
    """
    queryset = Text.objects.all()
    serializer_class = serializers.TextSerializer


class ImageViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows images to be viewed or edited.
    """
    queryset = Image.objects.all()
    serializer_class = serializers.ImageSerializer


class VideoViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows groups to be viewed or edited.
    """
    queryset = Video.objects.all()
    serializer_class = serializers.VideoSerializer


class PageViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows groups to be viewed or edited.
    """
    queryset = Page.objects.all()
    serializer_class = serializers.PageSerializer
