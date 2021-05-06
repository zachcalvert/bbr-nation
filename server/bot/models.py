import json
import requests

from django.db import models

from content.models import Member

GROUPME_URL = "https://api.groupme.com/v3/bots/post"


class GroupMeBot(models.Model):
    name = models.CharField(max_length=25, null=True)
    identifier = models.CharField(max_length=100)

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
    question = models.BooleanField(default=False)
    bot = models.ForeignKey(GroupMeBot, null=True, on_delete=models.SET_NULL)

    def __str__(self):
        return f"{self.sender.name}: '{self.text}' ({self.sentiment})"

    def classify(self):
        laughs = {'lol', 'loll', 'lolll', 'lolll', 'lmao', 'lmaoo', 'lmaooo', 'haha', 'lmfao', '😂', '🤣', '😅', '😆'}
        negatives = {'bruh', 'wtf', 'not cool', 'not chill', 'no chill', 'damn bro', 'damn dude', 'damn bbot', 'fuck you', 'fuck off', 'bad bot'}
        positives = {'yess', 'yesss', 'yaww', 'yawww', 'chya', 'chyaa', 'chyaaa', 'hell ye', 'hell ya', 'yes bbot', 'fuck ye', 'love it', 'my man', 'my guy', 'bro', '!', 'thank you', 'thanks', 'absolutely'}
        questions = {'how', 'what', 'when', 'who', 'why', 'wanna', 'want', 'are', 'did', 'do', 'have', 'will', 'can'}

        if any(laugh in self.text for laugh in laughs):
            self.sentiment = "LAUGHING"
        elif any(negative in self.text for negative in negatives):
            self.sentiment = "NEGATIVE"
        elif any(positive in self.text for positive in positives):
            self.sentiment = "POSITIVE"
        else:
            self.sentiment = "NEUTRAL"

        first_word = self.text.split(' ')
        if any(first_word[0].startswith(question) for question in questions):
            self.question = True

        if self.text[-1] == '?':
            self.question = True
        
        self.save()        

    def answer(self):
        return ''

    def reply(self):
        return ''

    def generate_response(self):

        self.classify()

        if self.question:
            text = self.answer()
        else:
            text = self.reply()
        
        response = Response.objects.create(
            request=self,
            sender=self.bot,
            text=text
        )

        return response


class Response(models.Model):
    request = models.OneToOneField(Request, null=True, on_delete=models.SET_NULL)
    sent_at = models.DateTimeField(auto_now_add=True)
    sender = models.ForeignKey(GroupMeBot, null=True, on_delete=models.SET_NULL)
    text = models.TextField()
    image = models.URLField(null=True, blank=True)

    def send(self):
        self.request.bot.send_message(self)
