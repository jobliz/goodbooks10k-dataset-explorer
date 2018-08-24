import React, { Component } from "react";
import { Grid, Row, Col } from "react-bootstrap";
import { Card } from "components/Card/Card.jsx";

class About extends Component {

  render() {

    return (
      <div className="content">
        <Grid fluid>
          <Row>
            <Col lg={12} sm={12}>
              <Card 
                title={
                  <h3>About this application</h3>
                }
                content={
                  <div>
                    
                    <p>This application was made as a personal way to learn how to use ElasticSearch 
                    using an open dataset, as well as to find out how to implement tag search functionality
                    with it. Please check the README in the repository for more information.</p> 
                    
                    <p>
                      <ul>
                        <li>
                          <a href="https://github.com/jobliz/goodbooks10k-dataset-explorer/issues">
                            Github Repository
                          </a>
                        </li>
                        <li>
                          <a href="https://twitter.com/jobliz">
                            Author on Twitter (@jobliz)
                          </a>
                        </li>
                      </ul>
                    </p>
                  </div>
                }
              />
            </Col>
          </Row>
        </Grid>
      </div>
    );
  }
}

export default About;
