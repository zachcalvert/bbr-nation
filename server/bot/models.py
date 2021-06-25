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

    def send_message(self, message):
        """
        Post a message to a groupme channel
        """
        body = {
            "bot_id": self.identifier,
            "text": message.text
        }

        if message.image:
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
        if self.sender:
            return f"{self.sender.name}: '{self.text}' ({self.message_type} - {self.sentiment})"
        else:
            return f"{self.sender_name}: '{self.text}' ({self.message_type} - {self.sentiment})"

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
            if 'you' in self.text:
                self.subject = 'i'
            else:
                self.subject = self.sender.name if self.sender else self.sender_name

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
            url = gif.images.downsized_large.url
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
            text = f'{self.request.sender.name}! {Phrase.get_next("QUESTION")}'
        else:
            text = f'MEMBER_NAME! {Phrase.get_next("QUESTION")}'
        return text

    def give_update(self):
        thought = Thought.objects.filter(is_update=True, used=False, approved=True).order_by('?').first()
        if thought:
            thought.used +=1
            thought.save()
            if self.request.sender:
                return thought.text.replace('MEMBER_NAME', self.request.sender.name)
            return thought.text
        else:
            return self.greet()

    def build(self):
        request_type = self.request.message_type

        if request_type == 'GIF':
            text = self.find_gif()

        elif request_type == 'IMAGE':
            text = self.find_image()

        elif request_type == 'GREETING':
            text = self.greet()

        elif request_type == 'CHECK_IN':
            text = self.give_update()

        elif request_type == 'STANDINGS':
            text = ESPNWrapper().standings()

        elif request_type == 'QUESTION':
            sender = self.request.sender if self.request.sender else self.request.sender_name
            text = Answerer(sender=sender, request=self.request).answer()
        
        else:
            thought = Thought.objects.filter(used=0, sentiment=self.request.sentiment, approved=True).order_by('?').first()
            if self.request.sender:
                text = thought.text.replace('MEMBER_NAME', self.request.sender.name)
            else:
                text = though.text
            thought.used += 1
            thought.save()
        
        self.text = text.lower()
        self.save()

    def send(self):
        self.request.bot.send_message(self)
