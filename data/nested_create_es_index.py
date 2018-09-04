import re
import os
import sys
import csv

from elasticsearch_dsl.connections import connections
from elasticsearch_dsl import DocType, Text, Date, Search
from elasticsearch import Elasticsearch
from elasticsearch_dsl import DocType, Nested, Keyword, Integer
from elasticsearch_dsl import Index

import certifi

if os.environ['UPDATE_ES_INDEX'] != 'YES':
    sys.exit()

if os.environ['NODE_ENV'] == 'production':
    # https://docs.bonsai.io/docs/python
    bonsai = os.environ['ES_HOST']
    auth = re.search('https\:\/\/(.*)\@', bonsai).group(1).split(':')
    host = bonsai.replace('https://%s:%s@' % (auth[0], auth[1]), '')
    es_header = [{
        'host': host,
        'port': 443,
        'use_ssl': True,
        'http_auth': (auth[0],auth[1])
    }]
    es = Elasticsearch(es_header)
else:
    es = Elasticsearch()

ess = Search(using=es)

ES_MEDIA_INDEX = 'goodbooks10k'
ES_MEDIA_TYPE = 'books'
ES_MEDIA_ID_FIELD = 'id'

bulk_data = []

if es.indices.exists(ES_MEDIA_INDEX):
    print("deleting '%s' index..." % (ES_MEDIA_INDEX))
    res = es.indices.delete(index = ES_MEDIA_INDEX)
    print(" response: '%s'" % (res))

es.indices.create(index=ES_MEDIA_INDEX, body={
    "settings": {
        "number_of_shards": 1,
        "number_of_replicas": 0,
        "index": {
            "analysis": {
                "filter": {},
                "analyzer": {
                    "keyword_analyzer": {
                        "filter": [
                            "lowercase",
                            "asciifolding",
                            "trim"
                        ],
                        "char_filter": [],
                        "type": "custom",
                        "tokenizer": "keyword"
                    },
                    "edge_ngram_analyzer": {
                        "filter": [
                            "lowercase"
                        ],
                        "tokenizer": "edge_ngram_tokenizer"
                    },
                    "edge_ngram_search_analyzer": {
                        "tokenizer": "lowercase"
                    }
                },
                "tokenizer": {
                    "edge_ngram_tokenizer": {
                        "type": "edge_ngram",
                        "min_gram": 2,
                        "max_gram": 5,
                        "token_chars": [
                            "letter"
                        ]
                    }
                }
            }
        }
    }
})

es.indices.put_mapping(
    index=ES_MEDIA_INDEX,
    doc_type=ES_MEDIA_TYPE,
    body={
        "properties": {  
            "title": {
                "type": "text",
                "fields": {
                    "keywordstring": {
                        "type": "text",
                        "analyzer": "keyword_analyzer"
                    },
                    "edgengram": {
                        "type": "text",
                        "analyzer": "edge_ngram_analyzer",
                        "search_analyzer": "edge_ngram_search_analyzer"
                    },
                    "completion": {
                        "type": "completion"
                    }
                },
                "analyzer": "standard"
            }
        }
    }
)

with open('./data/new_nested_tags.csv', newline='') as csvfile:
    reader = csv.DictReader(csvfile, delimiter=',')
    for item in reader:
        tag_id_name_pairs = item['tags'].split("|")
        splitted = [pair.split('_') for pair in tag_id_name_pairs]
        
        tag_list = []
        tag_nested = []

        for pair in splitted:
            tag_list.append(pair[1])
            tag_nested.append({
                'id': pair[0],
                'name': pair[1]
            })

        data_dict = {
            'id': item['work_id'],
            'work_id': item['work_id'],
            'isbn': item['isbn'],
            'isbn13': item['isbn13'],
            'original_publication_year': item['original_publication_year'],
            'title': item['title'],
            'original_title': item['original_title'],
            'authors': item['authors'],
            'ratings_1': item['ratings_1'],
            'ratings_2': item['ratings_2'],
            'ratings_3': item['ratings_3'],
            'ratings_4': item['ratings_4'],
            'ratings_5': item['ratings_5'],
            'tag_list': tag_list,
            'tag_nested': tag_nested
        }

        op_dict = {
            "index": {
                "_index": ES_MEDIA_INDEX,
                "_type": ES_MEDIA_TYPE,
                "_id": data_dict[ES_MEDIA_ID_FIELD]
            }
        }

        bulk_data.append(op_dict)
        bulk_data.append(data_dict)

es.bulk(index=ES_MEDIA_INDEX, body=bulk_data, refresh=True, request_timeout=10000)
print("Finished bulk loading!")
