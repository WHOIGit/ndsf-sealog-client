import React, { Component } from 'react';
import { connect } from 'react-redux';
import EventTemplateList from './event_template_list';
import EventHistory from './event_history';
import EventInput from './event_input';
import EventCommentModal from './event_comment_modal';
import { Row, Col } from 'react-bootstrap';
import EventShowDetailsModal from './event_show_details_modal';

import * as mapDispatchToProps from '../actions';

class EventLogging extends Component {

  constructor (props) {
    super(props);

  }

  componentDidMount() {
    if(this.props.authenticated) {
      this.props.fetchCustomVars();
    }
  }

  render() {

    if(this.props.roles && this.props.roles.includes("event_logger") && this.props.roles.includes("event_watcher")) {
      return (
        <div>
          <EventShowDetailsModal />
          <EventCommentModal/>
          <Row>
            <Col>
              <EventTemplateList style={{marginBottom: "4px"}} />
            </Col>
          </Row>
          <Row>
            <Col>
              <EventInput style={{marginBottom: "4px"}} />
            </Col>
          </Row>
          <Row>
            <Col>
              <EventHistory />
            </Col>
          </Row>
        </div>
      );
    }
    else if(this.props.roles && this.props.roles.includes("event_watcher")) {
      return (
        <div>
          <EventShowDetailsModal />
          <Row>
            <Col>
              <EventHistory />
            </Col>
          </Row>
        </div>
      );
    }
    return null;
  }
}

function mapStateToProps(state) {

  return {
    roles: state.user.profile.roles,
    authenticated: state.auth.authenticated
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(EventLogging);