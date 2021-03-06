import datetime
import json
import re
import requests
from functools import wraps

from django.contrib.auth.models import User, Group
from django.contrib.auth import authenticate
from django.db.models import QuerySet
from django.shortcuts import render
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, generics, pagination, permissions, viewsets
from rest_framework.decorators import action, api_view
from rest_framework.response import Response

from api import serializers
from bot.models import Thought
from content.models import Content, Page, Member, ImageSlider, Image
from football.models import Player, PlayerSeason, Season, Team


BASE_URL = "https://api.groupme.com/v3/"
GROUP_ID = "16191637"
TOKEN = "kUtmZNokfpZvOE8KrOw1tb7cF15wZ3h55Vxk0T34"


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

    @action(detail=False)
    def all(self, request):
        members = []

        for member in Member.objects.exclude(name__in=['bbot', 'shmads', 'GroupMe']):
            total_points = 0
            games_played = 0
            member_teams = Team.objects.filter(manager=member)
            for team in member_teams:
                total_points += team.points_for
                games_played += 13

            members.append({
                "id": member.id,
                "name": member.name,
                'total_points': total_points,
                'average_points': round(total_points / games_played, 2),
                'seasons': member_teams.count()
            })

        if request.GET.get('ordering') == 'average':
            sorted_members = sorted(members, key=lambda k: k['average_points'])
        else:
            sorted_members = sorted(members, key=lambda k: k['total_points'])

        sorted_members.reverse()
        return Response(sorted_members)


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


class ImageSliderViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows groups to be viewed or edited.
    """
    queryset = ImageSlider.objects.all()
    serializer_class = serializers.ImageSliderSerializer
    permission_classes = [permissions.IsAuthenticated]


class ImageViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows groups to be viewed or edited.
    """
    queryset = Image.objects.all()
    serializer_class = serializers.ImageSerializer
    permission_classes = [permissions.IsAuthenticated]


class ContentPagination(pagination.PageNumberPagination):
    page_size = 6


class ContentViewSet(viewsets.ModelViewSet):
    """
    API endpoint that shares content randomly.
    """
    serializer_class = serializers.ContentSerializer
    lookup_field = 'name'
    queryset = Content.objects.all()
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]
    filterset_fields = ['kind', 'creator_id']
    ordering_fields = ['likes', 'create_date']
    pagination_class = ContentPagination

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


class FootballPagination(pagination.PageNumberPagination):
    page_size = 100


class PlayerViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows groups to be viewed or edited.
    """
    queryset = Player.objects.all()
    serializer_class = serializers.PlayerSerializer
    pagination_class = FootballPagination

    def retrieve(self, request, *args, **kwargs):
        self.serializer_class = serializers.PlayerDetailsSerializer
        return super(PlayerViewSet, self).retrieve(request, *args, **kwargs)


class PlayerSeasonViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows groups to be viewed or edited.
    """
    queryset = PlayerSeason.objects.all()
    serializer_class = serializers.PlayerSeasonSerializer
    pagination_class = FootballPagination

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
    pagination_class = FootballPagination


class TeamViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows groups to be viewed or edited.
    """
    queryset = Team.objects.all()
    serializer_class = serializers.TeamSerializer
    pagination_class = FootballPagination

    def retrieve(self, request, *args, **kwargs):
        self.serializer_class = serializers.TeamDetailsSerializer
        return super(TeamViewSet, self).retrieve(request, *args, **kwargs)

    @paginate
    @action(detail=False)
    def all(self, request):
        return Team.objects.all().order_by('-points_for')


class ThoughtViewSet(viewsets.ModelViewSet):
    queryset = Thought.objects.all()
    serializer_class = serializers.ThoughtSerializer

    @paginate
    @action(detail=False)
    def random(self, request):
        return [Thought.objects.filter(approved=False).order_by('?').first()]
