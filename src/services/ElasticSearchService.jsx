import axios from 'axios';
import TagSearch from '../views/TagSearch/TagSearch';

export default class ElasticSearchService {

  constructor(host) {
    this.tag_endpoint = host + '/goodbooks10k-tags/tags/_search';
    this.book_endpoint = host + '/goodbooks10k/books/_search';
    this.fetchTags.bind(this);
    this.searchBooks.bind(this);
    this.queryForFetchingTags.bind(this);
    this.queryForSearchingBooks.bind(this);
  }

  listTags() {
    return axios.get(this.tag_endpoint, {});
  }

  fetchTags() {
    return axios.get(this.book_endpoint, {
      params: {
        source: JSON.stringify(this.queryForFetchingTags()),
        source_content_type: 'application/json'
      }
    });
  }

  searchBooks(title, select_with, select_without) {
    const query = this.queryForSearchingBooks(title, select_with, select_without);
    return axios.post(this.book_endpoint, query);
  }
  
  queryForFetchingTags() {
    return {
      "aggs": {
        "byTag": {
          "terms": {
            "field": "tag_nested.name.keyword",
            "size": 40000
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