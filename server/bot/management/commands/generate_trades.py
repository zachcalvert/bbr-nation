from django.core.management.base import BaseCommand

from bellybot.espn_wrapper import ESPNWrapper


class Command(BaseCommand):
    help = "Generates shitty trades"  # noqa: Django required

    user_id = '30803449'

    def handle(self, *args, **options):
        wrapper = ESPNWrapper()
        for i in range(25):
            print(wrapper.recommend_trade(self.user_id))
