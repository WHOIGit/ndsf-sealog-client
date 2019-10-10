import React, { Component } from 'react';
import { compose } from 'redux';
import { connectModal } from 'redux-modal';
import { reduxForm, Field } from 'redux-form';
import PropTypes from 'prop-types';
import axios from 'axios';
import Cookies from 'universal-cookie';
import moment from 'moment';
import Datetime from 'react-datetime';
import { Button, Form, Modal } from 'react-bootstrap';
import { API_ROOT_URL } from '../client_config';

const dateFormat = "YYYY-MM-DD"
const timeFormat = "HH:mm:ss.SSS"

const cookies = new Cookies();

const required =  value => !value ? 'Required' : undefined
const requiredArray =  value => !value || value.length === 0 ? 'Must select at least one option' : undefined

class EventTemplateOptionsModal extends Component {

  constructor (props) {
    super(props);

    this.state = {
      event_id: (this.props.event)?this.props.event.id:null
    }

    this.renderDatePicker = this.renderDatePicker.bind(this);
    this.handleFormHide = this.handleFormHide.bind(this);

  }

  static propTypes = {
    eventTemplate: PropTypes.object.isRequired,
    event: PropTypes.object,
    handleHide: PropTypes.func,
    handleUpdateEvent: PropTypes.func,
    handleDeleteEvent: PropTypes.func
  };

  componentDidMount() {
    this.getServerTime();
    this.populateDefaultValues()
  }

  componentWillUnmount() {
  }

  async getServerTime() {
    try {

      const response = await axios.get(`${API_ROOT_URL}/server_time`,
      {
        headers: {
          authorization: cookies.get('token'),
          'content-type': 'application/json'
        }
      })

      const data = await response;
      return data.data.ts;
    } catch(error) {
      console.log(error);
    }
  }

  async populateDefaultValues() {
    let timestring = this.props.event.ts;
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
    this.props.handleDestroy();
  }

  handleFormHide() {
    if(this.state.event_id) {
      this.props.handleDeleteEvent(this.state.event_id)
    }
    this.props.handleDestroy()
  }

  renderTextField({ input, label, placeholder, required, meta: { touched, error } }) {
    let requiredField = (required)? <span className='text-danger'> *</span> : ''
    // let placeholder_txt = (placeholder)? placeholder: label

    return (
      <Form.Group>
        <Form.Label>{label}{requiredField}</Form.Label>
        <Form.Control type="text" {...input} placeholder={placeholder} isInvalid={touched && error}/>
        <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
      </Form.Group>
    )
  }

  renderTextArea({ input, label, placeholder, required, rows = 4, meta: { error } }) {
    let requiredField = (required)? <span className='text-danger'> *</span> : ''
    let placeholder_txt = (placeholder)? placeholder: label

    return (
      <Form.Group>
        <Form.Label>{label}{requiredField}</Form.Label>
        <Form.Control as="textarea" {...input} placeholder={placeholder_txt} rows={rows}/>
        <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
      </Form.Group>
    )
  }

  renderSelectField({ input, label, placeholder, required, options, meta: { touched, error } }) {

    let requiredField = (required)? <span className='text-danger'> *</span> : ''
    let placeholder_txt = (placeholder)? placeholder: label
    let defaultOption = ( <option key={`${input.name}.empty`} value=""></option> );
    let optionList = options.map((option, index) => {
      return (
        <option key={`${input.name}.${index}`} value={`${option}`}>{ `${option}`}</option>
      );
    });

    return (
      <Form.Group>
        <Form.Label>{label}{requiredField}</Form.Label>
        <Form.Control as="select" {...input} placeholder={placeholder_txt} isInvalid={touched && error}>
          { defaultOption }
          { optionList }
        </Form.Control>
        <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
      </Form.Group>
    )
  }

  renderCheckboxGroup({ label, options, input, required, meta: { dirty, error } }) {

    let requiredField = (required)? (<span className='text-danger'> *</span>) : ''
    let checkboxList = options.map((option, index) => {

      return (
          <Form.Check
            inline
            label={option.value}
            name={`${option.label}[${index}]`}
            key={`${label}.${index}`}
            value={option.value}
            checked={input.value.indexOf(option.value) !== -1}
            onChange={event => {
              const newValue = [...input.value];
              if(event.target.checked) {
                newValue.push(option.value);
              } else {
                newValue.splice(newValue.indexOf(option.value), 1);
              }
              return input.onChange(newValue);
            }}
          > 
          </Form.Check>
      );
    });

    return (
      <Form.Group>
        <Form.Label>{label}{requiredField}</Form.Label><br/>
        {checkboxList}
        {dirty && (error && <div className="text-danger" style={{width: "100%", marginTop: "0.25rem", fontSize: "80%"}}>{error}</div>)}
      </Form.Group>
    );
  }

  renderCheckbox({ input, label, meta: { dirty, error } }) {    
    return (
      <Form.Group>
        <Form.Check
          {...input}
          label={label}
          checked={input.value ? true : false}
          onChange={(e) => input.onChange(e.target.checked)}
          isInvalid={dirty && error}
        >
        </Form.Check>
        <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
      </Form.Group>
    );
  }

  renderDatePicker({ input, required, label, disabled, meta: { touched, error } }) {

    let requiredField = (required)? <span className='text-danger'> *</span> : ''

    return (
      <Form.Group>
        <Form.Label>{label}{requiredField}</Form.Label>
        <Datetime
          {...input}
          utc={true}
          value={(input.value && moment.utc(input.value).isValid()) ? moment.utc(input.value).format(dateFormat + " " + timeFormat) : null}
          dateFormat={dateFormat}
          timeFormat={timeFormat}
          selected={(input.value)? moment.utc(input.value, dateFormat + " " + timeFormat) : null }
          inputProps={{ disabled: disabled }}
        />
        {touched && (error && <div style={{width: "100%", marginTop: "0.25rem", fontSize: "80%"}} className='text-danger'>{error}</div>)}
      </Form.Group>
    )
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
              component={this.renderSelectField}
              label={option.event_option_name}
              required={ option.event_option_required }
              validate={ option.event_option_required ? required : undefined }
              options={option.event_option_values}
              defaultValue={option.event_option_default_value}
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
              component={this.renderCheckboxGroup}
              label={option.event_option_name}
              options={optionList}
              required={ option.event_option_required }
              validate={ option.event_option_required ? requiredArray : undefined }
            />
          </div>
        )
      } else if (option.event_option_type === 'text') {
        return (
          <div key={`option_${index}`}>
            <Field
              name={`option_${index}`}
              component={this.renderTextField}
              label={option.event_option_name}
              required={ option.event_option_required }
              validate={ option.event_option_required ? required : undefined }
            />
          </div>
        )
      }
    }));
  }

  render() {

    const { show, handleSubmit, eventTemplate, submitting, valid } = this.props

    const footer = (this.state.event_id) ? 
      <span className="float-right">
        <Button variant="secondary" disabled={submitting} onClick={this.handleFormHide}>Cancel</Button>
        <Button variant="primary" type="submit" disabled={ submitting || !valid}>Submit</Button>
      </span>
      : 
      <Button className="float-right" variant="secondary" onClick={this.handleFormHide}>Close</Button>
      

    return (
      <Modal show={show} onHide={this.handleFormHide}>
        <form onSubmit={ handleSubmit(this.handleFormSubmit.bind(this)) }>
          <Modal.Header closeButton>
            <Modal.Title>Event Options - {eventTemplate.event_value}</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            {this.renderEventOptions()}
            <Field
              name="event_free_text"
              component={this.renderTextField}
              label="Additional Text"
              required={eventTemplate.event_free_text_required}
              validate={ eventTemplate.event_free_text_required ? required : undefined }
            />
            <Field
              name="event_ts"
              label="Custom Time (UTC)"
              component={this.renderDatePicker}
              disabled={this.props.disabled}
              required={true}
            />
          </Modal.Body>
          <Modal.Footer>
            {footer}
          </Modal.Footer>
        </form>
      </Modal>
    );
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
