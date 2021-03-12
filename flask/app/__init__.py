#!/usr/bin/env python
import eventlet
eventlet.monkey_patch()

import os
import random
import redis
import time
import uuid

from flask import Flask
from flask_socketio import SocketIO, Namespace, emit, join_room, leave_room
from threading import Lock

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins=['http://localhost:3000', 'https://bbrnation.com'])
thread = None
thread_lock = Lock()

redis_host = os.environ.get('REDISHOST', 'localhost')
cache = redis.StrictRedis(host=redis_host, port=6379)


class BBRNationNamespace(Namespace):

    def on_connect(self):
        pass

    def on_disconnect(self):
        pass

    def announce(self, message, room, type=None):
        emit('chat', {'id': str(uuid.uuid4()), 'name': 'game-updater', 'message': message, 'type': type}, room=room)

    def on_member_join(self, msg):
        join_room(msg['room'])
        self.announce('{} joined'.format(msg['name']), room=msg['game'])

    def on_chat_message(self, msg):
        room = None if msg.get('private') else msg['game']
        emit('chat', {'id': str(uuid.uuid4()), 'name': msg['name'], 'message': msg['message']}, room=room)

    def on_animation(self, msg):
        emit('animation', {'id': str(uuid.uuid4()), 'name': msg['name'], 'imageUrl': msg['imageUrl']}, room=msg['game'])


socketio.on_namespace(BBRNationNamespace('/'))
