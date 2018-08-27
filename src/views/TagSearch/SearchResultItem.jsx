import React, { Component } from "react";
import Card from "components/Card/Card";
import { Button, Collapse, Well, } from "react-bootstrap";


export default class SearchResultItem extends Component {

  constructor(props) {
    super(props);
    this.props = props;
    this.state = {open: false}
  }

  render() {
    return (
      <div>
        <Card
          title={
            <div>  
              {this.props.title} &nbsp;
              <Button className="pull-right" onClick={() => this.setState({ open: !this.state.open })}>
                Toggle tag view
              </Button>
            </div>
          }
          content={
            <div className="result-item">
              <Collapse in={this.state.open}>
                <div>
                  <Well>
                    {this.props.tag_list}
                  </Well>
                </div>
              </Collapse>
            </div>
          }>
        </Card>     
      </div>
      );
    }

}

