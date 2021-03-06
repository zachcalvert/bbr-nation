import random

from bot import vocab
from football.models import NFLTeam, Player
from vocab.models import Person, Phrase, Place, TeamName


class Answerer:

    def __init__(self, sender, request):
        super().__init__()
        self.sender = sender
        self.request = request
        self.question = request.text
        self.trigger = request.question_word
        self.player = self.get_player()

    @staticmethod
    def question_word(message):
        return next((phrase for phrase in QUESTION_SWITCHER.keys() if phrase in message), None)

    def answer(self):
        fn = QUESTION_SWITCHER[self.trigger]
        return fn(self)

    def _build_answer(self, confirm=True, core=None, suffix=True, emojis=True):
        answer = ''
        PUNCTUATIONS = ['!', '!', '.', ',', '...', '. .', ' "', ":", "! !"]
        core_punc = random.choice(PUNCTUATIONS)

        if confirm:
            yes = Phrase.get_next('YES')
            answer += f'{yes}{random.choice(PUNCTUATIONS)} '
        
        if core:
            answer += f'{core}{core_punc} '

        if suffix:
            suffix = Phrase.get_next('SUFFIX')
            answer += f'{suffix} '
            if core_punc == ' "':
                answer += '"'
        
        if emojis and random.choice([1,2]) == 1:
            for i in range(random.choice([1,2])):
                answer += Phrase.get_next('EMOJI')

        answer = " ".join(answer.split())  # remove any duplicate spaces
        return answer

    def _make_subject_swaps(self, core):
        return core.replace(' my ', ' your ')\
            .replace(' mine ', ' yours ')\
            .replace(' me ', ' you ')\
            .replace('bbot', '')\
            .replace(' i ', ' you ')\
            .replace('yours', 'mine') \
            .replace('your', 'my') \
            .replace('you', 'me')\
            .replace('though', '')\
            .replace('yet', '')\
            .replace('ever', '')\
            .replace('even', '')\
            .replace('us', 'you guys')

    def _build_core(self, prefix):
        _, core = self.question.split(self.trigger)
        if '?' in core:
            core, _ = core.split('?', 1)
        core = self._make_subject_swaps(core)
        return f'{prefix} {core}'

    def how(self):
        choices = ['knows', 'did it once', 'could tell you', 'is who you wanna ask', 'knows']
        core = f'{Person.get_next()} {random.choice(choices)}'
        return self._build_answer(confirm=False, core=core, suffix=True, emojis=True)

    def what(self):
        if ' pick ' in self.question and ' draft ' in self.question:
            choices = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'tenth']
            core = f"{random.choice(choices)} overall"
        elif 'you think' in self.question:
            choices = ['honestly', 'actually', '', '. . .', 'yo', 'ay', 'eyaww']
            core = f"{random.choice(choices)} i think it's {Phrase.get_next('ADJECTIVE')}"
        else:
            core = Phrase.get_next('THING')
        return self._build_answer(confirm=False, core=core, suffix=True, emojis=True)

    def when(self):
        time = Phrase.get_next('TIME')
        return self._build_answer(confirm=False, core=time, suffix=True)

    def where(self):
        core = Place.get_next()
        return self._build_answer(confirm=False, core=core, suffix=True)

    def who(self):
        if 'pierc' in self.question or ' stab' in self.question:
            choices = ['bk tha gawd', 'rene', 'shane', 'trav', 'lish', 'rock', 'walsh', 'squirma', 'd', 'shanye', 'rene', 'greg']
            core = f"{random.choice(choices)}"
            return self._build_answer(confirm=False, core=core, suffix=True)

        elif ' draft' in self.question:
            core = Player.objects.filter(stud=True).order_by('?').first().name
            return self._build_answer(confirm=False, core=core, suffix=True)

        elif ' win ' in self.question:
            if any(['this year', 'the ship', 'it all', 'championship', 'trophy']) in self.question:
                choices = ['bk tha gawd', 'rene', 'shane', 'trav', 'lish', 'rock', 'walsh', 'squirma', 'd', 'shanye', 'rene', 'greg']
                core = f"{random.choice(choices)}"
                return self._build_answer(confirm=False, core=core, suffix=True)
            else:
                choices = ['i put 100 on the', 'i bet on the', '', 'easy. the', 'no doubt in my mind, the', '']
                team = NFLTeam.objects.order_by('?').first()
                core = f"{random.choice(choices)} {team}"

        elif ' bet ' in self.question:
            choices = ['i put 100 on the', 'i bet on the', '', 'easy. the', 'no doubt in my mind, the', '']
            team = NFLTeam.objects.order_by('?').first()
            core = f"{random.choice(choices)} {team}"

        else:
            core = Person.get_next()

        return self._build_answer(confirm=False, core=core, suffix=True)

    def why(self):
        reason = random.choice(vocab.REASON_PREFIXES)

        core = f'{reason} '
        if random.choice([1,2]) == 1:
            choices = [
                "said it would be",
                "is",
                "was",
                "made me",
                "makes me",
                "has me",
            ]
            core += f'{Person.get_next()} {random.choice(choices)} {Phrase.get_next("ADJECTIVE")}'
        else:
            core += f'{Phrase.get_next("THING")}'
        return self._build_answer(confirm=False, core=core, suffix=True)

    def are_you(self):
        return self._build_answer(confirm=True, suffix=True)

    def did_you(self):
        occurrence = Phrase.get_next('OCCURRENCE')
        return self._build_answer(confirm=True, core=occurrence, suffix=True)

    def do_you(self):
        first_punc = '!' if random.choice([1, 2]) == 1 else '.'
        adverb = Phrase.get_next('ADVERB') if random.choice([1, 2]) == 1 else ''
        prefix = '{}{} i {} do'.format(self.sender, first_punc, adverb)
        core = self._build_core(prefix)
        return self._build_answer(confirm=True, core=core, suffix=True)

    def have_you(self):
        occurrence = Phrase.get_next('OCCURRENCE')
        return self._build_answer(confirm=True, core=occurrence, suffix=True)

    def will_you(self):
        occurrence = Phrase.get_next('OCCURRENCE')
        return self._build_answer(confirm=True, core=occurrence, suffix=True)

    def wanna(self):
        first_punc = '!' if random.choice([1, 2]) == 1 else '.'
        adverb = Phrase.get_next('ADVERB') if random.choice([1, 2]) == 1 else ''
        prefix = '{}{} i {} wanna'.format(self.sender, first_punc, adverb)
        core = self._build_core(prefix)
        return self._build_answer(confirm=True, core=core, suffix=True)

    def get_player(self):
        # for player in NFL_PLAYERS.keys():
        #     if player in self.message:
        #         return NFL_PLAYERS[player]['full_name']
        return None

    def right(self):
        choices = ['fucking right', 'damn straight', 'that\'s right', 'you know it', '????']
        core = '{} {}'.format(random.choice(choices), self.sender)
        return self._build_answer(confirm=False, core=core, suffix=True)

    def chyaa(self):
        chya = 'chya' + 'a'*random.choice([2,3,4,5,6,7,8])
        core = '{} {}'.format(chya, self.sender)
        return self._build_answer(confirm=False, core=core, suffix=True, emojis=True)

    def eyaww(self):
        eyaw = 'eyaw' + 'w'*random.choice([2,3,4,5,6,7,8])
        core = '{}!'.format(eyaw)
        return self._build_answer(confirm=False, core=core, suffix=True, emojis=True)

    def nickname(self):
        name = TeamName.get_next()
        prefixes = ['your new name is', 'how about', 'why dont you try on', 'how bout', 'why not', 'the name that comes to mind is', 'ok,']
        core = f'{random.choice(prefixes)} {name}'.format(name)
        return self._build_answer(confirm=False, core=core, suffix=True, emojis=True)


QUESTION_SWITCHER = {
    'when': Answerer.when,
    'where': Answerer.where,
    'what time': Answerer.when,
    'what': Answerer.what,
    'who': Answerer.who,
    'why': Answerer.why,
    'how': Answerer.how,
    'are you': Answerer.are_you,
    'did you': Answerer.did_you,
    'do you': Answerer.do_you,
    'have you': Answerer.have_you,
    'will you': Answerer.will_you,
    'right?': Answerer.right,
    'right bbot?': Answerer.right,
    'wanna': Answerer.wanna,
    'want to': Answerer.wanna,
    'chya': Answerer.chyaa,
    'eyaw': Answerer.eyaww,
    'gonna': Answerer.wanna,
    'nickname': Answerer.nickname
}
