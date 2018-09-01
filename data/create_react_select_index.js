/*
This script remains here for memory purposes.

It attempts to build the react-select-fast-filter-option
on the server, but it fails wit 'JavaScript heap out of memory'
*/

const fs = require('fs');
const axios = require('axios');
const json = require('big-json');

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

function getNestedFieldValue(object, path) {
    path = path || [];
    object = object || {};
  
    var value = object;
  
    // walk down the property path
    for (var i = 0; i < path.length; i++) {
      value = value[path[i]];
  
      if (value == null) {
        return null;
      }
    }
  
    return value;
}

function expandTokenFromAllSubstringStrategy(token) {
    var expandedTokens = [];
    var string;

    for (var i = 0, length = token.length; i < length; ++i) {
      string = '';

      for (var j = i; j < length; ++j) {
        string += token.charAt(j);
        expandedTokens.push(string);
      }
    }

    return expandedTokens;
}

const SIMPLE_TOKENIZER_REGEX = /[^a-zа-яё0-9\-']+/i;

function simpleTokenize(text) {
    return text
      .split(SIMPLE_TOKENIZER_REGEX)
      .filter(function (text) {
        return text;
      } // Filter empty tokens
    );
}

// TODO: find out why typeof output[expandedToken] makes the browser throw an 
// error: '_typeof not defined'. this function avoids that problem...
// https://javascriptweblog.wordpress.com/2011/08/08/fixing-the-javascript-typeof-operator/
var toType = function(obj) {
  return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase()
}

function sanitizeLowerCase(text) {
  return text ? text.toLocaleLowerCase().trim() : '';
}

function indexDocuments(documents, _searchableFields) {
    const uidFieldName = 'label';
    _searchableFields = ['label'];
    
    var output = {};
    var count = 0;

    for (var di = 0, numDocuments = documents.length; di < numDocuments; di++) {
      var doc = documents[di];
      var uid;

      if (uidFieldName instanceof Array) {
        uid = getNestedFieldValue(doc, uidFieldName);
      } else {
        uid = doc[uidFieldName];
      }

      for (var sfi = 0, numSearchableFields = _searchableFields.length; sfi < numSearchableFields; sfi++) {        
        var fieldValue;
        var searchableField = _searchableFields[sfi];

        if (searchableField instanceof Array) {
          fieldValue = getNestedFieldValue(doc, searchableField);
        } else {
          fieldValue = doc[searchableField];
        }

        if (
          fieldValue != null &&
          typeof fieldValue !== 'string' &&
          fieldValue.toString
        ) {
          fieldValue = fieldValue.toString();
        }

        if (typeof fieldValue === 'string') {
          // var fieldTokens = tokenizer.tokenize(sanitizer.sanitize(fieldValue));
          var fieldTokens = simpleTokenize(sanitizeLowerCase(fieldValue));
          

          for (var fti = 0, numFieldValues = fieldTokens.length; fti < numFieldValues; fti++) {
            var fieldToken = fieldTokens[fti];
            // var expandedTokens = indexStrategy.expandToken(fieldToken);
            var expandedTokens = expandTokenFromAllSubstringStrategy(fieldToken);

            for (var eti = 0, nummExpandedTokens = expandedTokens.length; eti < nummExpandedTokens; eti++) {
              var expandedToken = expandedTokens[eti];

                if (toType(output[expandedToken]) !== 'object') {
                  output[expandedToken] = {};
                }
               output[expandedToken][uid] = doc;
               count += 1;
               console.log(count);
            }
          }
        }
      }
    }

  return output;
}

const endpoint = process.env.ES_HOST + '/goodbooks10k/books/_search';

axios.get(endpoint, {
  params: {
    source: JSON.stringify(queryForFetchingTags(40000)),
    source_content_type: 'application/json'
  }
}).then((res) => {
  var list = [];
  res.data.aggregations.byTag.buckets.map((bucket) => {
    list.push({label: bucket.key});
  });
  console.log("Finished list");

  var something = indexDocuments(list);

  const stringifyStream = json.createStringifyStream({
    body: something
  });

  fs.truncateSync('select_index.json');
  var writer = fs.createWriteStream('select_index.json');
  var count = 0;

  stringifyStream.on('data', function(strChunk) {
    writer.write(strChunk);
    console.log("Writer " + count);
    count += 1;
  });
  console.log("Finished");
  // fs.writeFileSync('select_index.json', JSON.stringify(something));
}).catch((error) => {
  console.log("Some error happened");
  console.log(error);
});