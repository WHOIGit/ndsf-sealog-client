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

  componentDidMount() {
    if(this.props.authenticated) {
      this.props.fetchCustomVars();
    }
  }

  render() {

    if(this.props.roles.includes("event_logger") && this.props.roles.includes("event_watcher")) {
      return (
        <div>
          <EventShowDetailsModal />
          <EventCommentModal/>
          <Row>
            <Col>
              <EventTemplateList />
            </Col>
          </Row>
          <Row>
            <Col>
              <EventInput className="mt-2" />
            </Col>
          </Row>
          <Row>
            <Col>
              <EventHistory className="mt-2"/>
            </Col>
          </Row>
        </div>
      );
    }

    // Show view-only interface for everyone else (including unauthenticated users)
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
}

function mapStateToProps(state) {

  return {
    roles: state.user.profile.roles,
    authenticated: state.auth.authenticated
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(EventLogging);