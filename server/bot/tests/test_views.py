from django.test import TestCase, Client
from django.urls import reverse

from bot.data.messages_for_bot import MESSAGES
from bot.data.thoughts import THOUGHTS
from bot.models import GroupMeBot, Request, Response, Thought
from content.models import Member


class NewMessageViewTestCase(TestCase):

    def setUp(self):
        self.testbot = GroupMeBot.objects.create(
            name='testbot',
            identifier='12345678'
        )
        self.bbot = GroupMeBot.objects.create(
            name='bbot',
            identifier='23456789'
        )
        self.local_bot = GroupMeBot.objects.create(
            name='localbot',
            identifier='234567890'
        )
        Member.objects.create(name='zach', groupme_id='zach')
        self.client = Client()
        self.url = reverse('new_message')

        for thought in THOUGHTS:
            Thought.objects.create(**{
                "text": thought['text'],
                "sentiment": thought['sentiment'],
                "is_update": thought['is_update'],
                "approved": thought['approved']
            })
        print(Thought.objects.count())
    
    def test_bbot_correctly_instantiated(self):
        self.assertEqual(Request.objects.count(), 0)
        self.assertEqual(Response.objects.count(), 0)

        data = {
          "attachments": [],
          "avatar_url": "https://i.groupme.com/123456789",
          "created_at": 1302623328,
          "group_id": "1234567890",
          "id": "1234567890",
          "name": "John",
          "sender_id": "12345",
          "sender_type": "",
          "source_guid": "GUID",
          "system": False,
          "text": "Hi bbot",
          "user_id": "zach"
        }

        self.client.post(self.url, data=data)
        self.assertEqual(Request.objects.count(), 1)
        self.assertEqual(Response.objects.get().request.bot, self.bbot)
        self.assertEqual(Response.objects.count(), 1)

    def test_testbot_correctly_instantiated(self):
        self.assertEqual(Request.objects.count(), 0)
        self.assertEqual(Response.objects.count(), 0)

        data = {
          "attachments": [],
          "avatar_url": "https://i.groupme.com/123456789",
          "created_at": 1302623328,
          "group_id": "1234567890",
          "id": "1234567890",
          "name": "John",
          "sender_id": "12345",
          "sender_type": "",
          "source_guid": "GUID",
          "system": False,
          "text": "hello testbot",
          "user_id": "zach"
        }

        self.client.post(self.url, data=data)
        self.assertEqual(Request.objects.count(), 1)
        self.assertEqual(Response.objects.get().request.bot, self.testbot)
        self.assertEqual(Response.objects.count(), 1)

    def test_real_messages(self):
        data = {
          "attachments": [],
          "avatar_url": "https://i.groupme.com/123456789",
          "created_at": 1302623328,
          "group_id": "1234567890",
          "id": "1234567890",
          "name": "John",
          "sender_id": "12345",
          "sender_type": "",
          "source_guid": "GUID",
          "system": False,
          "text": "hello testbot",
          "user_id": "zach"
        }

        for message in MESSAGES:
            message = message.lower().replace('bbot', 'localbot')
            print('')
            print(message)
            data['text'] = message
            response = self.client.post(self.url, data=data)
            print(response.json()['text'])
            print('')



    
