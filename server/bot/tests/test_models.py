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

    def test_classify_greetings(self):
        GREETINGS = [
            'whatup bbot!',
            'how you doing bbot',
            'how\'s it going bbot',
            'morning bbot, how we doing today'
        ]

        for greeting in GREETINGS:
            message = self.make_message(greeting)
            message.classify()
            self.assertTrue(message.is_greeting, f'{greeting} failed the test')

    def test_classify_questions(self):
        NEUTRAL_QUESTIONS = [
            "how's it going bbot?",
            'what do you say bbot',
            'idk, what do you think bbot?',
        ]
        for question in NEUTRAL_QUESTIONS:
            message = self.make_message(question)
            message.classify()
            self.assertTrue(message.is_question, f'{question} failed the test')
            self.assertEqual(message.sentiment, 'NEUTRAL')

        LAUGHING_QUESTIONS = [
            "😂 rough night bbot?",
            "how do you know that lol",
            "bbot what time is the game lol"
        ]
        for question in LAUGHING_QUESTIONS:
            message = self.make_message(question)
            message.classify()
            self.assertTrue(message.is_question, f'{question} failed the test')
            self.assertEqual(message.sentiment, 'LAUGHING')

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
            self.assertFalse(message.is_question)
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
            self.assertFalse(message.is_question)
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
            self.assertFalse(message.is_question)
            self.assertEqual(message.sentiment, 'POSITIVE', f'{positive} failed the test')

    def test_pos_tagging(self):
        # the patriots suck
        message = self.make_message('the patriots suck')
        message.classify()
        self.assertEqual(message.subject, 'the patriots')
        self.assertEqual(message.verb, 'suck')

        # I lost lol
        message = self.make_message('you lost man lol')
        message.classify()
        self.assertEqual(message.subject, 'you')
        self.assertEqual(message.verb, 'lost')

        # Bbot roasting the fuck out of us
        message = self.make_message('bbot\'s killing it')
        message.classify()
        self.assertEqual(message.subject, 'bbot')
        self.assertEqual(message.verb, 'killing')
        self.assertEqual(message.direct_object, 'it')

        # We all just freaked the fuck out
        message = self.make_message('walsh just freaked the fuck out')
        message.classify()
        self.assertEqual(message.subject, 'walsh')
        self.assertEqual(message.verb, 'freaked')


class BotAnsweringTestCase(TestCase):
    def setUp(self):
        self.member = Member.objects.create(name='vino')
        self.bot = Member.objects.create(name='bbot')

    def make_request(self, text):
        return Request.objects.create(sender=self.member, text=text)

    def test_answers(self):
        request = self.make_request('what do pandas eat')
        request.classify()
        self.assertTrue(request.is_question)
        response = request.generate_response()
        self.assertEqual(response.text, 'I don\'t really know what pandas eat')


class BotGreetingResponseTestCase(TestCase):
    def setUp(self):
        self.member = Member.objects.create(name='vino')
        self.bot = Member.objects.create(name='bbot')

    def make_request(self, text):
        return Request.objects.create(sender=self.member, text=text)

    def test_greetings(self):
        request = self.make_request('whatup bbot!')
        request.classify()
        self.assertTrue(request.is_greeting)
        self.assertEqual(request.greeting_word, 'whatup')
        response = request.generate_response()
        print(response.text)

        request = self.make_request('good morning bbot, whats cookin')
        request.classify()
        self.assertTrue(request.is_greeting)
        self.assertEqual(request.greeting_word, 'good morning')
        response = request.generate_response()
        print(response.text)

