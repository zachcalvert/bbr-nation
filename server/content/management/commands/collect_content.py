import datetime
import json
import os
import random
import requests
import urllib
import tempfile
import time

from django.core import files
from django.core.management.base import BaseCommand

from content.models import Image, Video, Content, Quote, Profile


BASE_URL = "https://api.groupme.com/v3/"
GROUP_ID = "16191637"
TOKEN = "kUtmZNokfpZvOE8KrOw1tb7cF15wZ3h55Vxk0T34"


class Command(BaseCommand):
    help = (  # noqa: Django required
        "Collect videos"
    )

    def get_file_type(self, url):
        if 'png' in url:
            return '.png'
        elif 'jpg' in url or 'jpeg' in url:
            return '.jpg'
        elif 'gif' in url:
            return '.gif'
        elif 'mp4' in url:
            return '.mp4'
        return ""

    def handle(self, *args, **options):

        starting_message_id = None
        
        for i in range(75):
            time.sleep(2)
            messages_url = f"{BASE_URL}groups/{GROUP_ID}/messages?token={TOKEN}&limit=100"

            if starting_message_id:
                messages_url += f"&before_id={starting_message_id}"

            response = requests.get(messages_url)

            if response.status_code != 200:
                print(response)
                return
            
            content = json.loads(response.content.decode())
            message_list = content['response']['messages']

            for message in message_list:
                print(message)
                # if Content.objects.filter(name=message['id']).exists():
                #     continue

                if message['attachments'] and message['favorited_by']:
                    user = Profile.objects.get(groupme_id=message['user_id']).user
                    attachment = message['attachments'][0]
                    url = attachment.get('url') or attachment.get('source_url') or attachment.get('preview_url')
                    if url:
                        file_type = self.get_file_type(url)
                        if file_type:
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
                                "user": user,
                                "name": message['id'],
                                "text": message['text'],
                                "creator": message['name'],
                                "create_date": datetime.datetime.fromtimestamp(message['created_at']),
                                "likes": len(message['favorited_by'])
                            }

                            if file_type == '.mp4':
                                video = Video(**kwargs)
                                video.upload.save(file_name, files.File(lf))
                            else:
                                image = Image(**kwargs)
                                image.upload.save(file_name, files.File(lf))

                    else:
                        print(message)
                        print('found new url type, in above message')

                elif not message['attachments'] and len(message['favorited_by']) > 1:
                    user = Profile.objects.get(groupme_id=message['user_id']).user
                    kwargs = {
                        "user": user,
                        "name": message['id'],
                        "text": message['text'],
                        "creator": message['name'],
                        "create_date": datetime.datetime.fromtimestamp(message['created_at']),
                        "likes": len(message['favorited_by'])
                    }
                    Quote.objects.create(**kwargs)

                try:
                    message_list[message_list.index(message) + 1]
                except IndexError:
                    starting_message_id = message['id']
                    continue