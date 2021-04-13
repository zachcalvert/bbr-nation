import datetime
import json
import re
import requests
from functools import wraps

from django.contrib.auth.models import User, Group
from django.contrib.auth import authenticate
from django.db.models import QuerySet
from django.shortcuts import render
from rest_framework import generics, pagination, permissions, viewsets
from rest_framework.decorators import action, api_view
from rest_framework.response import Response

from api import serializers
from content.models import Content, Page, Member
from football.models import Player, PlayerSeason, Season, Team


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


@api_view(['GET'])
def current_user(request):
    """
    Determine the current user by their token, and return their data
    """
    serializer = serializers.UserSerializer(request.user)
    return Response(serializer.data)


class MemberViewSet(viewsets.ModelViewSet):
    """
    API endpoint that returns Members.
    """
    queryset = Member.objects.all().order_by('name')
    serializer_class = serializers.MemberSerializer
    lookup_field = 'name'

    def retrieve(self, request, *args, **kwargs):
        self.serializer_class = serializers.MemberDetailsSerializer
        return super(MemberViewSet, self).retrieve(request, *args, **kwargs)


class UserViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to be viewed or edited.
    """
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = serializers.UserSerializer

    def retrieve(self, request, *args, **kwargs):
        self.serializer_class = serializers.UserDetailSerializer
        return super(UserViewSet, self).retrieve(request, *args, **kwargs)


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
    serializer_class = serializers.ContentSerializer
    lookup_field = 'name'
    queryset = Content.objects.all()

    @paginate
    @action(detail=True)
    def all(self, request, name, **kwargs):
        """
        Return content for a given member, used by the member page
        """
        return Content.objects.all().order_by('-likes')

    @paginate
    @action(detail=True)
    def member(self, request, name, **kwargs):
        """
        Return content for a given member, used by the member page
        """
        return Content.objects.filter(creator__name=name).order_by('-likes')

    @paginate
    @action(detail=True)
    def page_contents(self, request, name, **kwargs):
        """
        Return content for a given member, used by the member page
        """
        return Content.objects.filter(pages__slug=name).order_by('pagecontents')

    @action(detail=True)
    def conversation(self, request, name, **kwargs):
        """
        name: the id of the groupme message.
        Strip URLs out of the text as the frontend doesn't display them well
        Fetch the messages either directly before or after a groupme message
        """
        if request.GET.get('ensuing') == 'true':
            messages_url = f"{BASE_URL}groups/{GROUP_ID}/messages?token={TOKEN}&limit=6&after_id={name}"
        else:
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

        if not request.GET.get('ensuing') == 'true':
            messages.reverse()

        return Response(messages)


class PageViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows groups to be viewed or edited.
    """
    queryset = Page.objects.all()
    serializer_class = serializers.PageSerializer
    lookup_field = 'slug'


class PlayerViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows groups to be viewed or edited.
    """
    queryset = Player.objects.all()
    serializer_class = serializers.PlayerSerializer

    def retrieve(self, request, *args, **kwargs):
        self.serializer_class = serializers.PlayerDetailsSerializer
        return super(PlayerViewSet, self).retrieve(request, *args, **kwargs)


class PlayerSeasonViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows groups to be viewed or edited.
    """
    queryset = PlayerSeason.objects.all()
    serializer_class = serializers.PlayerSeasonSerializer
    pagination.PageNumberPagination.page_size = 50

    def get_queryset(self):
        """
        Optionally restricts the returned purchases to a given user,
        by filtering against a `username` query parameter in the URL.
        """
        queryset = PlayerSeason.objects.exclude(total_points__gt=700)
        
        team = self.request.query_params.get('team')
        if team is not None:
            queryset = queryset.filter(team_id=team)
        
        position = self.request.query_params.get('position')
        if position is not None:
            if position == 'all':
                return queryset
            elif position == 'dst':
                position = 'D/ST'
            else:
                position = position.upper()
            queryset = queryset.filter(player__position=position)

        return queryset


class SeasonViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows groups to be viewed or edited.
    """
    queryset = Season.objects.all()
    serializer_class = serializers.SeasonSerializer
    lookup_field = 'year'


class TeamViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows groups to be viewed or edited.
    """
    queryset = Team.objects.all()
    serializer_class = serializers.TeamSerializer
    pagination.PageNumberPagination.page_size = 100 

    def retrieve(self, request, *args, **kwargs):
        self.serializer_class = serializers.TeamDetailsSerializer
        return super(TeamViewSet, self).retrieve(request, *args, **kwargs)

    @paginate
    @action(detail=False)
    def all(self, request):
        return Team.objects.all().order_by('-points_for')