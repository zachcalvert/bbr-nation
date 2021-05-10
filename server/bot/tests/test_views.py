from django.test import TestCase, Client
from django.urls import reverse

from bot.models import GroupMeBot, Request, Response
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
        Member.objects.create(name='zach', groupme_id='zach')
        self.client = Client()
        self.url = reverse('new_message')
    
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


    
