import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Alert, Button } from 'react-bootstrap';
import EventTemplateOptionsModal from './event_template_options_modal';
import * as mapDispatchToProps from '../actions';

class EventTemplateList extends Component {

  constructor (props) {
    super(props);

    this.renderEventTemplates = this.renderEventTemplates.bind(this);

  }

  componentDidMount() {
    if(this.props.authenticated) {
      this.props.fetchEventTemplatesForMain();
    }
  }

  componentDidUpdate() {}


  async handleEventSubmit(event_template) {

    let event = await this.props.createEvent(event_template.event_value, '', []);

    if( event_template.event_options.length > 0 || event_template.event_free_text_required ) {
      this.props.showModal('eventOptions', { eventTemplate: event_template, event: event, handleUpdateEvent: this.props.updateEvent, handleDeleteEvent: this.props.deleteEvent });
    }
  }

  renderEventTemplates() {
    if(this.props.event_templates){
      return this.props.event_templates.map((event_template) => {

        return (
          <Button className="btn btn-primary btn-squared" to="#" key={`template_${event_template.id}`} onClick={ () => this.handleEventSubmit(event_template) }>{ event_template.event_name }</Button>
        );
      });      
    }

    return (
      <div>No event template found</div>
    );
  }

  render() {

    if (!this.props.event_templates) {
      return (
        <div style={this.props.style} >Loading...</div>
      );
    }

    if (this.props.event_templates.length > 0) {
      return (
        <div style={this.props.style} >
          <EventTemplateOptionsModal/>
          {this.renderEventTemplates()}
        </div>
      );
    }

    return (
      <Alert variant="danger">No Event Templates found</Alert>
    );
  }
}

function mapStateToProps(state) {

  return {
    authenticated: state.auth.authenticated,
    event_templates: state.event_history.event_templates,
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(EventTemplateList);
