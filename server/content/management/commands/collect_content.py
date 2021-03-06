"""
VERY FIRST STARTING MESSAGE ID
144176812771878500
"""

import datetime
import json
import os
import random
import re
import requests
import urllib
import tempfile
import time

from django.core import files
from django.core.management.base import BaseCommand

from content.models import Content, Member, Nickname


BASE_URL = "https://api.groupme.com/v3/"
GROUP_ID = "16191637"
TOKEN = "kUtmZNokfpZvOE8KrOw1tb7cF15wZ3h55Vxk0T34"


class Command(BaseCommand):
    help = (  # noqa: Django required
        "Collect videos"
    )

    def get_file_type(self, url):
        if '.png' in url:
            return '.png'
        elif 'jpg' in url or 'jpeg' in url:
            return '.jpg'
        elif 'gif' in url:
            return '.gif'
        elif 'mp4' in url:
            return '.mp4'
        return ""

    def strip_urls(self, text): 
        text = re.sub(r'^https?:\/\/.*[\r\n]*', '', text, flags=re.MULTILINE)
        return text

    def handle(self, *args, **options):

        starting_message_id = None
        
        for i in range(500):
            print(f'on batch {i}')
            messages_url = f"{BASE_URL}groups/{GROUP_ID}/messages?token={TOKEN}&limit=100"

            if starting_message_id:
                messages_url += f"&before_id={starting_message_id}"

            response = requests.get(messages_url)

            if response.status_code != 200:
                print(response)
                continue

            content = json.loads(response.content.decode())
            message_list = content['response']['messages']

            for message in message_list:
                if Content.objects.filter(name=message['id']).exists():
                    print(f'seen message with id {message["id"]} before, exiting')
                    return
                try:
                    if message['attachments'] and len(message['favorited_by']) > 1:
                        try:
                            member = Member.objects.get(groupme_id=message['user_id'])
                        except Member.DoesNotExist:
                            member = Member.objects.create(
                                groupme_id=message['user_id'],
                                name=message['name'],
                                avatar_url=message['avatar_url']
                            )
                        if not member.avatar_url and message['avatar_url']:
                            member.avatar_url = message['avatar_url']
                            member.save()

                        Nickname.objects.get_or_create(
                            nickname=message['name'],
                            member=member
                        )

                        attachment = message['attachments'][0]
                        url = attachment.get('url') or attachment.get('source_url') or attachment.get('preview_url')
                        print(url)
                        if url:
                            file_type = self.get_file_type(url)
                            if file_type:
                                if file_type == '.mp4':
                                    kind = 'VIDEO'
                                else:
                                    kind = 'IMAGE'
                                print(file_type)

                                file_name = '{}{}'.format(message['id'], file_type)
                                response = requests.get(url, stream=True)

                                if response.status_code != 200:
                                    continue

                                lf = tempfile.NamedTemporaryFile()
                                for block in response.iter_content(1024 * 8):
                                    if not block:
                                        break
                                    lf.write(block)

                                kwargs = {
                                    "create_date": datetime.datetime.fromtimestamp(message['created_at']),
                                    "creator": member,
                                    "creator_nickname": message['name'],
                                    "kind": kind,
                                    "likes": len(message['favorited_by']),
                                    "name": message['id'],
                                    "text": self.strip_urls(message['text']),
                                }

                                content = Content(**kwargs)
                                content.upload.save(file_name, files.File(lf))


                        else:
                            print(message)
                            print('found new url type, in above message')


                    elif not message['attachments'] and len(message['favorited_by']) > 2:
                        try:
                            member = Member.objects.get(groupme_id=message['user_id'])
                        except Member.DoesNotExist:
                            member = Member.objects.create(
                                groupme_id=message['user_id'],
                                name=message['name'],
                                avatar_url=message['avatar_url']
                            )

                        if not member.avatar_url and message['avatar_url']:
                            member.avatar_url = message['avatar_url']
                            member.save()

                        Nickname.objects.get_or_create(
                            nickname=message['name'],
                            member=member
                        )

                        kwargs = {
                            "avatar_url": message['avatar_url'],
                            "creator": member,
                            "creator_nickname": message['name'],
                            "create_date": datetime.datetime.fromtimestamp(message['created_at']),
                            "kind": 'TEXT',
                            "likes": len(message['favorited_by']),
                            "name": message['id'],
                            "text": self.strip_urls(message['text'])
                        }
                        Content.objects.create(**kwargs)

                except Exception as e:
                    print(e)

                finally:
                    try:
                        message_list[message_list.index(message) + 1]
                    except IndexError:
                        starting_message_id = message['id']
                        print(f'new starting message id: {starting_message_id}')
