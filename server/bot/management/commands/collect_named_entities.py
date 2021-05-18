""" Collect all the named_entities ever sent """
import json
import requests
import spacy

from django.core.management.base import BaseCommand, CommandError

nlp = spacy.load("en_core_web_sm")

BASE_URL = "https://api.groupme.com/v3/"
GROUP_ID = "16191637"
TOKEN = "kUtmZNokfpZvOE8KrOw1tb7cF15wZ3h55Vxk0T34"


class Command(BaseCommand):
    help = "Collects messages sent within a given groupme group"  # noqa: Django required

    def handle(self, *args, **options):

        starting_message_id = None
        groupme_messages = []
        for i in range(300):

            messages_url = f"{BASE_URL}groups/{GROUP_ID}/messages?token={TOKEN}&limit=100"

            if starting_message_id:
                messages_url += f"&before_id={starting_message_id}"

            response = requests.get(messages_url)

            if response.status_code == 200:
                content = json.loads(response.content.decode())
                message_list = content['response']['messages']

                for message in message_list:
                    if message['sender_type'] != 'bot' and message['text']:
                        groupme_messages.append('{}'.format(message['text'].lower().replace('\n', '')))

                    try:
                        next_message = message_list[message_list.index(message) + 1]
                    except IndexError:
                        starting_message_id = message['id']
                        continue

            else:
                print(response)

            print('retrieved {} out of 500 batches'.format(i))

        # collect each named entity in the list
        named_entities = []
        for count, groupme_message in enumerate(groupme_messages):
            print(f'tokenizing message {count}')
            doc = nlp(groupme_message)
            for ent in doc.ents:
                named_entities.append(ent.text)

        model_json = {"named_entities": named_entities}

        with open('named_entities.json', 'w') as f:
            json.dump(model_json, f)

        print(named_entities)