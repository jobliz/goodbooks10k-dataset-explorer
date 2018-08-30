const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const app = express();

if(process.env.ES_HOST === undefined) {
  console.log("FATAL ERROR: ES_HOST environment variable is not set.");
  process.exit(1);
}

/**
 * Creates the elasticsearch query for aggregating tag data. 
 */
function queryForFetchingTags(size) {
  return {
    "aggs": {
      "byTag": {
        "terms": {
          "field": "tag_nested.name.keyword",
          "size": size
        }
      }
    },
    "size": 0
  };
}

/**
 * Creates the book search elasticsearch query.
 */
function queryForSearchingBooks(title, select_with, select_without) {
  var with_list = [];
  var without_list = [];
  var query = {"from" : 0, "size" : 50, "query":{"bool": {}}};

  // search by title
  if(title !== '') {
    query['query']['bool']['filter'] = {
      "match" : {
        "title": {
          "query": title,
          "operator": "and"
        }
      }
    }
  }

  // if there are tags to be searched, add them to the query
  if(select_with !== "") {
    select_with.split(',').map((item) => {
      with_list.push({"match": {"tag_nested.name.keyword": item}})
    })
    query['query']['bool']['must'] = with_list;
  }

  // if there are tags to be ommited, add them to the query
  if(select_without !== "") {
    select_without.split(',').map((item) => {
      without_list.push({"match": {"tag_nested.name.keyword": item}})
    })
    query['query']['bool']['must_not'] = without_list;
  }

  return query;
}

function getTags(req, res) {
  const endpoint = process.env.ES_HOST + '/goodbooks10k/books/_search';
  const size = req.params.size;
  const params = {
    params: {
      source: JSON.stringify(queryForFetchingTags(size)),
      source_content_type: 'application/json'
    }
  }
  
  axios.get(endpoint, params).then((res2) => {
    var title_list = [];
    var count_list = [];

    res2.data.aggregations.byTag.buckets.map((bucket) => {
      title_list.push(bucket.key);
      count_list.push(bucket.doc_count);
    });

    res.send({
      success: true,
      title_list: title_list,
      count_list: count_list
    })
  }).catch((error) => {
    console.log("Error 500 on getAllTags called with size=" + size);
    console.log(error);
    res.status(500);
    res.send({
      success: false
    })
  });
}

/**
 * Request handler for book search.
 * 
 * Remeember that select_with and select_without are passed by the React
 * UI as comma-separated strings like tag1,tag2,tag3.
 */
function searchBooks(req, res) {
  const endpoint = process.env.ES_HOST + '/goodbooks10k/books/_search';
  var title_search = req.body.title_search;
  var select_with = req.body.select_with;
  var select_without = req.body.select_without;

  if(title_search === undefined) { title_search = ""};
  if(select_with === undefined) { select_with = ""};
  if(select_without === undefined) { select_without = ""};

  if(typeof(title_search) !== 'string') {
    res.status(400);
    res.send({success: false, error: 'title_search must be a string'});
  }

  if(typeof(select_with) !== 'string')  {
    res.status(400);
    res.send({success: false, error: 'select_with must be a string'});
  }

  if(typeof(select_without) !== 'string') {
    res.status(400);
    res.send({success: false, error: 'select_without must be a string'});
  }

  const params = {
    params: {
      source: JSON.stringify(queryForSearchingBooks(title_search, select_with, select_without)),
      source_content_type: 'application/json'
    }
  };

  axios.get(endpoint, params).then((res2) => {
    var results = [];
    res2.data.hits.hits.map((hit) => {
      results.push(hit._source);
    });
    res.send({success: true, data: results})
  }).catch((error) => {
    console.log("Error 500 on searchBooks called with payload:");
    console.log(payload);
    console.log(error);
    res.status(500);
    res.send({success: false});
  });
}

/**
 * Redirects unmatched requests to the elasticsearch host
 * for GET requests, acting as a proxy for reading data. 
 */
function redirectUnmatchedGetToElasticsearch(req, res) {
  if (req.method == "GET") {
    const url = process.env.ES_HOST + req.originalUrl;
    
    // console.log(req.body);
    // console.log(req.params);
    // console.log(req.query);

    if(typeof(req.body) === "object") {
      var promise = axios.get(url, {
        params: {
          source: JSON.stringify(req.body),
          source_content_type: 'application/json'
        }
      });
    } else {
      var promise = axios.get(url);
    }

    promise.then((response) => {
      res.send(response.data);
    }).catch((error) => {
      console.log("ERROR:");
      console.log(error);
      res.send({'error': 'check output'});
    });
  } else {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ error: 'ONLY_GET_REQUESTS_ALLOWED' }));
  }
}

// set CORS headers
app.all('/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

app.use(express.static(__dirname + '/build'));
app.use(bodyParser.json());
app.get('/api/v1/tags/:size(\\d+)/', getTags);
app.get('/api/v1/search_books', searchBooks);
app.use(redirectUnmatchedGetToElasticsearch);
app.listen(process.env.PORT || 8080);
console.log("Server.js started.");