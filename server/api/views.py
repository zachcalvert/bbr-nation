from django.shortcuts import render

# Create your views here.
from django.contrib.auth.models import User, Group
from django.contrib.auth import authenticate
from rest_framework import viewsets
from rest_framework import permissions
from rest_framework.decorators import action
from rest_framework.response import Response

from api import serializers
from content.models import Content, Page


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


class ContentViewSet(viewsets.ModelViewSet):
    """
    API endpoint that shares content randomly.
    """
    queryset = Content.objects.all()
    serializer_class = serializers.ContentSerializer

    @action(detail=False)
    def random(self, request):
        content = Content.objects.order_by('?').first()
        serializer = serializers.ContentSerializer(content, context={'request': request})
        return Response(serializer.data)

    @action(detail=False)
    def top(self, request):
        content = Content.objects.order_by('-likes')[:50]
        serializer = serializers.ContentSerializer(content, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False)
    def videos(self, request):
        content = Content.objects.filter(kind='MOVIE')
        serializer = serializers.ContentSerializer(content, many=True, context={'request': request})
        return Response(serializer.data)


class PageViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows groups to be viewed or edited.
    """
    queryset = Page.objects.all()
    serializer_class = serializers.PageSerializer
