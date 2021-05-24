import json
import random
import requests
import spacy

import giphy_client
from giphy_client.rest import ApiException

from django.db import models

from bot import vocab
from content.models import Member
from football.models import Player

GIPHY_API_KEY = "qUzMZY2GSYY8y"
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
        print('got here and I shouldnt have!!!')
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
        ("GOODBYE", "GOODBYE")
    )
    SENTIMENT_CHOICES = (
        ("NEUTRAL", "NEUTRAL"),
        ("POSITIVE", "POSITIVE"),
        ("NEGATIVE", "NEGATIVE"),
        ("LAUGHING", "LAUGHING")
    )
    sentiment = models.CharField(max_length=10, choices=SENTIMENT_CHOICES, null=True)
    sender = models.ForeignKey(Member, null=True, on_delete=models.SET_NULL)
    sent_at = models.DateTimeField(auto_now_add=True)
    text = models.TextField()
    is_question = models.BooleanField(default=False)
    question_word = models.CharField(max_length=15, null=True, blank=True)
    is_greeting = models.BooleanField(default=False)
    bot = models.ForeignKey(GroupMeBot, null=True, on_delete=models.SET_NULL)
    subject = models.CharField(max_length=50, null=True, blank=True)
    verb = models.CharField(max_length=50, null=True, blank=True)
    direct_object = models.CharField(max_length=50, null=True, blank=True)
    is_check_in = models.BooleanField(default=False)
    message_type = models.CharField(max_length=20, choices=TYPE_CHOICES, null=True, blank=True)

    def __str__(self):
        return f"{self.sender.name}: '{self.text}' ({self.sentiment})"

    def determine_message_type(self):
        """
        assign as greeting, check in, question, comment, or goodbye
        """
        if f'{self.bot.name} gif' in self.text:
            self.message_type = 'GIF'
        elif f'{self.bot.name} image' in self.text:
            self.message_type = 'GIF'
        elif any(word in self.text for word in vocab.CHECK_INS):
            print('its a checkin')
            self.message_type = 'CHECK_IN'
        elif any(word in self.text for word in vocab.GREETINGS):
            self.message_type = 'GREETING'
        elif any(word in self.text for word in vocab.GOODBYES):
            self.message_type = 'GOODBYE'
        else:
            question_word = next((phrase for phrase in vocab.QUESTIONS if phrase in self.text), None)
            if question_word or self.text[-1] == '?':
                self.message_type = 'QUESTION'
                self.question_word = question_word
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

        if not self.subject and self.text.startswith(self.bot.name):
            self.subject = self.bot.name
        elif not self.subject and self.text.startswith('you'):
            self.subject = self.bot.name
        else:
            self.subject = self.sender.name

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

    def find_gif(self):
        try:
            _, search_terms = self.request.text.split(' gif ')
            api_response = giphy_api_instance.gifs_search_get(
                GIPHY_API_KEY + "k1nOk2cOsKF3naPtlZF", 
                search_terms, 
                limit=10
            )
            gif = api_response.data[random.choice(range(0,9))]
            url = gif.images.downsized_large.url
        except ApiException as e:
            print("Exception when calling DefaultApi->gifs_search_get: %s\n" % e)
            return None
        except Exception:
            raise

        return url

    def greet(self):
        text = f'{random.choice(vocab.GREETING_RESPONSES)} {self.request.sender.name}! {random.choice(vocab.GREETING_QUESTIONS)}'
        return text

    def give_update(self):
        thought = Thought.objects.filter(is_update=True, used=False, approved=True).order_by('?').first()
        if thought:
            return thought.text.replace('MEMBER_NAME', self.request.sender.name)
        else:
            print('we have no thought')
            return self.answer()
        
    def answer(self):
        answer = f'wait, {self.request.subject} {self.request.question_word} {self.request.verb}?'
        return answer

    def goodbye(self):
        return f'{random.choice(vocab.EMOJIS)}'

    def add_emojis(self):
        pass

    def build(self):
        request_type = self.request.message_type

        if request_type == 'GIF':
            text = self.find_gif()

        elif request_type == 'GREETING':
            text = self.greet()

        elif request_type == 'CHECK_IN':
            text = self.give_update()

        elif request_type == 'QUESTION':
            text = self.answer()
        
        elif request_type == 'GOODBYE':
            text = self.goodbye()
        
        else:
            thought = Thought.objects.filter(sentiment=self.request.sentiment, approved=True).order_by('?').first()
            text = thought.text.replace('MEMBER_NAME', self.request.sender.name)
            thought.used += 1
            thought.save()
        
        self.text = text
        self.save()

    def send(self):
        self.request.bot.send_message(self)
