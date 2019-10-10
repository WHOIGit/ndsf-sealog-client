import React, { Component } from 'react';
import { Pagination } from 'react-bootstrap';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

class CustomPagination extends Component {

  constructor (props) {
    super(props);

    this.state = {
      maxPerPage: (this.props.maxPerPage)? this.props.maxPerPage : 10
    };
  }

  static propTypes = {
    maxPerPage: PropTypes.number,
    pageSelectFunc: PropTypes.func.isRequired,
    page: PropTypes.number.isRequired,
    count: PropTypes.number.isRequired,
    style: PropTypes.object,
    className: PropTypes.string
  };

  render() {

    const count = (this.props.count)? this.props.count : 0;

    if(count > this.state.maxPerPage) {
      let last = Math.ceil(count/this.state.maxPerPage);
      let delta = 2;
      let left = this.props.page - delta;
      let right = this.props.page + delta + 1;
      let range = [];
      let rangeWithDots = [];
      let l = null;

      for (let i = 1; i <= last; i++) {
        if (i === 1 || i === last || i >= left && i < right) {
          range.push(i);
        }
      }

      for (let i of range) {
        if (l) {
          if (i - l === 2) {
            rangeWithDots.push(<Pagination.Item className={this.props.className} key={l + 1} active={(this.props.page === l+1)} onClick={() => this.props.pageSelectFunc(l + 1)}>{l + 1}</Pagination.Item>);
          } else if (i - l !== 1) {
            rangeWithDots.push(<Pagination.Ellipsis className={this.props.className} key={`ellipsis_${i}`} />);
          }
        }
        rangeWithDots.push(<Pagination.Item className={this.props.className} key={i} active={(this.props.page === i)} onClick={() => this.props.pageSelectFunc(i)}>{i}</Pagination.Item>);
        l = i;
      }

      return (
        <Pagination style={this.props.style} >
          <Pagination.First className={"rounded-left " + this.props.className} onClick={() => this.props.pageSelectFunc(1)} />
          <Pagination.Prev className={this.props.className} onClick={() => { if(this.props.page > 1) { this.props.pageSelectFunc(this.props.page-1)}}} />
          {rangeWithDots}
          <Pagination.Next className={this.props.className} onClick={() => { if(this.props.page < last) { this.props.pageSelectFunc(this.props.page+1)}}} />
          <Pagination.Last className={"rounded-right " + this.props.className} onClick={() => this.props.pageSelectFunc(last)} />
        </Pagination>
      );
    }
    return null;
  }
}

// function mapStateToProps(state) {
//   return {};
// }

export default connect(null, null)(CustomPagination);