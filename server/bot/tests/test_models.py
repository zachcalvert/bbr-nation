from django.test import TestCase

from bot.models import GroupMeBot, Request, Response
from content.models import Member


class BbotTestCase(TestCase):

    def setUp(self):
        self.member = Member.objects.create(name='vino')
        self.bot = GroupMeBot.objects.create(name='testbot')
    
    def make_request(self, text):
        return Request.objects.create(sender=self.member, text=text, bot=self.bot)


class MessageTypeTestCase(BbotTestCase):
    
    def test_classify_checkins(self):
        CHECK_INS = [
            'whatup testbot!',
            'how you doing testbot',
            'how\'s it going testbot',
            'morning testbot how we doing today'
        ]

        for check_in in CHECK_INS:
            request = self.make_request(check_in)
            request.determine_message_type()
            self.assertEqual(request.message_type, 'CHECK_IN', f'{check_in} failed the test')

    def test_classify_questions(self):
        QUESTIONS = [
            "who is winning tonight testbot",
            'how do you do testbot',
            'idk, what do you think testbot?',
        ]
        for question in QUESTIONS:
            request = self.make_request(question)
            request.determine_message_type()
            self.assertEqual(request.message_type, 'QUESTION', f'{question} failed the test')


class SentimentTestCase(BbotTestCase):

    def test_laughs(self):
        LAUGHS = [
            "loll testbot broooo",
            'testbot lmao',
            'bruhhh testbot 😂',
            'goddamn testbot 🤣',
            '😅 testbot lol',
            '😆 testbot'
        ]
        for laugh in LAUGHS:
            request = self.make_request(laugh)
            request.determine_sentiment()
            self.assertEqual(request.sentiment, 'LAUGHING', f'{laugh} failed the test')

    def test_classify_negatives(self):
        NEGATIVES = [
            'wtf',
            'damn bro',
            'not chill man'
        ]
        for negative in NEGATIVES:
            request = self.make_request(negative)
            request.determine_sentiment()
            self.assertEqual(request.sentiment, 'NEGATIVE', f'{negative} failed the test')

    def test_classify_positives(self):
        POSITIVES = [
            'yessss',
            'fuck yea',
            'my guy',
            'absolutely'
        ]
        for positive in POSITIVES:
            request = self.make_request(positive)
            request.determine_sentiment()
            self.assertEqual(request.sentiment, 'POSITIVE', f'{positive} failed the test')


class PartsOfSpeechTestCase(BbotTestCase):

    def test_pos_tagging(self):
        request = self.make_request('The Patriots suck')
        request.determine_parts_of_speech()
        self.assertEqual(request.subject, 'The Patriots')
        self.assertEqual(request.verb, 'suck')

        # I lost lol
        request = self.make_request('you lost man lol')
        request.determine_parts_of_speech()
        self.assertEqual(request.subject, 'i')
        self.assertEqual(request.verb, 'lost')

        # Bbot roasting the fuck out of us
        request = self.make_request('testbot\'s killing it')
        request.determine_parts_of_speech()
        self.assertEqual(request.subject, 'testbot')
        self.assertEqual(request.verb, 'killing')
        self.assertEqual(request.direct_object, 'it')

        # We all just freaked the fuck out
        request = self.make_request('i was freaking the fuck out')
        request.determine_parts_of_speech()
        self.assertEqual(request.subject, 'vino')
        self.assertEqual(request.verb, 'freaked')


class BotAnsweringTestCase(BbotTestCase):

    def test_answers(self):
        request = self.make_request('testbot what does he eat?')
        request.classify()
        self.assertEqual(request.question_word, 'what')
        response = Response.objects.create(
            request=request,
            sender=self.bot
        )
        response.build()
        self.assertEqual(response.text, 'what vino eat?')

        request = self.make_request('who\'s gonna win tonight testbot?')
        request.classify()
        response = Response.objects.create(
            request=request,
            sender=self.bot
        )
        response.build()
        self.assertEqual(response.text, 'who tonight win')

    
