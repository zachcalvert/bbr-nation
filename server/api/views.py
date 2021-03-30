import datetime
import json
import re
import requests

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


BASE_URL = "https://api.groupme.com/v3/"
GROUP_ID = "16191637"
TOKEN = "kUtmZNokfpZvOE8KrOw1tb7cF15wZ3h55Vxk0T34"


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
    lookup_field = 'name'

    @action(detail=True)
    def conversation(self, request, name):
        # content = Content.objects.get(name=name)
        conversation = Content.objects.get(name=name)

        messages_url = f"{BASE_URL}groups/{GROUP_ID}/messages?token={TOKEN}&limit=6&before_id={name}"
        response = requests.get(messages_url)
        content = json.loads(response.content.decode())
        message_list = content['response']['messages']

        messages = [{
            'id': m['id'],
            'text': re.sub(r'^https?:\/\/.*[\r\n]*', '', m['text'], flags=re.MULTILINE) if m['text'] else None,
            'created_date': datetime.datetime.fromtimestamp(m['created_at']).replace(tzinfo=datetime.timezone.utc).isoformat(),
            'creator': m['name'],
            'avatar_url': m['avatar_url'],
            'attachments': m['attachments']
        } for m in message_list]
        
        messages.reverse()

        return Response(messages)

    @paginate
    @action(detail=False)
    def random(self, request):
        return Content.objects.order_by('?')

    @paginate
    @action(detail=False)
    def top(self, request):
        return Content.objects.filter(likes__gte=3).order_by('-likes')

    @paginate
    @action(detail=False)
    def watch(self, request):
        return Content.objects.filter(kind='VIDEO').order_by('?')

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

    @paginate
    @action(detail=False)
    def early(self, request):
        return Content.objects.order_by('create_date')


class PageViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows groups to be viewed or edited.
    """
    queryset = Page.objects.all()
    serializer_class = serializers.PageSerializer
