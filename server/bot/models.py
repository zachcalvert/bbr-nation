import json
import random
import requests
import spacy

import giphy_client
from giphy_client.rest import ApiException

from django.db import models

from bot import vocab
from bot.answerer import Answerer

from content.models import Member
from football.espn_wrapper import ESPNWrapper
from football.models import Player
from vocab.models import Phrase

GIPHY_API_KEY = "qUzMZY2GSYY8y"
GIS_ID = "cc646ee172e69377d"
GOOGLE_SEARCH_API_KEY = "AIzaSyCknrR34a7r"
GROUPME_URL = "https://api.groupme.com/v3/bots/post"

giphy_api_instance = giphy_client.DefaultApi()
nlp = spacy.load("en_core_web_sm")


class GroupMeBot(models.Model):
    name = models.CharField(max_length=25, null=True)
    identifier = models.CharField(max_length=100)

    def __str__(self):
        return self.name

    def send_message(self, message, gif_text):
        """
        Post a message to a groupme channel
        """
        body = {
            "bot_id": self.identifier,
            "text": message.text
        }

        if message.image:
            body['text'] = gif_text
            body['attachments'] = [{
                "type": "image",
                "url": message.image
            }]

        response = requests.post(GROUPME_URL, data=json.dumps(body), headers={'Content-Type': 'Application/json'})
        if response.status_code < 200 or response.status_code > 299:
            print('ERROR posting to GroupMe: {}: {}'.format(response.status_code, response.content))


class Thought(models.Model):
    SENTIMENT_CHOICES = (
        ("NEUTRAL", "NEUTRAL"),
        ("POSITIVE", "POSITIVE"),
        ("NEGATIVE", "NEGATIVE"),
        ("LAUGHING", "LAUGHING")
    )
    text = models.TextField()
    member = models.ForeignKey(Member, null=True, blank=True, on_delete=models.SET_NULL, related_name='thoughts')
    player = models.ForeignKey(Player, null=True, blank=True, on_delete=models.SET_NULL, related_name='thoughts')
    used = models.IntegerField(default=0)
    approved = models.BooleanField(default=False)
    sentiment = models.CharField(max_length=15, choices=SENTIMENT_CHOICES, default="NEUTRAL")
    is_update = models.BooleanField(default=False)
    bot = models.ForeignKey(GroupMeBot, null=True, blank=True, on_delete=models.SET_NULL)

    def __str__(self):
        return self.text


class Request(models.Model):
    TYPE_CHOICES = (
        ("GIF", "GIF"),
        ("IMAGE", "IMAGE"),
        ("GREETING", "GREETING"),
        ("CHECK_IN", "CHECK_IN"),
        ("QUESTION", "QUESTION"),
        ("COMMENT", "COMMENT"),
        ("STANDINGS", "STANDINGS"),
    )
    SENTIMENT_CHOICES = (
        ("NEUTRAL", "NEUTRAL"),
        ("POSITIVE", "POSITIVE"),
        ("NEGATIVE", "NEGATIVE"),
        ("LAUGHING", "LAUGHING")
    )
    sentiment = models.CharField(max_length=10, choices=SENTIMENT_CHOICES, null=True)
    sender = models.ForeignKey(Member, null=True, on_delete=models.SET_NULL)
    sender_name = models.CharField(max_length=100, null=True, blank=True)
    sent_at = models.DateTimeField(auto_now_add=True)
    text = models.TextField()
    question_word = models.CharField(max_length=15, null=True, blank=True)
    bot = models.ForeignKey(GroupMeBot, null=True, on_delete=models.SET_NULL)
    subject = models.CharField(max_length=50, null=True, blank=True)
    verb = models.CharField(max_length=50, null=True, blank=True)
    direct_object = models.CharField(max_length=50, null=True, blank=True)
    message_type = models.CharField(max_length=20, choices=TYPE_CHOICES, null=True, blank=True)

    def __str__(self):
        return f"{self.sender_display_name}: '{self.text}' ({self.message_type} - {self.sentiment})"

    @property
    def sender_display_name(self):
        if self.sender_name:
            return self.sender_name
        if self.sender:
            return self.sender.name

    def determine_message_type(self):
        """
        assign as gif request, image, greeting, check in, question or comment
        We remove all spaces and apostrophes for easier matching on patterns
        """
        message = self.text.replace(' ', '').replace("'", "")
        if f'{self.bot.name}gif' in message:
            self.message_type = 'GIF'
        elif f'{self.bot.name}image' in message:
            self.message_type = 'IMAGE'
        elif 'waiverwire' in message:
            self.message_type = 'WAIVER'
        elif any(word in message for word in vocab.CHECK_INS):
            self.message_type = 'CHECK_IN'
        elif 'standings' in message:
            self.message_type = 'STANDINGS'
        else:
            self.question_word = Answerer.question_word(self.text)
            if self.question_word:
                self.message_type = 'QUESTION'
            else:
                self.message_type = 'COMMENT'
    
    def determine_sentiment(self):
        """
        assign sentiment of message
        """
        if any(laugh in self.text for laugh in vocab.LAUGHS):
            self.sentiment = "LAUGHING"
        elif any(negative in self.text for negative in vocab.NEGATIVES):
            self.sentiment = "NEGATIVE"
        elif any(positive in self.text for positive in vocab.POSITIVES):
            self.sentiment = "POSITIVE"
        else:
            self.sentiment = "NEUTRAL"

    def determine_parts_of_speech(self):
        """
        assign subject, verb and direct object
        """
        doc = nlp(self.text)
        middle = len(self.text.split(' ')) // 2

        span = doc[doc[middle].left_edge.i : doc[middle].right_edge.i+1]
        with doc.retokenize() as retokenizer:
            retokenizer.merge(span)
        for token in doc:
            if token.dep_ == 'nsubj':
                self.subject = str(token)
            if token.pos_ == 'VERB':
                token_str = str(token).split(' ')[0] if ' ' in str(token) else str(token)
                self.verb = token_str
            if token.dep_ == 'dobj':
                self.direct_object = str(token)

        if self.subject == 'you':
            self.subject = 'i'

        if not self.subject:
            if self.text.startswith('you '):
                self.subject = 'i'
            else:
                self.subject = self.sender_display_name

    def classify(self):
        """
        1. Identify the sentiment of the message, if one exists
        2. Identify if it is a question, greeting, check in
        3. Identify the subject, verb and object, if they exist
        """
        self.determine_message_type()
        if self.message_type not in ['GIF', 'IMAGE']:
            self.determine_sentiment()
            self.determine_parts_of_speech()      
        self.save()


class Response(models.Model):
    request = models.OneToOneField(Request, null=True, on_delete=models.SET_NULL)
    sent_at = models.DateTimeField(auto_now_add=True)
    sender = models.ForeignKey(GroupMeBot, null=True, on_delete=models.SET_NULL)
    text = models.TextField()
    image = models.URLField(null=True, blank=True)
    thought = models.ForeignKey(Thought, null=True, blank=True, on_delete=models.SET_NULL)

    def __str__(self):
        return f"{self.sender.name}: '{self.text}'"

    def find_gif(self):
        try:
            _, search_terms = self.request.text.split(' gif ')
            api_response = giphy_api_instance.gifs_search_get(
                GIPHY_API_KEY + "k1nOk2cOsKF3naPtlZF", 
                search_terms, 
                limit=10
            )
            gif = random.choice(api_response.data)
            url = gif.images.original.url
        except ApiException as e:
            print("Exception when calling DefaultApi->gifs_search_get: %s\n" % e)
            return None
        except Exception:
            raise

        return url

    def find_image(self):
        image_url = None

        _, search_terms = self.request.text.split(' image ')
        search_terms = search_terms.replace(" ", "%20")
        url =  f'https://www.googleapis.com/customsearch/v1?q={search_terms}&num=10&cx={GIS_ID}&searchType=image&key={GOOGLE_SEARCH_API_KEY}CP4PQ-z2IUhHouIR_GaLXFQ'
        response = requests.get(url)

        if response.status_code == 200:
            content = json.loads(response.content)
            if 'items' in content:
                index = random.choice(range(len(content['items'])))
                image_url = content['items'][index]['link']

        return image_url

    def greet(self):
        if self.request.sender:
            text = f'{self.request.sender_display_name}! {Phrase.get_next("QUESTION", bot=self.request.bot)}'
        else:
            text = f'MEMBER_NAME! {Phrase.get_next("QUESTION", bot=self.request.bot)}'
        return text

    def give_update(self):
        thought = Thought.objects.filter(is_update=True, used__lt=0, approved=True).annotate(models.Min('used')).order_by('used').first()
        if thought:
            if thought.used < 1:
                thought.used += 10
            else:
                thought.used +=1
            thought.save()
            if self.request.sender:
                return thought.text.replace('MEMBER_NAME', self.request.sender_display_name)
            return thought.text
        else:
            return self.greet()

    def build(self):
        request_type = self.request.message_type

        if request_type == 'GIF':
            text = self.find_gif()
            self.image = text

        elif request_type == 'IMAGE':
            text = self.find_image()

        elif request_type == 'WAIVER':
            wrapper = ESPNWrapper()
            text = wrapper.pickup()

        elif request_type == 'CHECK_IN':
            text = self.give_update()

        elif request_type == 'STANDINGS':
            text = ESPNWrapper().standings()

        elif request_type == 'QUESTION':
            sender = self.request.sender_display_name
            text = Answerer(sender=sender, request=self.request).answer()

        else:
            # approved, not updates, sorted
            thoughts = Thought.objects.filter(approved=True, is_update=False, used__lt=0).annotate(models.Min('used')).order_by('used')

            # member and sentiment
            thought = thoughts.filter(member=self.request.sender, sentiment=self.request.sentiment).first()

            # member
            if not thought:
                thought = thoughts.filter(member=self.request.sender).first()

            # nothing for this particular member, get rid of all other member thoughts
            thoughts = thoughts.filter(member__isnull=True)

            # approved, unused, sentiment
            if not thought:
                thought = thoughts.filter(sentiment=self.request.sentiment).first()

            # approved, unused
            if not thought:
                thought = thoughts.first()

            text = thought.text.replace('MEMBER_NAME', self.request.sender_display_name)

            if thought.used < 1:
                thought.used += 10
            else:
                thought.used += 1

            if random.choice([1,2,3]) in [2,3]:
                for i in range(random.choice([1,2,3])):
                    text += ' '
                    text += Phrase.get_next('EMOJI', bot=self.request.bot)

            thought.save()
        
        self.text = text.lower()
        self.save()

    def send(self):
        gif_text = self.request.text.replace(f'{self.request.bot.name} gif ', '')
        self.request.bot.send_message(self, gif_text)


class GameBot(GroupMeBot):
    PERSONALITY_CHOICES = (
        ("KIND", "Kind"),
        ("ROWDY", "Rowdy"),
    )
    personality = models.CharField(max_length=100, choices=PERSONALITY_CHOICES, default='KIND', null=True, blank=True)


class GameComment(models.Model):
    TIME_CHOICES = (
        ("START", "Start"),
        ("DRAW", "Draw"),
        ("CUT", "Cut"),
        ("PLAY", "Play"),
        ("HAND", "Hand"),
        ("CRIB", "Crib"),
        ("GAME", "Game Over"),
    )

    QUALITY_CHOICES = (
        ("POOR", "Poor"),
        ("GOOD", "Good"),
        ("SUPER", "Super"),
    )

    PERSONALITY_CHOICES = (
        ("KIND", "Kind"),
        ("ROWDY", "Rowdy"),
    )

    time = models.CharField(max_length=100, choices=TIME_CHOICES, default='DRAW', null=True, blank=True)
    personality = models.CharField(max_length=100, choices=PERSONALITY_CHOICES, default='KIND', null=True, blank=True)
    quality = models.CharField(max_length=100, choices=QUALITY_CHOICES, default='GOOD', null=True, blank=True)

    text = models.CharField(max_length=200)
    used = models.IntegerField(default=0)

    def __str__(self):
        return f'{self.text} - ({self.quality} {self.time}, {self.personality})'

    @staticmethod
    def get_next(quality, personality, time):
        comment = GameComment.objects.filter(
            personality=personality,
            quality=quality,
            time=time
        ).annotate(models.Min('used')).order_by('used')[0]

        comment.used += 1
        comment.save()

        return comment
