Goodbooks10K dataset search tool
================================

A simple React Elasticsearch tool to explore the 
[Goodbooks10k dataset](https://github.com/zygmuntz/goodbooks-10k/) 
allowing filtering by book title and user tags, built using 
[light-bootstrap-dashboard-react](https://github.com/creativetimofficial/light-bootstrap-dashboard-react/).
It is meant to be a simple showcase for how to use ElasticSearch to search
for tagged documents.

Installation
------------

* Run `npm install`

Data loading
------------

Currently the way to load the data to an elasticsearch instance is through
the `nested_create_es_index.py` script, after decompressing the `data/data.7z`
file. You will need to install the `elasticsearch-py` package for it to work.
If you want to build the `new_nested_tags.csv` file yourself from the raw
goodbooks-10k files you'll also need to install pandas into a python
environment.

After running the index creation script, it is recommended to explore it
interactively in Kibana. The basic query used by this project is an
aggregation of the form:

```
GET /goodbooks10k/books/_search
{ 
  "aggs": {
        "byTag": {
          "terms": {
            "field": "tag_nested.name.keyword",
            "size": 40000
          }
        }
      },
  "size": 0
}
```

Where the size set to `40000` tells the aggregation to load every tag 
in the dataset, and the size set to `0` in the outer query tells 
ElasticSearch to omit search results, as we are only interested in 
the aggregated data.

Gotchas
-------

* react-select package is fixed at version 1.2.1 in package.json due to 
[this issue](https://github.com/JedWatson/react-select/issues/2452),
from reading
[this other issue](https://github.com/JedWatson/react-select/issues/1324).

* Elasticsearch is prone to backwards-incompatible changes, so keep in mind
that the aggregation currently used in this project might not work as 
expected in future versions of ElasticSearch (higher than 6). When trying 
the main aggregation in Kibana with size `40000`, the response area will 
also show the following warning message.

```
#! Deprecation: This aggregation creates too many buckets (10001) and will throw an error in future versions. You should update the [search.max_buckets] cluster setting or use the [composite] aggregation to paginate all buckets in multiple requests.
```

If you are getting this message, try changing the `search.max_buckets` as indicated. If it still doesn't work or other error comes up, please open an issue.