# Generated by Django 3.1.11 on 2021-06-27 21:33

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('bot', '0014_auto_20210626_0322'),
    ]

    operations = [
        migrations.CreateModel(
            name='GameBot',
            fields=[
                ('groupmebot_ptr', models.OneToOneField(auto_created=True, on_delete=django.db.models.deletion.CASCADE, parent_link=True, primary_key=True, serialize=False, to='bot.groupmebot')),
                ('personality', models.CharField(blank=True, choices=[('KIND', 'Kind'), ('ROWDY', 'Rowdy')], default='KIND', max_length=100, null=True)),
            ],
            bases=('bot.groupmebot',),
        ),
        migrations.CreateModel(
            name='GameComment',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('time', models.CharField(blank=True, choices=[('DRAW', 'Draw'), ('POSTCUT', 'Post Cut'), ('PLAY', 'Play'), ('HAND', 'Hand'), ('CRIB', 'Crib'), ('GAME_OVER', 'Game Over')], default='DRAW', max_length=100, null=True)),
                ('personality', models.CharField(blank=True, choices=[('KIND', 'Kind'), ('ROWDY', 'Rowdy')], default='KIND', max_length=100, null=True)),
                ('quality', models.CharField(blank=True, choices=[('POOR', 'Poor'), ('GOOD', 'Good'), ('SUPER', 'Super')], default='GOOD', max_length=100, null=True)),
                ('text', models.CharField(max_length=200)),
                ('used', models.IntegerField(default=0)),
            ],
        ),
    ]
