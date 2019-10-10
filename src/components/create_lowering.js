import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { reduxForm, Field, reset } from 'redux-form';
import { Alert, Button, Col, Form, Card } from 'react-bootstrap';
import moment from 'moment';
import Datetime from 'react-datetime';
import * as mapDispatchToProps from '../actions';

const dateFormat = "YYYY-MM-DD";
const timeFormat = "HH:mm";

class CreateLowering extends Component {

  componentWillUnmount() {
    this.props.leaveCreateLoweringForm();
  }

  handleFormSubmit(formProps) {
    formProps.lowering_tags = (formProps.lowering_tags)? formProps.lowering_tags.map(tag => tag.trim()): [];
 
    formProps.lowering_additional_meta = {};

    if(formProps.lowering_description) {
      formProps.lowering_additional_meta.lowering_description = formProps.lowering_description;
      delete formProps.lowering_description;
    }

    this.props.createLowering(formProps);
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
        <Datetime {...input} utc={true} value={input.value ? moment.utc(input.value).format(dateFormat + ' ' + timeFormat) : null} dateFormat={dateFormat} timeFormat={timeFormat} selected={input.value ? moment.utc(input.value, dateFormat) : null }/>
        {touched && (error && <div style={{width: "100%", marginTop: "0.25rem", fontSize: "80%"}} className='text-danger'>{error}</div>)}
      </Form.Group>
    );
  }

  renderCheckboxGroup({ label, options, input, required, meta: { dirty, error } }) {

    let requiredField = (required)? (<span className='text-danger'> *</span>) : '';
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
    const createLoweringFormHeader = (<div>Create New Lowering</div>);

    if (this.props.roles) {

      if(this.props.roles.includes("admin")) {

        return (
          <Card>
            <Card.Header>{createLoweringFormHeader}</Card.Header>
            <Card.Body>
              <Form onSubmit={ handleSubmit(this.handleFormSubmit.bind(this)) }>
                <Form.Row>
                  <Field
                    name="lowering_id"
                    component={this.renderTextField}
                    label="Lowering ID"
                    placeholder="i.e. J2-1000"
                    required={true}
                  />
                  <Field
                    name="lowering_location"
                    component={this.renderTextField}
                    label="Lowering Location"
                    placeholder="i.e. Kelvin Seamount"
                  />
                </Form.Row>
                <Form.Row>
                  <Field
                    name="lowering_description"
                    component={this.renderTextArea}
                    label="Lowering Description"
                    placeholder="i.e. A brief description of the lowering"
                    rows={8}
                  />
                </Form.Row>
                <Form.Row>
                  <Field
                    name="start_ts"
                    component={this.renderDatePicker}
                    label="Start Date/Time (UTC)"
                    required={true}
                  />
                  <Field
                    name="stop_ts"
                    component={this.renderDatePicker}
                    label="Stop Date/Time (UTC)"
                    required={true}
                  />
                </Form.Row>
                <Form.Row>
                  <Field
                    name="lowering_tags"
                    component={this.renderTextArea}
                    label="Lowering Tags, comma delimited"
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

  if (!formProps.lowering_id) {
    errors.lowering_id = 'Required';
  } else if (formProps.lowering_id.length > 15) {
    errors.lowering_id = 'Must be 15 characters or less';
  }

  if (!formProps.lowering_name) {
    errors.lowering_name = 'Required';
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

  return errors;

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
    onSubmitSuccess: afterSubmit
  })
  )(CreateLowering)