import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Alert, Button, Tab, Tabs } from 'react-bootstrap';
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

    const template_categories = [...new Set(this.props.event_templates.reduce(function (flat, event_template) {
        return flat.concat(event_template.template_categories);
      }, [])
    )]

    if(this.props.event_templates){
      if(template_categories.length > 0) {
        return (
          <Tabs className="categoryTab" activeKey={(this.props.event_template_category)? this.props.event_template_category : "all"} id="controlled-tab-example" onSelect={(category) => this.props.updateEventTemplateCategory(category)}>
            <Tab eventKey="all" title="All">
              {
                this.props.event_templates.filter((event_template) => typeof event_template.disabled === 'undefined' || !event_template.disabled).map((event_template) => {

                  return (
                    <Button className="btn btn-primary btn-squared" to="#" key={`template_${event_template.id}`} onClick={ () => this.handleEventSubmit(event_template) }>{ event_template.event_name }</Button>
                  );
                })
              }
            </Tab>
            {
              template_categories.map((template_category) => {
                return (
                  <Tab eventKey={template_category} title={template_category} key={template_category}>
                    {
                      this.props.event_templates.filter((event_template) => (typeof event_template.disabled === 'undefined' || !event_template.disabled) && event_template.template_categories.includes(template_category)).map((event_template) => {

                        return (
                          <Button className="btn btn-primary btn-squared" to="#" key={`template_${event_template.id}`} onClick={ () => this.handleEventSubmit(event_template) }>{ event_template.event_name }</Button>
                        );
                      })
                    }
                  </Tab>
                )
              })
            }
          </Tabs>
        )
      }
      else {
        return this.props.event_templates.filter((event_template) => typeof event_template.disabled === 'undefined' || !event_template.disabled).map((event_template) => {
          return (
            <Button className="btn btn-primary btn-squared" to="#" key={`template_${event_template.id}`} onClick={ () => this.handleEventSubmit(event_template) }>{ event_template.event_name }</Button>
          );
        })
      }
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
    event_template_category: state.event_history.event_template_category
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(EventTemplateList);
