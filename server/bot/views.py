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

import json

from django.shortcuts import get_object_or_404, render
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from bot.models import GroupMeBot, Request, Response, GameBot, GameComment
from content.models import Member


@csrf_exempt
@require_http_methods(["POST"])
def new_message(request):
    try:
        content = json.loads(request.body)
    except json.decoder.JSONDecodeError:
        content = request.POST
    except Exception:
        return HttpResponse(status=204)

    try:
        message_content = content['text'].lower()
        sender = content['name']
        user_id = content['user_id']
    except KeyError:
        print('ERROR parsing GroupMe message: {}'.format(request.POST))
        return HttpResponse(status=204)

    if content['sender_type'] == 'bot':
        return HttpResponse(status=204)

    request = None
    for bot_name in ['bbot', 'localbot', 'testbot']:
        if bot_name in message_content:
            bot=GroupMeBot.objects.get(name=bot_name)
            sender = Member.objects.get(groupme_id=user_id)
            request = Request.objects.create(
                text=message_content,
                sender=sender,
                bot=bot
            )
            request.classify()
            
            response = Response.objects.create(
                request=request,
                sender=bot
            )
            response.build()

            if bot_name == 'localbot':
                return JsonResponse({
                    "text": response.text
                })
        
            response.send()

    return HttpResponse(status=204)


@csrf_exempt
@require_http_methods(["POST"])
def crib_message(request):
    try:
        message = json.loads(request.body)
    except Exception:
        return HttpResponse(200)

    bot = get_object_or_404(GameBot, name=message['bot'])
    sender_name = message['sender']
    text = message['text']
    request = Request.objects.create(
        text=text,
        sender_name=sender_name,
        bot=bot
    )
    request.classify()

    response = Response.objects.create(
        request=request,
        sender=bot
    )
    response.build()

    return JsonResponse({
        "text": response.text
    })


@csrf_exempt
@require_http_methods(["POST"])
def game_comment(request):
    try:
        message = json.loads(json.dumps(request.POST))
    except KeyError:
        message = json.loads(request.body)
    except Exception:
        return HttpResponse(200)

    bot = get_object_or_404(GameBot, name=message['bot'])

    comment = GameComment.get_next(
        personality=bot.personality,
        quality=message['quality'],
        time=message['time']
    )

    return JsonResponse({
        "text": comment.text
    })
