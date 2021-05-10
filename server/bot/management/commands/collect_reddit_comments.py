import datetime
import json
import os
import random
import re
import requests
import urllib
import tempfile
import time
import praw

from django.core.management.base import BaseCommand

from bot.models import Thought
from football.models import Player


class Command(BaseCommand):
    help = (
        "Collect posts/comments about nfl players"
    )

    def handle(self, *args, **kwargs):
        reddit = praw.Reddit(
            client_id="wKfB4w5wtzf6RQ",
            client_secret="d6Wq-ywdMXkrS5zai9bbfOSgsPjgEQ",
            user_agent="my user agent",
            username = "zcalvert",
            password = "Henley65!"
        )
        subs = ['fantasyfootball']

        for player in Player.objects.all():
            print(player.name)
            top_comments = []
            subreddit = reddit.subreddit('fantasyfootball')

            for submission in subreddit.search(player.name, sort="top", limit=1):
                top_comments.append(submission.title)
                
                Thought.objects.create(
                    player=player,
                    text=submission.title
                )
                
                for top_level_comment in submission.comments:
                    if isinstance(top_level_comment, praw.models.MoreComments):
                        continue
                    elif top_level_comment.score > 50:
                        top_comments.append(top_level_comment.body)
                        Thought.objects.create(
                            player=player,
                            text=top_level_comment.body
                        )

            print(top_comments)
            print('\n\n')