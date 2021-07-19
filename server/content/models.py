from django.db import models


FINISH_PLACE_MAP = {
    1: '1st',
    2: '2nd',
    3: '3rd',
    4: '4th',
    5: '5th',
    6: '6th',
    7: '7th',
    8: '8th',
    9: '9th',
    10: '10th',
    11: '11th',
    12: '12th'
}


class Member(models.Model):
    name = models.CharField(max_length=50)
    groupme_id = models.CharField(max_length=50, null=True, blank=True)
    avatar_url = models.CharField(max_length=255, null=True, blank=True)
    nfl_team = models.ForeignKey('football.NFLTeam', null=True, blank=True, on_delete=models.SET_NULL)

    def __str__(self):
        return self.name

    def get_nicks(self):
        return [n.nickname for n in Nickname.objects.filter(member=self)]

    def get_best_finish(self):
        best = 13
        year = None
        for team in self.teams.all():
            if team.final_standing < best:
                best = team.final_standing
                year = team.season.year
            if team.standing < best:
                best = team.standing
                year = team.season.year

        return f'{FINISH_PLACE_MAP[best]} in {year}'

    def get_worst_finish(self):
        worst = 1
        year = None
        for team in self.teams.all():
            if team.final_standing > worst:
                worst = team.final_standing
                year = team.season.year
            if team.standing > worst:
                worst = team.standing
                year = team.season.year

        if year == None:
            return None

        return f'{FINISH_PLACE_MAP[worst]} in {year}'


class Nickname(models.Model):
    nickname = models.CharField(max_length=100)
    member = models.ForeignKey(Member, null=True, blank=True, on_delete=models.SET_NULL, related_name='nicknames')

    def __str__(self):
        return self.nickname


class Content(models.Model):
    KIND_CHOICES = (
        ('TEXT', 'Text'),
        ('IMAGE', 'Image'),
        ('VIDEO', 'Video'),
    )
    name = models.CharField(max_length=100, null=True, blank=True, db_index=True)
    display_name = models.CharField(max_length=100, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    creator = models.ForeignKey(Member, null=True, blank=True, on_delete=models.SET_NULL, related_name='content')
    creator_nickname = models.CharField(max_length=200, null=True, blank=True)
    create_date = models.DateTimeField(null=True, blank=True)
    likes = models.IntegerField(default=0)
    upload = models.FileField(upload_to='uploads/%Y/%m/%d/', null=True, blank=True)
    text = models.TextField(null=True, blank=True)
    kind = models.CharField(max_length=10, choices=KIND_CHOICES, default='TEXT')
    avatar_url = models.CharField(max_length=255, null=True, blank=True)
    media_url = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        ordering = ['?']
        verbose_name_plural = 'Content'

    def __str__(self):
        return self.name


class Page(models.Model):
    name = models.CharField(max_length=100, null=True, blank=True)
    slug = models.SlugField(null=True, blank=True)
    contents = models.ManyToManyField(Content, null=True, blank=True, related_name='pages', through='PageContents')

    class Meta:
        ordering = ['name']

    def __str__(self):
        return str(self.name)


class PageContents(models.Model):
    """This is a junction table model that also stores the order of contents on a page."""
    page = models.ForeignKey(Page, null=True, on_delete=models.SET_NULL)
    content = models.ForeignKey(Content, null=True, on_delete=models.SET_NULL)
    content_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ('content_order',)
        verbose_name_plural = 'Page Contents'

    def __str__(self):
        if self.content:
            return self.content.display_name or self.content.name
        return 'deleted thing - DELETE ME'


class Image(models.Model):
    name = models.CharField(max_length=100)
    caption = models.TextField(null=True, blank=True)
    upload = models.FileField(upload_to='uploads/%Y/%m/%d/', null=True, blank=True)

    def __str__(self):
        return str(self.name)


class ImageSlider(models.Model):
    name = models.CharField(max_length=100, null=True)
    description = models.TextField(null=True, blank=True)
    page = models.ForeignKey(Page, null=True, blank=True, on_delete=models.SET_NULL, related_name='image_sliders')
    images = models.ManyToManyField(Image, related_name='sliders', through='ImageSliderImages')

    def __str__(self):
        return str(self.name)


class ImageSliderImages(models.Model):
    """This is a junction table model that also stores the order of images in a slider."""
    slider = models.ForeignKey(ImageSlider, null=True, on_delete=models.SET_NULL)
    image = models.ForeignKey(Image, null=True, on_delete=models.SET_NULL)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ('order',)
        verbose_name_plural = 'Slider image'
