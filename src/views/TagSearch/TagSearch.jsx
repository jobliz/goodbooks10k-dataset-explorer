import React, { Component } from "react";
import { Grid, Row, Col, FormControl, Button } from "react-bootstrap";
import Select from 'react-virtualized-select';
import Card from "components/Card/Card";
import createFilterOptions from "react-select-fast-filter-options";

import ElasticSearchService from "./../../services/ElasticSearchService";
import WebWorker from "./../../workers/WebWorker";
import BuildSearchIndex from "./../../workers/BuildSearchIndex";

import SearchResultItem from './SearchResultItem';

const jss = require('js-search');

const STORAGE_TAG_DATA_KEY = "storage_tag_data";
const STORAGE_INDEX_DATA_KEY = "storage_index_data";

function createFilterOptionsAlternative(search) {
  // See https://github.com/JedWatson/react-select/blob/e19bce383a8fd1694278de47b6d00a608ea99f2d/src/Select.js#L830
  // See https://github.com/JedWatson/react-select#advanced-filters
  return function filterOptions(options, filter, selectedOptions) {
    var filtered = filter ? search.search(filter) : options;

    if (Array.isArray(selectedOptions) && selectedOptions.length) {
      var selectedValues = selectedOptions.map(function (option) {
        return option[search.valueKey];
      });

      return filtered.filter(function (option) {
        return !selectedValues.includes(option[search.valueKey]);
      });
    }

    return filtered;
  };
}

function split_select_items(string) {
  if(string === "") {
    return [];
  } else {
    return string.split(',')
  }
}

export default class TagSearch extends Component {

  constructor(props) {
    super(props);
    this.props = props;

    this.state = {
      tags: this.retrieveTagOptionsFromStorage(),
      index_core_data: this.retrieveIndexDataFromStorage(),
      filterOptions: null,
      title_search: '',
      select_with: "",
      select_without: "",
      results: [],
      worker_output: null,
    };

    this.ess = new ElasticSearchService('http://localhost:9200');

    this.handleSearchButton = this.handleSearchButton.bind(this);
    this.handleTitleSearchInput = this.handleTitleSearchInput.bind(this);
    this.handleTagWithSelect = this.handleTagWithSelect.bind(this);
    this.handleTagWithoutSelect = this.handleTagWithoutSelect.bind(this);

    this.worker = new WebWorker(BuildSearchIndex);
    this.worker.addEventListener('message', event => {
      console.log("Received searchIndex data from worker");
      this.setState({'index_core_data': event.data}, () => {
        // TODO: see if the JSON.stringify allocation error can be solved 
        // this.enterIndexDataToStorage(event.data);
        if(this.state.tags !== null) {
          this.buildTagSelectorEnvironment(
            this.state.tags,
            this.state.index_core_data
          );
        } else {
          alert("Unexpected error: Index data found, but no tag data");
        }
      });
    });
  }

  componentDidMount() {
    if(this.state.tags === null || this.state.index_core_data === null) {
      this.beginDataLoadingProcess();
    } else {
      this.buildTagSelectorEnvironment(
        this.state.tags,
        this.state.index_core_data
      );
    }
  }

  componentWillUnmount() {
    this.worker.terminate();
  }

  retrieveTagOptionsFromStorage() {
    var data = localStorage.getItem(STORAGE_TAG_DATA_KEY);
    
    if(data ===  null) {
      return data;
    } else {
      return JSON.parse(data);
    }
  }

  retrieveIndexDataFromStorage() {
    var data = localStorage.getItem(STORAGE_INDEX_DATA_KEY);

    if(data === null) {
      return data;
    } else {
      return JSON.parse(data);
    }
  }

  enterTagOptionsIntoStorage(tag_options) {
    localStorage.setItem(STORAGE_TAG_DATA_KEY, JSON.stringify(tag_options));
  }

  enterIndexDataToStorage(index_data) {
    localStorage.setItem(STORAGE_INDEX_DATA_KEY, JSON.stringify(index_data));
  }

  buildTagSelectorEnvironment(tag_options, raw_index_data) {
    var _search = new jss.Search('value');
    _search.searchIndex = new jss.UnorderedSearchIndex();
    _search.indexStrategy = new jss.AllSubstringsIndexStrategy();
    _search.addIndex('label');
    _search.valueKey = 'value';
    _search.labelKey = 'label';

    console.log("Monkey-patching searchIndex");
    _search._searchIndex._tokenToUidToDocumentMap = raw_index_data;

    this.setState({
      'tags': tag_options,
      'filterOptions': createFilterOptionsAlternative(_search)
    });
  }

  beginDataLoadingProcess() {
    console.log("beginDataLoadingProcess()");
    const check = /^([A-Za-z0-9_-]+)$/;
    var new_tags = [];

    this.ess.fetchTags(40000).then((res) => {
      res.data.aggregations.byTag.buckets.map((bucket) => {
        // tag 2385 in aggregation is "", which breaks the select. evade it
        if(bucket.key !== "") {
          if(check.test(bucket.key)) {
            new_tags.push({
              label: bucket.key, 
              value: bucket.key,
              type: 'name'
            });
          }
        }
      });

      this.setState({'tags': new_tags}, () => {
        this.enterTagOptionsIntoStorage(new_tags);
        
        if(this.state.index_core_data === null) {
          this.worker.postMessage(new_tags);
        }
      });
    });
  }

  handleSearchButton = (event) => {
    this.ess.searchBooks(
      this.state.title_search, 
      this.state.select_with, 
      this.state.select_without)
        .then((response) => {
          var new_results = [];
          response.data.hits.hits.map((hit) => {
            new_results.push(hit._source);
          });
          this.setState({'results': new_results});
        });
  }

  handleTitleSearchInput = (event_proxy) => {
    this.setState({'title_search': event_proxy.target.value});
  }

  handleTagWithSelect = (event_string) => {
    let list_with = split_select_items(event_string);
    let list_without = split_select_items(this.state.select_without);
    let conflict = list_with.some(r=> list_without.includes(r));

    if(conflict) {
      alert("This tag is already on the exclusion list!");
    } else {
      this.setState({'select_with': event_string});
    }
  }

  handleTagWithoutSelect = (event_string) => {
    let list_without = split_select_items(event_string);
    let list_with = split_select_items(this.state.select_with);
    let conflict = list_without.some(r=> list_with.includes(r));

    if(conflict) {
      alert("This tag is already on the inclusion list!")
    } else {
      this.setState({'select_without': event_string});
    }
  }

  render() {
    // -----------------
    // tag search fields
    // -----------------
    var tag_search_fields;

    if(  this.state.tags !== null 
      && this.state.filterOptions !== null) {
      tag_search_fields = <div>
        <div class="search-form-item-wrapper">
          <strong>With tags:</strong>
            <Select
              autofocus
              simpleValue
              multi={true}
              searchable={true}
              clearable={true}
              disabled={false}
              onChange={this.handleTagWithSelect}
              options={this.state.tags}
              value={this.state.select_with}
              filterOptions={this.state.filterOptions}
            />
          </div>

          <div class="search-form-item-wrapper">
            <strong>Without tags:</strong>
            <Select
              autofocus
              simpleValue
              multi={true}
              searchable={true}
              clearable={true}search-form-item-wrapper
              disabled={false}
              onChange={this.handleTagWithoutSelect}
              options={this.state.tags}
              value={this.state.select_without}
              filterOptions={this.state.filterOptions}
            />
          </div>
      </div>
    } else {
      tag_search_fields = <div>
        <p className="building-index">
          <i className="icon-spinner icon-spin icon-large"></i>
          The tag filtering index is being built. 
          The tag selectors need it, please wait a moment...
        </p>
      </div>
    }

    // -----------
    // result area 
    // -----------
    var result_list = [];
    const with_tags = split_select_items(this.state.select_with);

    this.state.results.map((result) => {
      var tag_list = []
      result.tag_list.map((tag) => {
        var random_key = Math.random().toString(36).substring(2);
        if(with_tags.includes(tag)) {
          tag_list.push(<span key={random_key} className="present">{tag}</span>);
        } else {
          tag_list.push(<span key={random_key}>{tag}</span>);
        }
      })

      result_list.push(
        <SearchResultItem
          key={result.id}
          title={result.title}
          tag_list={tag_list} 
        ></SearchResultItem>
      );
    });

    var result_area;

    if(this.state.results.length === 0) {
      result_area = 
      <div>
        Results will appear here after searching.
      </div>
    } else {
      result_area = 
      <div className="search-result-listing-outer">
        <h3>Results: ({ this.state.results.length }) </h3>
        <div className="search-result-listing">
          {result_list}
        </div>
      </div>;
    }

    return (
      <div className="content">
        <Grid fluid>
          <Row>
            <Col md={12}>
              <Card title={
                <div>
                  <span>Search the dataset</span>
                  <span className="search-button-container">
                    <Button onClick={this.handleSearchButton}>Search</Button>
                  </span>
                </div>
              } 
              content={
                <Row>
                  <Col md={12}>
                    <div className="search-form-item-wrapper">
                      <strong>In Title:</strong>
                      <FormControl
                        type="text"
                        value={this.state.title_search}
                        placeholder="Enter text"
                        onChange={this.handleTitleSearchInput}
                      />
                    </div>
                    {tag_search_fields}
                  </Col>
                </Row>
              }> {/* card.content end */}
              </Card>

              <Card content={result_area}></Card>
            </Col>
          </Row>
        </Grid>
      </div>
    )
  }
}