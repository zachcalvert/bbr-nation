"""Generate random chat messages via a markov chain churning through every message ever sent in the GroupMe """
import json
import random
from spacy.lang.en.stop_words import STOP_WORDS

from django.core.management.base import BaseCommand, CommandError

from bot.groupme_messages import MESSAGES
from bot.models import Thought
from content.models import Member


with open('bot/bigram_to_bigram_model.json') as f:
    model = json.load(f)

MEMBER_NAMES = [member.name for member in Member.objects.all()] + [
    'shanye',
    'commish',
    'vino',
    ' d ',
    'lish'
]

class Command(BaseCommand):
    help = "blah"  # noqa: Django required

    def markov_respond(self, message):
        last_two = ' '.join(message.split()[-2:])
        response = []

        sentence_length = random.choice(range(5, 15))
        for i in range(sentence_length):
            try:
                phrase = random.choice(model["bigram_model"][last_two])
            except KeyError:
                return None

            response.append(phrase)
            last_two = phrase

        last_word = last_two.split(' ')[1]
        while last_word in STOP_WORDS:
            print(f'adding more so that {last_word} isnt last')
            try:
                phrase = random.choice(model["bigram_model"][last_two])
            except KeyError:
                return None

            response.append(phrase)
            last_two = phrase
            last_word = last_two.split(' ')[1]

        return ' '.join(response)

    def handle(self, *args, **options):

        for i in range(1000):
            message = random.choice(MESSAGES).lower()
            response = self.markov_respond(message)

            if response:
                for member_name in MEMBER_NAMES:
                    if member_name in response:
                        response = response.replace(member_name, 'MEMBER_NAME')

                Thought.objects.create(text=response)
                print(response)
