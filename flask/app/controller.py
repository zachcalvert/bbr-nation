import json
import logging
import os
import random
import redis

redis_host = os.environ.get('REDISHOST', 'localhost')
cache = redis.StrictRedis(host=redis_host, port=6379)

logger = logging.getLogger(__name__)


def get_or_create_room(name):
    try:
        g = json.loads(cache.get(name))
    except TypeError:
        g = {
            "name": name,
            "members": set(),
        }
        cache.set(name, json.dumps(g))
    return g


def add_member(room, name):
    g = json.loads(cache.get(room))
    g['members'].add(name)
    cache.set(room, json.dumps(g))
    return g
