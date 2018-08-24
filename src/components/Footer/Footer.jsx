import React, { Component } from "react";
import { Grid } from "react-bootstrap";

class Footer extends Component {
  render() {
    return (
      <footer className="footer">
        <Grid fluid>
          <p className="copyright pull-right">
            Made by José Reyna (<a href="#">@jobliz</a>) using &nbsp;
            <a href="#">Light-Bootstrap-Dashboard-React</a>
          </p>
        </Grid>
      </footer>
    );
  }
}

export default Footer;
