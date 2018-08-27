const exported = function() {
    self.addEventListener('message', e => { // eslint-disable-line no-restricted-globals

        var counter = 0;

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
                    }
                  }
                }
              }
            }
        
            return output;
        }

        var output = indexDocuments(e.data);
        postMessage(output);
    })
}

export default exported;