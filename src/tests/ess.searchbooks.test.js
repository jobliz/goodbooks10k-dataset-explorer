import ElasticSearchService from './../services/ElasticSearchService';

var path=require('path');
var lib=path.join(path.dirname(require.resolve('axios')),'lib/adapters/http');
var http=require(lib);

test('elasticsearchservice searchBooks, one hundred, three results', () => {
  var ess = new ElasticSearchService(process.env.ES_PROXY);
  ess.setAxiosAdapter(http);

  const title_search = "one hundred";
  const select_with = "";
  const select_without = "";
  
  ess.searchBooks(title_search, select_with, select_without).then((res) => {
    var results = [];

    res.data.hits.hits.map((hit) => {
      results.push(hit._source);
    });
    
    expect(results.length).toEqual(3);
  });

});

test('elasticsearchservice searchBooks, one hundred and magic realism, one result', () => {
  var ess = new ElasticSearchService(process.env.ES_PROXY);
  ess.setAxiosAdapter(http);

  const title_search = "one hundred";
  const select_with = "magic-realism";
  const select_without = "";
  
  ess.searchBooks(title_search, select_with, select_without).then((res) => {
    var results = [];

    res.data.hits.hits.map((hit) => {
      results.push(hit._source);
    });
    
    expect(results.length).toEqual(1);
  });
  
});

test('elasticsearchservice searchBooks, one hundred and no magic realism, two results', () => {
  var ess = new ElasticSearchService(process.env.ES_PROXY);
  ess.setAxiosAdapter(http);

  const title_search = "one hundred";
  const select_with = "";
  const select_without = "magic-realism";
  
  ess.searchBooks(title_search, select_with, select_without).then((res) => {
    var results = [];

    res.data.hits.hits.map((hit) => {
      results.push(hit._source);
    });
    
    expect(results.length).toEqual(2);
  });
  
});