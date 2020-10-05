import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { reduxForm, Field, reset } from 'redux-form';
import { Button, Form, Card } from 'react-bootstrap';
import { renderAlert, renderDateTimePicker, renderMessage, renderSwitch, renderTextField, renderTextArea, dateFormat, timeFormat } from './form_elements';
import moment from 'moment';
import * as mapDispatchToProps from '../actions';
import { LOWERING_ID_REGEX } from '../client_config';

class CreateLowering extends Component {


  componentDidMount() {
    this.populateDefaultValues();
  }

  componentWillUnmount() {
    this.props.leaveCreateLoweringForm();
  }

  async populateDefaultValues() {
    let loweringDefaultValues = { start_ts: moment.utc(), stop_ts: moment.utc().add(1, 'days') };
    this.props.initialize(loweringDefaultValues);
  }


  handleFormSubmit(formProps) {
    formProps.lowering_tags = (formProps.lowering_tags)? formProps.lowering_tags.map(tag => tag.trim()): [];
 
    formProps.lowering_additional_meta = {};

    if(formProps.pilot) {
      formProps.lowering_additional_meta.pilot = formProps.pilot;
      delete formProps.pilot;
    }

    if(formProps.surface_officer) {
      formProps.lowering_additional_meta.surface_officer = formProps.surface_officer;
      delete formProps.surface_officer;
    }

    if(formProps.lowering_passengers) {
      formProps.lowering_additional_meta.lowering_passengers = formProps.lowering_passengers.map(participant => participant.trim());
      delete formProps.lowering_passengers;
    }

    if(formProps.lowering_description) {
      formProps.lowering_additional_meta.lowering_description = formProps.lowering_description;
      delete formProps.lowering_description;
    }

    this.props.createLowering(formProps);
  }

  render() {

    const { handleSubmit, pristine, reset, submitting, valid } = this.props;
    const createLoweringFormHeader = (<div>Create New Lowering</div>);

    if (this.props.roles) {

      if(this.props.roles.includes("admin")) {

        return (
          <Card className="border-secondary">
            <Card.Header>{createLoweringFormHeader}</Card.Header>
            <Card.Body>
              <Form onSubmit={ handleSubmit(this.handleFormSubmit.bind(this)) }>
                <Form.Row>
                  <Field
                    name="lowering_id"
                    component={renderTextField}
                    label="Lowering ID"
                    placeholder="i.e. NDR987"
                    required={true}
                  />
                  <Field
                    name="lowering_location"
                    component={renderTextField}
                    label="Lowering Location"
                    placeholder="i.e. Kelvin Seamount"
                  />
                </Form.Row>
                <Form.Row>
                  <Field
                    name="lowering_description"
                    component={renderTextArea}
                    label="Lowering Description"
                    placeholder="i.e. A brief description of the lowering"
                    rows={8}
                  />
                </Form.Row>
                <Form.Row>
                  <Field
                    name="pilot"
                    component={renderTextField}
                    label="Pilot"
                    placeholder="i.e. Toby Mitchell"
                    required={true}
                  />
                  <Field
                    name="surface_officer"
                    component={renderTextField}
                    label="Surface Officer"
                    placeholder="i.e. Colin Wollerman"
                    required={true}
                  />
                </Form.Row>
                <Form.Row>
                  <Field
                    name="lowering_passengers"
                    component={renderTextArea}
                    label="Passengers, comma delimited"
                    placeholder="i.e. Mark Dalio, Vincent Pieribone"
                    rows={1}
                  />
                </Form.Row>
                <Form.Row>
                  <Field
                    name="start_ts"
                    component={renderDateTimePicker}
                    label="Start Date/Time (UTC)"
                    required={true}
                  />
                  <Field
                    name="stop_ts"
                    component={renderDateTimePicker}
                    label="Stop Date/Time (UTC)"
                    required={true}
                  />
                </Form.Row>
                <Form.Row>
                  <Field
                    name="lowering_tags"
                    component={renderTextArea}
                    label="Lowering Tags, comma delimited"
                    placeholder="i.e. coral,chemistry,engineering"
                    rows={2}
                  />
                </Form.Row>
                {renderAlert(this.props.errorMessage)}
                {renderMessage(this.props.message)}
                <div className="float-right">
                  <Button className="mr-1" variant="secondary" size="sm" disabled={pristine || submitting} onClick={reset}>Reset Form</Button>
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

  if (!formProps.lowering_id) {
    errors.lowering_id = 'Required';
  } else if (formProps.lowering_id.length > 15) {
    errors.lowering_id = 'Must be 15 characters or less';
  } 

  if (!formProps.pilot) {
    errors.pilot = 'Required';
  }

  if (!formProps.surface_officer) {
    errors.surface_officer = 'Required';
  }

  if (typeof formProps.lowering_passengers === "string") {
    if (formProps.lowering_passengers === '') {
      formProps.lowering_passengers = [];
    } else {
      formProps.lowering_passengers = formProps.lowering_passengers.split(',');
    }
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
    if(moment(formProps.stop_ts, dateFormat + " " + timeFormat).isBefore(moment(formProps.start_ts, dateFormat + " " + timeFormat))) {
      errors.stop_ts = 'Stop date/time must be later than start date/time';
    }
  }

  if (typeof formProps.lowering_tags === "string") {
    if (formProps.lowering_tags === '') {
      formProps.lowering_tags = [];
    } else {
      formProps.lowering_tags = formProps.lowering_tags.split(',');
    }
  }


  // console.log('errors:', errors);
  return errors;

}

function warn(formProps) {

  const warnings = {}

  if (formProps.lowering_id && LOWERING_ID_REGEX != null && !formProps.lowering_id.match(LOWERING_ID_REGEX)) {
    warnings.lowering_id = 'Non-standard ID';
  }

  return warnings;
}


const afterSubmit = (result, dispatch) =>
  dispatch(reset('createLowering'));

function mapStateToProps(state) {

  return {
    errorMessage: state.lowering.lowering_error,
    message: state.lowering.lowering_message,
    roles: state.user.profile.roles
  };
}

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  reduxForm({
    form: 'createLowering',
    enableReinitialize: true,
    validate: validate,
    warn: warn,
    keepDirtyOnReinitialize : true,
    onSubmitSuccess: afterSubmit
  })
  )(CreateLowering)