import React, { Component } from "react";
import { Grid } from "react-bootstrap";

class Footer extends Component {
  render() {
    return (
      <footer className="footer">
        <Grid fluid>
          <p className="copyright pull-right">
            Made by José Reyna (<a href="https://twitter.com/jobliz">@jobliz</a>) using &nbsp;
            <a href="#">Light-Bootstrap-Dashboard-React</a>. &nbsp;
            Sidebar background: JF Rauzier, Bibliotheque Babel, 2013
          </p>
        </Grid>
      </footer>
    );
  }
}

export default Footer;
