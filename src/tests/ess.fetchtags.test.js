import ElasticSearchService from './../services/ElasticSearchService';

var path=require('path');
var lib=path.join(path.dirname(require.resolve('axios')),'lib/adapters/http');
var http=require(lib);

test('elasticsearchservice fetchTags', () => {
  var ess = new ElasticSearchService(process.env.ES_PROXY);
  ess.setAxiosAdapter(http);
  
  ess.fetchTags(5).then((res) => {
    var results = [];
    
    res.data.aggregations.byTag.buckets.map((bucket) => {
      results.push(bucket.key);
    });
    
    expect(results).toEqual([
      'to-read',
      'favorites',
      'owned',
      'books-i-own',
      'currently-reading']);
    
    });
});