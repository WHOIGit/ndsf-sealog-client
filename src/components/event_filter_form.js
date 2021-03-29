import React, { Component } from 'react';
import { compose } from 'redux';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { reduxForm, Field } from 'redux-form';
import moment from 'moment';
import { Button, Card, Form } from 'react-bootstrap';
import { renderDateTimePicker, renderTextField } from './form_elements';
import * as mapDispatchToProps from '../actions';

const timeFormat = "HH:mm:ss"

class EventFilterForm extends Component {

  constructor (props) {
    super(props);

    this.clearForm = this.clearForm.bind(this);
  }

  static propTypes = {
    handlePostSubmit: PropTypes.func.isRequired,
    initialValues: PropTypes.object
  };

  componentDidMount() {
    if(this.props.initialValues) {
      this.props.initialize(this.props.initialValues);
    }
  }

  componentWillUnmount() {
  }


  async populateDefaultValues() {
    let eventDefaultValues = {event_ts: moment.utc()};
    this.props.eventTemplate.event_options.forEach((option, index) => {
      if(option.event_option_default_value) {
        eventDefaultValues[`option_${index}`] = option.event_option_default_value;
      }
    });
    this.props.initialize(eventDefaultValues);
  }

  handleFormSubmit(formProps) {

      if(formProps.startTS && typeof(formProps.startTS) === "object") {
        if(this.props.minDate && formProps.startTS.isBefore(moment(this.props.minDate))) {
          formProps.startTS = this.props.minDate
        } else {
          formProps.startTS = formProps.startTS.toISOString()
        }
      }

      if(formProps.stopTS && typeof(formProps.stopTS) === "object") {
        if(this.props.maxDate && formProps.stopTS.isAfter(moment(this.props.maxDate))) {
          formProps.stopTS = this.props.maxDate
        } else {
          formProps.stopTS = formProps.stopTS.toISOString()
        }
      }

      if(formProps.value) {
        formProps.value = formProps.value.split(',').map((value) => value.trim()).join(',')
      }

      if(formProps.author) {
        formProps.author = formProps.author.split(',').map((author) => author.trim()).join(',')
      }

    this.props.handlePostSubmit(formProps);
  }

  clearForm() {
    this.props.resetFields('eventFilterForm', {
      value: '',
      author: '',
      startTS: '',
      stopTS: '',
      freetext: '',
      datasource: ''
    });
    this.props.handlePostSubmit();
  }

  render() {

    const { handleSubmit, submitting, valid } = this.props;
    const eventFilterFormHeader = (<div>Event Filter</div>);
    const startTS = (this.props.minDate)? moment(this.props.minDate): null
    const stopTS = (this.props.maxDate)? moment(this.props.maxDate): null

    return (
      <Card className="form-standard border-secondary">
        <Card.Header>{eventFilterFormHeader}</Card.Header>
        <Card.Body className="px-0">
          <Form onSubmit={ handleSubmit(this.handleFormSubmit.bind(this)) }>
            <Field
              name="value"
              component={renderTextField}
              label="Event Value"
              placeholder="i.e. SAMPLE"
              disabled={this.props.disabled}
              lg={12}
              sm={12}
            />
            <Field
              name="author"
              component={renderTextField}
              label="Author"
              placeholder="i.e. jsmith"
              disabled={this.props.disabled}
              lg={12}
              sm={12}
            />
            <Field
              name="startTS"
              component={renderDateTimePicker}
              defaultValue={startTS}
              timeFormat={timeFormat}
              label="Start Date/Time (UTC)"
              disabled={this.props.disabled}
              lg={12}
              sm={12}
            />
            <Field
              name="stopTS"
              component={renderDateTimePicker}
              defaultValue={stopTS}
              timeFormat={timeFormat}
              label="Stop Date/Time (UTC)"
              disabled={this.props.disabled}
              lg={12}
              sm={12}
            />
            <Field
              name="freetext"
              component={renderTextField}
              label="Freeform Text"
              disabled={this.props.disabled}
              lg={12}
              sm={12}
            />
            <div className="float-right">
              <Button className="mr-1" variant="secondary" size="sm" disabled={submitting || this.props.disabled} onClick={this.clearForm}>Reset</Button>
              <Button className="mr-3" variant="primary" size="sm" type="submit" disabled={submitting || !valid || this.props.disabled}>Filter</Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    )
  }
}

function validate() {
  const errors = {};
  return errors;
}

function mapStateToProps() {
  return {};
}

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  reduxForm({
    form: 'eventFilterForm',
    // enableReinitialize: true,
    validate: validate
  })
)(EventFilterForm);