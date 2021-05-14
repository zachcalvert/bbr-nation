import json
import random
import requests
import spacy
import wolframalpha

from django.db import models

from bot import vocab
from content.models import Member
from football.models import Player

GROUPME_URL = "https://api.groupme.com/v3/bots/post"
WOLFRAMALPHA_KEY = "EW5XY2-H2U9WT7Y6X"

nlp = spacy.load("en_core_web_sm")
wolframalpha_instance = wolframalpha.Client(WOLFRAMALPHA_KEY)


class GroupMeBot(models.Model):
    name = models.CharField(max_length=25, null=True)
    identifier = models.CharField(max_length=100)

    def __str__(self):
        return self.name

    def send_message(self, message):
        """
        Post a message to a groupme channel
        """
        print('we are inside send_message')
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


class Request(models.Model):
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
    greeting_word = models.CharField(max_length=15, null=True, blank=True)
    bot = models.ForeignKey(GroupMeBot, null=True, on_delete=models.SET_NULL)
    subject = models.CharField(max_length=50, null=True, blank=True)
    verb = models.CharField(max_length=50, null=True, blank=True)
    direct_object = models.CharField(max_length=50, null=True, blank=True)
    is_check_in = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.sender.name}: '{self.text}' ({self.sentiment})"

    def classify(self):
        """
        1. Identify the sentiment of the message, if one exists
        2. Identify if it is a question
        3. Identify if it is a greeting
        4. Identify the subject, verb and object, if they exist
        """
        print('inside request.classify')
        if any(laugh in self.text for laugh in vocab.LAUGHS):
            self.sentiment = "LAUGHING"
        elif any(negative in self.text for negative in vocab.NEGATIVES):
            self.sentiment = "NEGATIVE"
        elif any(positive in self.text for positive in vocab.POSITIVES):
            self.sentiment = "POSITIVE"
        else:
            self.sentiment = "NEUTRAL"

        first_word = self.text.split(' ')
        if first_word and first_word[0] == 'bbot':
            first_word = first_word[1]
        else:
            first_word = first_word[0]
        
        self.greeting_word = next((word for word in vocab.GREETINGS if word in self.text), None)
        if self.greeting_word:
            self.is_greeting = True

        self.question_word = next((word for word in vocab.QUESTIONS if word in self.text), None)
        if not self.is_greeting and self.question_word or self.text[-1] == '?':
            self.is_question = True

        if any(word for word in vocab.CHECK_INS in self.text):
            self.is_check_in = True

        doc = nlp(self.text)
        middle = len(self.text.split(' ')) // 2

        span = doc[doc[middle].left_edge.i : doc[middle].right_edge.i+1]
        with doc.retokenize() as retokenizer:
            retokenizer.merge(span)
        for token in doc:
            if token.dep_ == 'nsubj':
                self.subject = str(token)
            if token.dep_ == 'ROOT' and token.pos_ == 'VERB':
                self.verb = str(token)
            if token.dep_ == 'dobj':
                self.direct_object = str(token)
        
        if not self.subject and self.text.startswith('bbot'):
            self.subject = 'bbot'
        if not self.subject and self.text.startswith('you'):
            self.subject = 'you'
        if not self.subject and self.text.startswith('i '):
            self.subject = 'i'

        self.save()

    def generate_response(self):

        self.classify()
        
        response = Response.objects.create(
            request=self,
            sender=self.bot
        )

        response.build()

        return response


class Response(models.Model):
    request = models.OneToOneField(Request, null=True, on_delete=models.SET_NULL)
    sent_at = models.DateTimeField(auto_now_add=True)
    sender = models.ForeignKey(GroupMeBot, null=True, on_delete=models.SET_NULL)
    text = models.TextField()
    image = models.URLField(null=True, blank=True)

    def build(self):
        if self.request.is_check_in:
            self.text = self.give_update()
            self.save()
            return

        if self.request.is_question:
            self.text = self.answer()
            self.save()
            return
        
        if self.request.is_greeting:
            self.text = self.greet()
            self.save()
            return
        
        thought = Thought.objects.filter(sentiment=self.request.sentiment, used=False, approved=True).order_by('?').first()

        if not thought:
            thought = Thought.objects.filter(used=0, approved=True).order_by('?').first()

        text = thought.text.replace('MEMBER_NAME', self.request.sender.name)
        self.text = text
        self.save()

        thought.used = True
        thought.save()

    def give_update(self):
        text = Thought.objects.filter(is_update=True, used=False, approved=True).order_by('?').first()
        return text.replace('MEMBER_NAME', self.request.sender.name)

    def greet(self):
        text = f'{random.choice(vocab.GREETING_RESPONSES)} {self.request.sender.name}! {random.choice(vocab.GREETING_QUESTIONS)}'
        return text
        
    def answer(self):
        question = self.request.text.replace('bbot', '')
        
        wolfram_response = wolframalpha_instance.query(question)
        try:
            answer = next(wolfram_response.results).text
            return answer
        except StopIteration:
            pass
    
        return f'I don\'t really know {self.request.question_word} {self.request.subject} {self.request.verb}'

    def send(self):
        print('inside Response.send')
        self.request.bot.send_message(self)


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
