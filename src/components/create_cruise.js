import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { reduxForm, Field, reset } from 'redux-form';
import { Button, Form, Card } from 'react-bootstrap';
import moment from 'moment';
import { renderAlert, renderDatePicker, renderMessage, renderTextField, renderTextArea, dateFormat } from './form_elements';
import * as mapDispatchToProps from '../actions';
import { DEFAULT_VESSEL } from '../client_config';

class CreateCruise extends Component {

  componentDidMount() {
    this.populateDefaultValues()
  }

  componentWillUnmount() {
    this.props.leaveCreateCruiseForm();
  }

  async populateDefaultValues() {
    let cruiseDefaultValues = { cruise_vessel: DEFAULT_VESSEL };
    this.props.initialize(cruiseDefaultValues);
  }

  handleFormSubmit(formProps) {

    formProps.cruise_tags = (formProps.cruise_tags)? formProps.cruise_tags.map(tag => tag.trim()): [];

    formProps.cruise_additional_meta = {};

    if(formProps.cruise_participants) {
      formProps.cruise_additional_meta.cruise_participants = formProps.cruise_participants.map(participant => participant.trim());
      delete formProps.cruise_participants;
    }

    if(formProps.cruise_name) {
      formProps.cruise_additional_meta.cruise_name = formProps.cruise_name;
      delete formProps.cruise_name;
    }

    if(formProps.cruise_departure_location) {
      formProps.cruise_additional_meta.cruise_departure_location = formProps.cruise_departure_location;
      delete formProps.cruise_departure_location;
    }

    if(formProps.cruise_arrival_location) {
      formProps.cruise_additional_meta.cruise_arrival_location = formProps.cruise_arrival_location;
      delete formProps.cruise_arrival_location;
    }

    if(formProps.cruise_description) {
      formProps.cruise_additional_meta.cruise_description = formProps.cruise_description;
      delete formProps.cruise_description;
    }

    this.props.createCruise(formProps);
  }

  render() {

    const { handleSubmit, pristine, reset, submitting, valid } = this.props;
    const createCruiseFormHeader = (<div>Create New Cruise</div>);

    if (this.props.roles) {

      if(this.props.roles.includes("admin")) {

        return (
          <Card>
            <Card.Header>{createCruiseFormHeader}</Card.Header>
            <Card.Body>
              <Form onSubmit={ handleSubmit(this.handleFormSubmit.bind(this)) }>
                <Form.Row>
                  <Field
                    name="cruise_id"
                    component={renderTextField}
                    label="Cruise ID"
                    placeholder="i.e. AT42-01"
                    required={true}
                  />
                  <Field
                    name="cruise_name"
                    component={renderTextField}
                    label="Cruise Name"
                    placeholder="i.e. Lost City 2018"
                  />
                </Form.Row>
                <Form.Row>
                  <Field
                    name="cruise_vessel"
                    component={renderTextField}
                    label="Vessel Name"
                    placeholder="i.e. R/V Atlantis"
                    required={true}
                  />
                  <Field
                    name="cruise_pi"
                    component={renderTextField}
                    label="Primary Investigator"
                    placeholder="i.e. Dr. Susan Lang"
                    required={true}
                  />
                </Form.Row>
                <Form.Row>
                  <Field
                    name="cruise_location"
                    component={renderTextField}
                    label="Cruise Location"
                    placeholder="i.e. Lost City, Mid Atlantic Ridge"
                    lg={12}
                    sm={12}
                  />
                </Form.Row>
                <Form.Row>
                  <Field
                    name="cruise_description"
                    component={renderTextArea}
                    label="Cruise Description"
                    placeholder="i.e. A brief summary of the cruise"
                    rows={8}
                  />
                </Form.Row>
                <Form.Row>
                  <Field
                    name="start_ts"
                    component={renderDatePicker}
                    label="Start Date (UTC)"
                    required={true}
                  />
                  <Field
                    name="stop_ts"
                    component={renderDatePicker}
                    label="Stop Date (UTC)"
                    required={true}
                  />
                </Form.Row>
                <Form.Row>
                  <Field
                    name="cruise_departure_location"
                    component={renderTextField}
                    label="Departure Port"
                    placeholder="i.e. Norfolk, VA"
                    required={true}
                  />
                  <Field
                    name="cruise_arrival_location"
                    component={renderTextField}
                    label="Arrival Port"
                    placeholder="i.e. St. George's, Bermuda"
                    required={true}
                  />
                </Form.Row>
                <Form.Row>
                  <Field
                    name="cruise_participants"
                    component={renderTextArea}
                    type="textarea"
                    label="Cruise Participants, comma delimited"
                    placeholder="i.e. Dave Butterfield,Sharon Walker"
                    rows={2}
                  />
                </Form.Row>
                <Form.Row>
                  <Field
                    name="cruise_tags"
                    component={renderTextArea}
                    type="textarea"
                    label="Cruise Tags, comma delimited"
                    placeholder="i.e. coral,chemistry,engineering"
                    rows={2}
                  />
                </Form.Row>
                {renderAlert(this.props.errorMessage)}
                {renderMessage(this.props.message)}
                <div className="float-right" style={{marginRight: "-20px", marginBottom: "-8px"}}>
                  <Button variant="secondary" size="sm" disabled={pristine || submitting} onClick={reset}>Reset Form</Button>
                  <Button variant="primary" size="sm" type="submit" disabled={submitting || !valid}>Create</Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        );
      } else {
        return null;
      }
    } else {
      return (
        <div>
          Loading...
        </div>
      );
    }
  }
}

function validate(formProps) {
  const errors = {};

  if (!formProps.cruise_id) {
    errors.cruise_id = 'Required';
  } else if (formProps.cruise_id.length > 15) {
    errors.cruise_id = 'Must be 15 characters or less';
  }

  if (!formProps.cruise_pi) {
    errors.cruise_pi = 'Required';
  }

  if (!formProps.cruise_vessel) {
    errors.cruise_vessel = 'Required';
  }

  if (!formProps.start_ts) {
    errors.start_ts = 'Required';
  } else if (!moment.utc(formProps.start_ts).isValid()) {
    errors.start_ts = 'Invalid timestamp';
  }

  if (!formProps.stop_ts) {
    errors.stop_ts = 'Required';
  } else if (!moment.utc(formProps.stop_ts).isValid()) {
    errors.stop_ts = 'Invalid timestamp';
  }

  if ((formProps.start_ts !== '') && (formProps.stop_ts !== '')) {
    if(moment(formProps.stop_ts, dateFormat).isBefore(moment(formProps.start_ts, dateFormat))) {
      errors.stop_ts = 'Stop date must be later than start data';
    }
  }

  if (!formProps.cruise_departure_location) {
    errors.cruise_departure_location = 'Required';
  }

  if (!formProps.cruise_arrival_location) {
    errors.cruise_arrival_location = 'Required';
  }

  if (typeof formProps.cruise_tags === "string") {
    if (formProps.cruise_tags === '') {
      formProps.cruise_tags = [];
    } else {
      formProps.cruise_tags = formProps.cruise_tags.split(',');
    }
  }

  if (typeof formProps.cruise_participants === "string") {
    if (formProps.cruise_participants === '') {
      formProps.cruise_participants = [];
    } else {
      formProps.cruise_participants = formProps.cruise_participants.split(',');
    }
  }

  return errors;

}

const afterSubmit = (result, dispatch) =>
  dispatch(reset('createCruise'));

function mapStateToProps(state) {

  return {
    errorMessage: state.cruise.cruise_error,
    message: state.cruise.cruise_message,
    roles: state.user.profile.roles
  };
}

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  reduxForm({
    form: 'createCruise',
    enableReinitialize: true,
    validate: validate,
    keepDirtyOnReinitialize : true,
    onSubmitSuccess: afterSubmit
  })
)(CreateCruise)