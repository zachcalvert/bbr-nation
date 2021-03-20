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

from functools import wraps
from django.db.models import QuerySet


SHOUTOUT_IDS = [
    '160879140245416165',
    '160879152046258192',
    '160879261420945182',
    '160879271942474197'
]


def paginate(func):

    @wraps(func)
    def inner(self, *args, **kwargs):
        queryset = func(self, *args, **kwargs)
        assert isinstance(queryset, (list, QuerySet)), "apply_pagination expects a List or a QuerySet"

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    return inner


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

    @paginate
    @action(detail=False)
    def top(self, request):
        return Content.objects.filter(likes__gte=3).order_by('-likes')

    @paginate
    @action(detail=False)
    def watch(self, request):
        return Content.objects.filter(kind='VIDEO')

    @paginate
    @action(detail=False)
    def bot(self, request):
        return Content.objects.filter(creator='Belly Bot', likes__gte=2).order_by('-likes')

    @paginate
    @action(detail=False)
    def shoutouts(self, request):
        shoutouts = []
        for shoutout_id in SHOUTOUT_IDS:
            shoutouts.append(Content.objects.get(name=shoutout_id))
        return shoutouts

    @paginate
    @action(detail=False)
    def the_twelve_days_of_shotguns(self, request):
        return Content.objects.filter(name='The Twelve Days of Shotguns')


class PageViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows groups to be viewed or edited.
    """
    queryset = Page.objects.all()
    serializer_class = serializers.PageSerializer
