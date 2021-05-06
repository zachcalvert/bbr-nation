from django.test import TestCase

from bot.models import Request
from content.models import Member

# Create your tests here.

class BotClassificationTestCase(TestCase):

    def setUp(self):
        self.member = Member.objects.create(name='vino')
        self.bot = Member.objects.create(name='bbot')

    def make_message(self, text):
        return Request.objects.create(sender=self.member, text=text)

    def test_classify_questions(self):
        QUESTIONS = [
            "how's it going bbot?",
            'what do you say bbot',
            'idk, what do you think bbot?'
        ]
        for question in QUESTIONS:
            message = self.make_message(question)
            message.classify()
            self.assertTrue(message.question, f'{question} failed the test')
            self.assertEqual(message.sentiment, 'NEUTRAL')

    def test_classify_laughs(self):
        LAUGHS = [
            "loll broooo",
            'lmao',
            'bruhhh 😂',
            'goddamn 🤣',
            '😅 lol',
            '😆'
        ]
        for laugh in LAUGHS:
            message = self.make_message(laugh)
            message.classify()
            self.assertFalse(message.question)
            self.assertEqual(message.sentiment, 'LAUGHING', f'{laugh} failed the test')

    def test_classify_negatives(self):
        NEGATIVES = [
            'wtf',
            'damn bro',
            'not chill man'
        ]
        for negative in NEGATIVES:
            message = self.make_message(negative)
            message.classify()
            self.assertFalse(message.question)
            self.assertEqual(message.sentiment, 'NEGATIVE', f'{negative} failed the test')

    def test_classify_positives(self):
        POSITIVES = [
            'yessss',
            'chyaa',
            'my guy',
            'absolutely'
        ]
        for positive in POSITIVES:
            message = self.make_message(positive)
            message.classify()
            self.assertFalse(message.question)
            self.assertEqual(message.sentiment, 'POSITIVE', f'{positive} failed the test')
