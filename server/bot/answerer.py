import random

from bot import vocab
from vocab.models import Person, Phrase, Place


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

        if confirm:
            yes = Phrase.get_next('YES')
            answer += f'{yes} '
        
        if core:
            answer += f'{core}! '
        
        if suffix:
            suffix = Phrase.get_next('SUFFIX')
            answer += f'{suffix} '
        
        if emojis:
            if random.choice([[1,2]]) == 1:
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
        return self._build_answer(confirm=False, suffix=True, emojis=True)

    def what(self):
        return self._build_answer(confirm=False, suffix=True, emojis=True)

    def when(self):
        time = Phrase.get_next('TIME')
        return self._build_answer(confirm=False, core=time, suffix=True)

    def where(self):
        core = Place.get_next()
        return self._build_answer(confirm=False, core=core, suffix=True)

    def who(self):
        core = Person.get_next()
        return self._build_answer(confirm=False, core=core, suffix=True)

    def why(self):
        reason = random.choice(vocab.REASON_PREFIXES)
        core = f'{reason} {Person.get_next()} said it would be litty'
        return self._build_answer(confirm=False, core=core, suffix=True)

    def are_you(self):
        return self._build_answer(confirm=True, suffix=True)

    def did_you(self):
        return self._build_answer(confirm=True, suffix=True)

    def do_you(self):
        first_punc = '!' if random.choice([1, 2]) == 1 else '.'
        adverb = Phrase.get_next('ADVERB') if random.choice([1, 2]) == 1 else ''
        prefix = '{}{} i {} do'.format(self.sender, first_punc, adverb)
        core = self._build_core(prefix)
        return self._build_answer(confirm=True, core=core, suffix=True)

    def have_you(self):
        core = self._build_core('i have')
        return self._build_answer(confirm=True, core=core, suffix=True)

    def will_you(self):
        core = self._build_core('i will')
        return self._build_answer(confirm=True, core=core, suffix=True)

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
        choices = ['fucking right', 'damn straight', 'that\'s right', 'you know it', '💯']
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


QUESTION_SWITCHER = {
    'when': Answerer.when,
    'where': Answerer.where,
    'who': Answerer.who,
    'are you': Answerer.are_you,
    'did you': Answerer.did_you,
    'do you': Answerer.do_you,
    'have you': Answerer.have_you,
    'will you': Answerer.will_you,
    'right?': Answerer.right,
    'right bbot?': Answerer.right,
    'wanna': Answerer.wanna,
    'want to': Answerer.wanna,
    'chyaa': Answerer.chyaa,
    'eyaww': Answerer.eyaww,
    'gonna': Answerer.wanna
}
