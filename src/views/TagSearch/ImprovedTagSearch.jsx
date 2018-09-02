import React, { Component } from "react";
import { Grid, Row, Col, FormControl, Button } from "react-bootstrap";
import Select from 'react-virtualized-select';
import Card from "components/Card/Card";

import ElasticSearchService from "./../../services/ElasticSearchService";
import SearchResultItem from './SearchResultItem';
import {
  enterTagOptionsIntoStorage,
  enterIndexDataToStorage,
  retrieveIndexDataFromStorage,
  retrieveTagOptionsFromStorage
} from './../../services/LocalStorageHandlers';

function split_select_items(string) {
  if(string === "") {
    return [];
  } else {
    return string.split(',');
  }
}

export default class ImprovedTagSearch extends Component {

  constructor(props) {
    super(props);
    this.props = props;

    this.state = {
      tags: [],
      title_search: '',
      select_with: "",
      select_without: "",
      results: [],
    };
    
    // set environment variable to 'http://localhost:9200' for testing purposes
    this.ess = new ElasticSearchService(process.env.ES_PROXY);

    this.loadTagData = this.loadTagData.bind(this);
    this.handleSearchButton = this.handleSearchButton.bind(this);
    this.handleTitleSearchInput = this.handleTitleSearchInput.bind(this);
    this.handleTagWithSelect = this.handleTagWithSelect.bind(this);
    this.handleTagWithoutSelect = this.handleTagWithoutSelect.bind(this);
  }

  componentDidMount() {
    var tags = retrieveTagOptionsFromStorage();
    
    if(tags === null) { 
      this.loadTagData(); 
    } else {
      this.setState({tags: tags});
    }
  }

  componentWillUnmount() { }

  loadTagData() {
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
        enterTagOptionsIntoStorage(new_tags);
      });
    });
  }

  makeSimpleFilterOptions(input_fetcher) {
    return function(options, inputValue) {
      const existing_terms = input_fetcher().split(',');
      const input_terms = inputValue.toLowerCase().split(" ");
      var visible_options = [];

      for(var i=0; i < options.length; i++) {
        var count = 0;
        var data = options[i];
        if(existing_terms.includes(data['value'])) { continue; }
        
        input_terms.map((term) => {
          if(data['value'].includes(term)) {
            count += 1;
          }
        });

        if(count === input_terms.length) {
          visible_options.push({label: data.value, value: data.value})
        }

        count += 1;
      };
      
      return visible_options;
    }
  }

  handleSearchButton = (event) => {
    this.ess.searchBooks(
      this.state.title_search, 
      this.state.select_with, 
      this.state.select_without)
        .then((response) => {
          var new_results = [];

          if(response.data.hits.hits.length === 0) {
            alert("No results found.");
          }

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

    if(this.state.tags.length !== 0) {
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
              filterOptions={this.makeSimpleFilterOptions(() => {return this.state.select_with})}
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
              filterOptions={this.makeSimpleFilterOptions(() => {return this.state.select_without})}
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