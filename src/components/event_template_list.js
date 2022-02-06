import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Alert, Button, Tab, Tabs } from 'react-bootstrap';
import EventTemplateOptionsModal from './event_template_options_modal';
import { Client } from '@hapi/nes/lib/client';
import { WS_ROOT_URL } from 'client_config';

import * as mapDispatchToProps from '../actions';

class EventTemplateList extends Component {

  constructor (props) {
    super(props);

    this.client = new Client(`${WS_ROOT_URL}`);
    this.connectToWS = this.connectToWS.bind(this);

    this.renderEventTemplates = this.renderEventTemplates.bind(this);

  }

  componentDidMount() {
    if(this.props.authenticated) {
      this.props.fetchEventTemplatesForMain();
      this.connectToWS();
    }
  }

  componentWillUnmount() {
    this.client.disconnect();
  }

  componentDidUpdate() {}

  async connectToWS() {

    try {
      await this.client.connect();
      // {
      //   auth: {
      //     headers: {
      //       authorization: cookies.get('token')
      //     }
      //   }
      // })

      const deleteHandler = () => {
        this.props.fetchEventTemplatesForMain();
      };

      const updateHandler = () => {
        this.props.fetchEventTemplatesForMain();
      };

      this.client.subscribe('/ws/status/newEventTemplates', updateHandler);
      this.client.subscribe('/ws/status/updateEventTemplates', updateHandler);
      this.client.subscribe('/ws/status/deleteEventTemplates', deleteHandler);

    } catch(error) {
      console.log(error);
      throw(error);
    }
  }

  async handleEventSubmit(event_template, e = null) {

    const needs_modal = (e && e.shiftKey) || event_template.event_options.reduce((needs, option) => {
      return (option.event_option_type !== 'static text') ? true : needs;
    }, false);

    if( event_template.event_free_text_required || needs_modal ) {

      const event = await this.props.createEvent(event_template.event_value, '', []);

      this.props.showModal('eventOptions', { eventTemplate: event_template, event: event, handleUpdateEvent: this.props.updateEvent, handleDeleteEvent: this.props.deleteEvent });

    } else {
      const event_options = event_template.event_options.reduce((eventOptions, option) => {

        eventOptions.push({ event_option_name: option.event_option_name, event_option_value: option.event_option_default_value });
      
        return eventOptions;
      
      }, []);

      await this.props.createEvent(event_template.event_value, '', event_options);
    }
  }

  renderEventTemplates() {

    const template_categories = [...new Set(this.props.event_templates.reduce(function (flat, event_template) {
        return flat.concat(event_template.template_categories);
      }, [])
    )].sort();

    if(this.props.event_templates){
      if(template_categories.length > 0) {
        return (
          <Tabs className="category-tab" variant="pills" activeKey={(this.props.event_template_category)? this.props.event_template_category : "all"} id="event-template-tabs" onSelect={(category) => this.props.updateEventTemplateCategory(category)}>
            <Tab eventKey="all" title="All">
              {
                this.props.event_templates.filter((event_template) => typeof event_template.disabled === 'undefined' || !event_template.disabled).map((event_template) => {

                  return (
                    <Button className="mt-1 mr-1 py-3 btn-template" variant="primary" to="#" key={`template_${event_template.id}`} onClick={ (e) => this.handleEventSubmit(event_template, e) }>{ event_template.event_name }</Button>
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
                          <Button className="mt-1 mr-1 py-3 btn-template" variant="primary" to="#" key={`template_${event_template.id}`} onClick={ (e) => this.handleEventSubmit(event_template, e) }>{ event_template.event_name }</Button>
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
            <Button className="mt-1 mr-1 py-3 btn-template" variant="primary" to="#" key={`template_${event_template.id}`} onClick={ (e) => this.handleEventSubmit(event_template, e) }>{ event_template.event_name }</Button>
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
