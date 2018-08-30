import axios from 'axios';

export default class ElasticSearchService {

  constructor(host) {
    this.host = host;
    this.tag_endpoint = host + '/goodbooks10k-tags/tags/_search';
    this.book_endpoint = host + '/goodbooks10k/books/_search';

    // need to receive http as adapter for axios to work in jest tests
    // https://stackoverflow.com/q/42677387/9930918
    this.axios_adapter = null;

    this.get.bind(this);
    this.fetchTags.bind(this);
    this.searchBooks.bind(this);
    this.queryForFetchingTags.bind(this);
    this.queryForSearchingBooks.bind(this);
  }

  setAxiosAdapter(adapter) {
    this.axios_adapter = adapter;
  }

  get(url, params) {
    if(this.axios_adapter !== null) {
      params['adapter'] = this.axios_adapter;
    }

    return axios.get(url, params);
  }

  listTags() {
    return this.get(this.tag_endpoint, {});
  }

  fetchTags(size) {
    return this.get(this.book_endpoint, {
      params: {
        source: JSON.stringify(this.queryForFetchingTags(size)),
        source_content_type: 'application/json'
      }
    });
  }

  searchBooks(title, select_with, select_without) {
    const query = this.queryForSearchingBooks(title, select_with, select_without);
    return this.get(this.book_endpoint, {
      params: {
        source: JSON.stringify(query),
        source_content_type: 'application/json'
      }
    });
  }

  countBooks() {
    const endpoint = this.host + "/goodbooks10k/books/_count"
    return this.get(endpoint, {});
  }

  queryForFetchingTags(size) {
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

  queryForSearchingBooks(title, select_with, select_without) {
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

}