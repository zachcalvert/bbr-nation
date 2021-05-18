from django.core.management.base import BaseCommand

from bellybot.context.movies import MOVIES
from bellybot.context.people import PLAYERS, ACTORS, TWENTY_NINETEEN_NBA, TWENTY_SIXTEEN_NBA, GENERAL_NBA, PANTHEON
from bellybot.vocab.named_entities import COLLEGE_TEAMS, NFL_TEAMS, NBA_PLAYERS, COUNTRIES, US_CITIES

NAMES = PLAYERS + NFL_TEAMS + COLLEGE_TEAMS + NBA_PLAYERS + MOVIES + ACTORS
PLACES = COUNTRIES + US_CITIES

PUN_LOOKUPS = {
    'ash': 'gash', 'ass': 'gash',
    'ab': 'stab',
    "alt": "salt", "ault": "salt",
    "and": "xand",
    "boi": "yaboy",
    "boy": "yaboy",
    "ick": "thicc", "ich": "thicc", "icc": "thicc",
    "ill": "spill",
    "in": "thin",
    "ex": "flex",
    "old": "holed", "oled": "holed",
    "ia": "chyaa",
    "lee": "fleece",
    "inc": "ink", "ink": "drink",
    "ire": "fire",
    "ahm": "bomb"
}


class Command(BaseCommand):
    help = "Generates shitty puns"  # noqa: Django required

    def pun_entry_point(self, name, lookup, replacement):
        i = name.find(lookup)
        while i > 0:
            if name[i - 1] in ['a', 'e', 'i', 'o', 'u', ' ']:
                break
            else:
                i -= 1
        return i

    def handle(self, *args, **options):
        nicknames = []
        for name in PANTHEON:
            try:
                name = name.lower()
            except AttributeError:
                continue

            for lookup, pun in PUN_LOOKUPS.items():
                if lookup in name:
                    entry_point = self.pun_entry_point(name, lookup, pun)
                    exit_point = entry_point + len(lookup)
                    new_name = name[:entry_point] + pun + name[exit_point:]

                nicknames.append(new_name)
        print(nicknames)
