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
    const publication_year = Math.trunc(this.props.result.original_publication_year);
    const goodreads_url = 'https://www.goodreads.com/book/show/' + this.props.result.goodreads_book_id;
    const goodreads_editions_url = 'https://www.goodreads.com/work/editions/' + this.props.result.work_id;
    const isbn_search_url = 'https://isbnsearch.org/search?s=' + this.props.result.isbn;

    const author_list_or_string = this.props.result.authors.split(',')
    var author;
    if(author_list_or_string.constructor === Array) {
      author = author_list_or_string[0];
    } else {
      author = author_list_or_string;
    }

    return (
      <div>
        <Card
          title={
            <div>
              <Button className="pull-right" onClick={() => this.setState({ open: !this.state.open })}>
                  View tags
              </Button>
              <img
                className="book-thumbnail" 
                src={this.props.result.image_url} 
                alt={this.props.result.title}/>
              <div className="title-author-view">
                <div className="card-search-result-title">{this.props.result.title}</div>
                <div className="card-search-result-title-author">
                  {publication_year} &nbsp;
                  {author}
                </div>
                <p><a target="_blank" href={goodreads_url}>Book profile in Goodreads</a></p>
                <p><a target="_blank" href={goodreads_editions_url}>Book editions in Goodreads</a></p>
                <p><a target="_blank" href={isbn_search_url}>Search ISBN</a></p>
              </div>
            </div>
          }
          content={
            <div className="result-item">
              <Collapse in={this.state.open}>
                <div>
                  <Well className="tag-list-well">
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

