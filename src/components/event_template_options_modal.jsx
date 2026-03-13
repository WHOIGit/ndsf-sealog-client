import React, { Component } from 'react';
import { compose } from 'redux';
import { connectModal } from 'redux-modal';
import { reduxForm, Field } from 'redux-form';
import PropTypes from 'prop-types';
import moment from 'moment';
import { renderCheckboxGroup, renderDateTimePicker, renderRadioGroup, renderSelectField, renderStaticTextField, renderTextArea, renderTextField } from './form_elements';
import { Button, Modal } from 'react-bootstrap';

const required =  value => !value ? 'Required' : undefined
const requiredArray =  value => !value || value.length === 0 ? 'Must select at least one option' : undefined

class EventTemplateOptionsModal extends Component {

  constructor (props) {
    super(props);

    this.state = {
      event_id: (this.props.event)?this.props.event.id:null
    }

    this.handleFormHide = this.handleFormHide.bind(this);

  }

  static propTypes = {
    event: PropTypes.object,
    eventTemplate: PropTypes.object,
    handleHide: PropTypes.func.isRequired,
    handleUpdateEvent: PropTypes.func,
    handleDeleteEvent: PropTypes.func
  };

  componentDidMount() {
    this.populateDefaultValues()
  }

  componentWillUnmount() {
  }

  async populateDefaultValues() {
    let timestring = (this.props.event) ? this.props.event.ts : moment.utc().toISOString();
    let eventDefaultValues = {event_ts: moment.utc(timestring)};
    this.props.eventTemplate.event_options.forEach((option, index) => {
      if(option.event_option_default_value && option.event_option_type !== 'checkboxes') {
        eventDefaultValues[`option_${index}`] = option.event_option_default_value;
      }
      else if(option.event_option_default_value && option.event_option_type === 'checkboxes') {
        eventDefaultValues[`option_${index}`] = [option.event_option_default_value];
      }
    });
    this.props.initialize(eventDefaultValues);
  }

  handleFormSubmit(formProps) {

    formProps.event_free_text = (formProps.event_free_text)? formProps.event_free_text : ""

    let temp = JSON.parse(JSON.stringify(formProps));

    delete temp.event_free_text
    delete temp.event_ts

    //Convert obecjts to arrays
    let optionValue = []
    let optionIndex = Object.keys(temp).sort().map((value) => { optionValue.push(temp[value]); return parseInt(value.split('_')[1])});

    //Remove empty fields
    optionValue.forEach((value, index) => {
      if(value === "") {
        optionIndex.splice(index, 1);
        optionValue.splice(index, 1);
      }
    });

    //Build event_options array
    let event_options = optionIndex.map( (value, index) => {

      if(Array.isArray(optionValue[index])) {
        optionValue[index] = optionValue[index].join(';')
      }

      return (
        { event_option_name: this.props.eventTemplate.event_options[value].event_option_name,
          event_option_value: optionValue[index]
        }
      )
    });

    let event_ts = (formProps.event_ts)? formProps.event_ts.toISOString() : '';

    //Submit event
    if(this.state.event_id) {
      this.props.handleUpdateEvent(this.state.event_id, this.props.eventTemplate.event_value, formProps.event_free_text, event_options, event_ts);
    }
    this.props.handleHide();
  }

  handleFormHide() {
    if(this.state.event_id) {
      this.props.handleDeleteEvent(this.state.event_id)
    }
    this.props.handleHide()
  }

  renderEventOptions() {

    const {eventTemplate} = this.props;
    const {event_options} = eventTemplate;

    return ( event_options.map((option, index) => {

      if (option.event_option_type === 'dropdown') {

        return (
          <div key={`option_${index}`}>
            <Field
              name={`option_${index}`}
              component={renderSelectField}
              label={option.event_option_name}
              required={ option.event_option_required }
              validate={ option.event_option_required ? required : undefined }
              options={option.event_option_values}
              defaultValue={option.event_option_default_value}
              lg={12}
              sm={12}
            />
          </div>
        )
      } else if (option.event_option_type === 'checkboxes') {

        let optionList = option.event_option_values.map((option_value) => {
          return { value: option_value, label: option_value }
        });

        return (
          <div key={`option_${index}`}>
            <Field
              name={`option_${index}`}
              component={renderCheckboxGroup}
              label={option.event_option_name}
              options={optionList}
              indication={true}
              inline={true}
              required={ option.event_option_required }
              validate={ option.event_option_required ? requiredArray : undefined }
              lg={12}
              sm={12}
            />
          </div>
        )
      } else if (option.event_option_type === 'radio buttons') {

        let optionList = option.event_option_values.map((option_value) => {
          return { value: option_value, label: option_value }
        });

        return (
          <div key={`option_${index}`}>
            <Field
              name={`option_${index}`}
              component={renderRadioGroup}
              label={option.event_option_name}
              options={optionList}
              indication={true}
              inline={true}
              required={ option.event_option_required }
              validate={ option.event_option_required ? requiredArray : undefined }
              lg={12}
              sm={12}
            />
          </div>
        )
      } else if (option.event_option_type === 'text') {
        return (
          <div key={`option_${index}`}>
            <Field
              name={`option_${index}`}
              component={renderTextField}
              label={option.event_option_name}
              required={ option.event_option_required }
              validate={ option.event_option_required ? required : undefined }
              lg={12}
              sm={12}
            />
          </div>
        )
      } else if (option.event_option_type === 'static text') {
        return (
          <div key={`option_${index}`}>
            <Field
              name={`option_${index}`}
              component={renderStaticTextField}
              label={option.event_option_name}
              lg={12}
              sm={12}
            />
          </div>
        )
      }
      return null;
    }));
  }

  render() {

    const { show, handleSubmit, eventTemplate, submitting, valid } = this.props

    const footer = (this.state.event_id) ? 
      <span className="float-right">
        <Button className="mr-1" size="sm" variant="secondary" disabled={submitting} onClick={this.handleFormHide}>Cancel</Button>
        <Button size="sm" variant="primary" type="submit" disabled={ submitting || !valid}>Submit</Button>
      </span>
      : 
      <Button size="sm" className="float-right" variant="secondary" onClick={this.handleFormHide}>Close</Button>
      

    if (eventTemplate) {
      return (
        <Modal show={show} onHide={this.handleFormHide}>
          <form onSubmit={ handleSubmit(this.handleFormSubmit.bind(this)) }>
            <Modal.Header closeButton>
              <Modal.Title>{eventTemplate.event_value}</Modal.Title>
            </Modal.Header>

            <Modal.Body>
              {this.renderEventOptions()}
              <Field
                name="event_free_text"
                component={renderTextArea}
                label="Additional Text"
                required={eventTemplate.event_free_text_required}
                validate={ eventTemplate.event_free_text_required ? required : undefined }
                rows={2}
              />
              <Field
                name="event_ts"
                label="Custom Time (UTC)"
                component={renderDateTimePicker}
                disabled={this.props.disabled}
                required={true}
                lg={12}
                sm={12}
              />
            </Modal.Body>
            <Modal.Footer>
              {footer}
            </Modal.Footer>
          </form>
        </Modal>
      );
    }
    else {
      return null;
    }
  }
}

function validate(formProps) {
  const errors = {};

  if (formProps.event_ts === "") {
    errors.event_ts = 'Required'
  }

  if (formProps.event_ts !== "" && !moment.utc(formProps.event_ts).isValid()) {
    errors.event_ts = 'Invalid timestamp'
  }

  return errors;

}

export default compose(
  connectModal({ name: 'eventOptions' }),
  reduxForm({
    form: 'eventTemplateOptionsModal',
    validate: validate
  })
)(EventTemplateOptionsModal)
