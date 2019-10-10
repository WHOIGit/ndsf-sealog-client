import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { reduxForm, Field, reset } from 'redux-form';
import { Alert, Button, Col, Form, Card } from 'react-bootstrap';
import moment from 'moment';
import Datetime from 'react-datetime';
import * as mapDispatchToProps from '../actions';
import { DEFAULT_VESSEL } from '../client_config';

const dateFormat = "YYYY-MM-DD";

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

    if(formProps.cruise_vessel) {
      formProps.cruise_additional_meta.cruise_vessel = formProps.cruise_vessel;
      delete formProps.cruise_vessel;
    }

    if(formProps.cruise_description) {
      formProps.cruise_additional_meta.cruise_description = formProps.cruise_description;
      delete formProps.cruise_description;
    }

    this.props.createCruise(formProps);
  }

  renderTextField({ input, label, placeholder, required, meta: { touched, error } }) {
    let requiredField = (required)? <span className='text-danger'> *</span> : '';
    let placeholder_txt = (placeholder)? placeholder: label;

    return (
      <Form.Group as={Col} lg="6">
        <Form.Label>{label}{requiredField}</Form.Label>
        <Form.Control type="text" {...input} placeholder={placeholder_txt} isInvalid={touched && error}/>
        <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
      </Form.Group>
    );
  }

  renderTextArea({ input, label, placeholder, required, rows = 4, meta: { error } }) {
    let requiredField = (required)? <span className='text-danger'> *</span> : '';
    let placeholder_txt = (placeholder)? placeholder: label;

    return (
      <Form.Group as={Col} lg="12">
        <Form.Label>{label}{requiredField}</Form.Label>
        <Form.Control as="textarea" {...input} placeholder={placeholder_txt} rows={rows}/>
        <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
      </Form.Group>
    );
  }

  renderSelectField({ input, label, placeholder, required, options, meta: { touched, error } }) {

    let requiredField = (required)? <span className='text-danger'> *</span> : '';
    let placeholder_txt = (placeholder)? placeholder: label;
    let defaultOption = ( <option key={`${input.name}.empty`} value=""></option> );
    let optionList = options.map((option, index) => {
      return (
        <option key={`${input.name}.${index}`} value={`${option}`}>{ `${option}`}</option>
      );
    });

    return (
      <Form.Group as={Col} lg="6">
        <Form.Label>{label}{requiredField}</Form.Label>
        <Form.Control as="select" {...input} placeholder={placeholder_txt} isInvalid={touched && error}>
          { defaultOption }
          { optionList }
        </Form.Control>
        <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
      </Form.Group>
    );
  }

  renderDatePicker({ input, label, required, meta: { touched, error } }) {
    let requiredField = (required)? <span className='text-danger'> *</span> : '';
    
    return (
      <Form.Group as={Col} lg="6">
        <Form.Label>{label}{requiredField}</Form.Label>
        <Datetime {...input} utc={true} value={input.value ? moment.utc(input.value).format(dateFormat) : null} dateFormat={dateFormat} timeFormat={false} selected={input.value ? moment.utc(input.value, dateFormat) : null }/>
        {touched && (error && <div style={{width: "100%", marginTop: "0.25rem", fontSize: "80%"}} className='text-danger'>{error}</div>)}
      </Form.Group>
    );
  }

  renderCheckboxGroup({ label, options, input, required, meta: { dirty, error } }) {

    let requiredField = (required)? (<span className='text-danger'> *</span>) : '';
    let checkboxList = options.map((option, index) => {

      //let tooltip = (option.description)? (<Tooltip id={`${option.value}_Tooltip`}>{option.description}</Tooltip>) : null
      //let overlay = (tooltip !== null)? (<OverlayTrigger placement="right" overlay={tooltip}><span>{option.label}</span></OverlayTrigger>) : option.label

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
        />
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
      <Form.Group as={Col} lg="6">
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

  renderAlert() {
    if (this.props.errorMessage) {
      return (
        <Alert variant="danger">
          <strong>Opps!</strong> {this.props.errorMessage}
        </Alert>
      );
    }
  }

  renderMessage() {
    if (this.props.message) {
      return (
        <Alert variant="success">
          <strong>Success!</strong> {this.props.message}
        </Alert>
      );
    }
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
                    component={this.renderTextField}
                    label="Cruise ID"
                    placeholder="i.e. AT42-01"
                    required={true}
                  />
                  <Field
                    name="cruise_name"
                    component={this.renderTextField}
                    label="Cruise Name"
                    placeholder="i.e. Lost City 2018"
                  />
                  <Field
                    name="cruise_vessel"
                    component={this.renderTextField}
                    label="Vessel Name"
                    placeholder="i.e. R/V Atlantis"
                    required={true}
                  />
                  <Field
                    name="cruise_pi"
                    component={this.renderTextField}
                    label="Primary Investigator"
                    placeholder="i.e. Dr. Susan Lang"
                    required={true}
                  />
                  <Field
                    name="cruise_location"
                    component={this.renderTextArea}
                    label="Cruise Location"
                    placeholder="i.e. Lost City, Mid Atlantic Ridge"
                    rows={1}
                  />
                </Form.Row>
                <Form.Row>
                  <Field
                    name="cruise_description"
                    component={this.renderTextArea}
                    label="Cruise Description"
                    placeholder="i.e. A brief summary of the cruise"
                    rows={8}
                  />
                </Form.Row>
                <Form.Row>
                  <Field
                    name="start_ts"
                    component={this.renderDatePicker}
                    label="Start Date (UTC)"
                    required={true}
                  />
                  <Field
                    name="stop_ts"
                    component={this.renderDatePicker}
                    label="Stop Date (UTC)"
                    required={true}
                  />
                </Form.Row>
                <Form.Row>
                  <Field
                    name="cruise_participants"
                    component={this.renderTextArea}
                    type="textarea"
                    label="Cruise Participants, comma delimited"
                    placeholder="i.e. Dave Butterfield,Sharon Walker"
                    rows={2}
                  />
                  <Field
                    name="cruise_tags"
                    component={this.renderTextArea}
                    type="textarea"
                    label="Cruise Tags, comma delimited"
                    placeholder="i.e. coral,chemistry,engineering"
                    rows={2}
                  />
                </Form.Row>
                {this.renderAlert()}
                {this.renderMessage()}
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