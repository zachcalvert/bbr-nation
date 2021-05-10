import json

from django.shortcuts import render
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response

from bot.models import GroupMeBot, Request
from content.models import Member


class NewMessageView(APIView):

    def post(self, request):
        # {
        #   "attachments": [],
        #   "avatar_url": "https://i.groupme.com/123456789",
        #   "created_at": 1302623328,
        #   "group_id": "1234567890",
        #   "id": "1234567890",
        #   "name": "John",
        #   "sender_id": "12345",
        #   "sender_type": "user",
        #   "source_guid": "GUID",
        #   "system": false,
        #   "text": "Hello world ☃☃",
        #   "user_id": "1234567890"
        # }
        print('got a message!')
        try:
            content = json.loads(request.body)
        except json.decoder.JSONDecodeError:
            content = request.POST
        except Exception:
            return HttpResponse(status=204)

        if content['sender_type'] == 'bot':
            return HttpResponse(status=204)

        print(f'message is {content["text"]}')
        
        try:
            message_content = content['text'].lower()
            user_id = content['user_id']
        except KeyError:
            print('ERROR parsing GroupMe message: {}'.format(request.POST))
            return HttpResponse(status=204)

        if 'bbot' in message_content:
            sender = Member.objects.get(groupme_id=user_id)
            request = Request.objects.create(
                text=message_content,
                sender=sender,
                bot=GroupMeBot.objects.get(name='bbot')
            )
        elif 'testbot' in message_content:
            sender = Member.objects.get(groupme_id=user_id)
            request = Request.objects.create(
                text=message_content,
                sender=sender,
                bot=GroupMeBot.objects.get(name='testbot')
            )

        print(f'request: {request}')
        response = request.generate_response()
        print(f'response: {response.text}')
        response.send()
        
        return Response(status=204)
