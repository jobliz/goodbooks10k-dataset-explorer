import React, { Component } from "react";
import ChartistGraph from "react-chartist";
import { Grid, Row, Col } from "react-bootstrap";

import { Card } from "components/Card/Card.jsx";
import { StatsCard } from "components/StatsCard/StatsCard.jsx";

import ElasticSearchService from "../../services/ElasticSearchService";

import {
  dataBar,
  optionsBar,
  responsiveBar,
  legendBar
} from "variables/Variables.jsx";

class Dashboard extends Component {

  constructor(props) {
    super(props);
    this.props = props;
    this.ess = new ElasticSearchService('http://localhost:9200');

    this.state = {
      tags_are_loaded: false,
      tags_data: {labels: [], series: []},
      tags_chart: null,
      tags_options: {
        seriesBarDistance: 5,
        axisX: {
          showGrid: false
        },
        height: "245px"
      }
    }
  }

  componentDidMount() {
    this.loadTagData();
  }

  loadTagData() {
    this.ess.fetchTags(18).then((res) => {
      var new_labels = [];
      var new_series = [];

      res.data.aggregations.byTag.buckets.map((bucket) => {
        new_labels.push(bucket.key);
        new_series.push(bucket.doc_count);
      });

      this.setState({
        tags_data: {
          labels: new_labels,
          series: [new_series]
        },
        tags_are_loaded: true
      });
    })
  }

  render() {

    if(this.state.tags_are_loaded) {
      this.state.tags_chart = <div>
        <Card
          id="chartForTags"
          title="Most used tags"
          category={"The " + this.state.tags_data['labels'].length + " most used tags."}
          stats="Remember that the data comes from a static dataset!"
          statsIcon="fa fa-info"
          content={
            <div className="ct-chart">
              <ChartistGraph
                data={this.state.tags_data}
                type="Bar"
                options={this.state.tags_options}
              />
            </div>
          }
        />
      </div>
    } else {
      this.state.tags_chart = <div>
        Loading tags, please wait...
      </div>
    }

    return (
      <div className="content">
        <Grid fluid>
          <Row>
            <Col lg={6} sm={12}>
              <StatsCard
                bigIcon={<i className="pe-7s-notebook text-success" />}
                statsText="Books"
                statsValue="10000"
                statsIcon={<i className="fa fa-info" />}
                statsIconText={
                  <div>From the &nbsp;
                    <a href='https://github.com/zygmuntz/goodbooks-10k'> 
                      goodbooks-10k dataset repository</a>.
                  </div>}
              />
            </Col>
            <Col lg={6} sm={12}>
              <StatsCard
                bigIcon={<i className="pe-7s-ticket text-success" />}
                statsText="Tags"
                statsValue="34098"
                statsIcon={<i className="fa fa-info" />}
                statsIconText="Lots of them!"
              />
            </Col>
          </Row>
          <Row>
            <Col md={12}>
              {this.state.tags_chart}
            </Col>
          </Row>
        </Grid>
      </div>
    );
  }
}

export default Dashboard;
