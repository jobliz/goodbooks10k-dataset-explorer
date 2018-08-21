# TODO: not currently used

import csv
import redis

r = redis.Redis()
key = "goodbooks-tags"

r.delete(key)

with open('tags.csv', newline='') as csvfile:
    reader = csv.reader(csvfile, delimiter=',')
    for item in reader:
        r.lpush(key, item[1])

print(r.llen(key))
