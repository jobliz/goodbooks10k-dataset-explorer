import React, { Component } from "react";
import { Grid, Row, Col, FormControl, Button } from "react-bootstrap";
import Select from 'react-virtualized-select';
import createFilterOptions from "react-select-fast-filter-options";
import Card from "components/Card/Card";

import ElasticSearchService from "./../../services/ElasticSearchService";

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
      tags: [], // length is zero when it hasn't been loaded
      filterOptions: null,
      // TODO: title_search seems to not have effect at the start in the searchbox value?
      title_search: '',
      select_with: "",
      select_without: "",
      results: []
    };

    this.ess = new ElasticSearchService('http://localhost:9200/goodbooks10k/books/_search');

    this.handleSearchButton = this.handleSearchButton.bind(this);
    this.handleTitleSearchInput = this.handleTitleSearchInput.bind(this);
    this.handleTagWithSelect = this.handleTagWithSelect.bind(this);
    this.handleTagWithoutSelect = this.handleTagWithoutSelect.bind(this);
  }

  componentDidMount() {
    this.ess.fetchTags().then((res) => {
      var new_tags = [];
      
      res.data.aggregations.byTag.buckets.map((bucket) => {
        // tag 2385 in aggregation is "", which breaks the select. evade it
        if(bucket.key !== "") {
          new_tags.push({
            label: bucket.key, 
            value: bucket.key,
            type: 'name'
          })
        }
      });

      this.setState({'tags': new_tags}, () => {
        this.setState({'filterOptions': createFilterOptions({
          labelKey: 'label',
          options: this.state.tags
        })});
      });
    })
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

    if(this.state.tags.length !== 0) {
      tag_search_fields = <div>
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

          <strong>Without tags:</strong>
          <Select
            autofocus
            simpleValue
            multi={true}
            searchable={true}
            clearable={true}
            disabled={false}
            onChange={this.handleTagWithoutSelect}
            options={this.state.tags}
            value={this.state.select_without}
            filterOptions={this.state.filterOptions}
          />
      </div>
    } else {
      tag_search_fields = <div>
        <p>Tags are being loaded, please wait...</p>  
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
        if(with_tags.includes(tag)) {
          tag_list.push(<span className="present">{tag}</span>);
        } else {
          tag_list.push(<span>{tag}</span>);
        }
      })

      result_list.push(
        <div key={result.id} className="result-item">
          <p>
            <h5>{result.title}</h5>
            {tag_list}
          </p>
        </div>
      );
    });

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
                    <strong>In Title:</strong>
                    <FormControl
                      type="text"
                      value={this.state.title_search}
                      placeholder="Enter text"
                      onChange={this.handleTitleSearchInput}
                    />
                    {tag_search_fields}
                  </Col>
                </Row>
              }> {/* card.content end */}
              </Card>

              <Card content={
                <div className="search-result-listing-outer">
                  <h4>Results:</h4>
                  <div className="search-result-listing">
                    {result_list}
                  </div>
                </div>}>
              </Card>
            </Col>
          </Row>
        </Grid>
      </div>
    )
  }
}