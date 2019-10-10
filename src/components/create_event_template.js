import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { reduxForm, Field, FieldArray, formValueSelector, reset } from 'redux-form';
import { Alert, Button, Card, Form } from 'react-bootstrap';
import * as mapDispatchToProps from '../actions';
import { EventTemplateOptionTypes } from '../event_template_option_types';


class CreateEventTemplate extends Component {

  constructor (props) {
    super(props);

    this.renderOptions = this.renderOptions.bind(this);
    this.renderOptionOptions = this.renderOptionOptions.bind(this);
  }

  componentWillUnmount() {
    this.props.leaveCreateEventTemplateForm();
  }

  handleFormSubmit(formProps) {
    if(typeof(formProps.system_template) === 'undefined'){
      formProps.system_template = false;
    }
    this.props.createEventTemplate(formProps);
  }

  renderTextField({ input, label, placeholder, required, meta: { touched, error } }) {
    let requiredField = (required)? <span className='text-danger'> *</span> : '';
    let placeholder_txt = (placeholder)? placeholder: label;

    return (
      <Form.Group>
        <Form.Label>{label}{requiredField}</Form.Label>
        <Form.Control type="text" {...input} placeholder={placeholder_txt} isInvalid={touched && error}/>
        <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
      </Form.Group>
    );
  }

  renderSelectField({ input, label, placeholder, required, options, meta: { touched, error } }) {

    let requiredField = (required)? <span className='text-danger'> *</span> : '';
    let placeholder_txt = (placeholder)? placeholder: label;
    let defaultOption = ( <option key={`${input.name}.default`} value=""></option> );
    let optionList = options.map((option, index) => {
      return (
        <option key={`${input.name}.${index}`} value={`${option}`}>{ `${option}`}</option>
      );
    });

    return (
      <Form.Group controlId="formControlsSelect">
        <Form.Label>{label}{requiredField}</Form.Label>
        <Form.Control as="select" {...input} placeholder={placeholder_txt} isInvalid={touched && error}>
          { defaultOption }
          { optionList }
        </Form.Control>
        <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
      </Form.Group>
    );
  }

  renderCheckbox({ input, label, meta: { dirty, error } }) {    

    return (
      <Form.Group>
        <Form.Check
          {...input}
          checked={input.value ? true : false}
          onChange={(e) => input.onChange(e.target.checked)}
          isInvalid={dirty && error}
          label={label}
        >
        </Form.Check>
        <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
      </Form.Group>
    );
  }

  renderOptionOptions(prefix, index) {
    if(this.props.event_options[index].event_option_type === 'text') {
      return (
        <div>
          <Field
            name={`${prefix}.event_option_default_value`}
            component={this.renderTextField}
            label="Default Value"
          />
        </div>
      );
    } else if(this.props.event_options[index].event_option_type === 'dropdown') {
      return (
        <div>
          <Field
            name={`${prefix}.event_option_values`}
            component={this.renderTextField}
            label="Dropdown Options"
          />
          <Field
            name={`${prefix}.event_option_default_value`}
            component={this.renderTextField}
            label="Default Value"
            placeholder="i.e. a value from the list of options"
          />
        </div>
      );
    } else if(this.props.event_options[index].event_option_type === 'checkboxes') {
      return (
        <div>
          <Field
            name={`${prefix}.event_option_values`}
            component={this.renderTextField}
            label="Checkbox Options"
          />
          <Field
            name={`${prefix}.event_option_default_value`}
            component={this.renderTextField}
            label="Default Value"
            placeholder="i.e. a value from the list of options"
          />
        </div>
      );
    } else {
      return;
    }
  }

  renderOptions({ fields, meta: { touched, error } }) {

    const promote = (index, fields) => {
      if(index > 0) {
        return(<FontAwesomeIcon className="text-primary float-right" icon='chevron-up' fixedWidth onClick={() => fields.swap(index, index-1)}/>);
      }
    };

    const demote = (index, fields) => {
      if(index < fields.length-1) {
        return(<FontAwesomeIcon className="text-primary float-right" icon='chevron-down' fixedWidth onClick={() => fields.swap(index, index+1)}/>);
      }
    };

    return (
      <div>
        {fields.map((options, index) =>
          <div key={`option_${index}`}>
            <hr className="border-secondary" />
            <span>
              <Form.Label>Option #{index + 1}</Form.Label>
              <FontAwesomeIcon className="text-danger float-right" icon='trash' fixedWidth onClick={() => fields.remove(index)}/>
              {promote(index, fields)}
              {demote(index, fields)}
            </span>
            <Field
              name={`${options}.event_option_name`}
              component={this.renderTextField}
              label="Name"
              required={true}
            />
            <Field
              name={`${options}.event_option_type`}
              component={this.renderSelectField}
              options={EventTemplateOptionTypes}
              label="Type"
              required={true}
            />
            { this.renderOptionOptions(options, index) }
            <Field
              name={`${options}.event_option_required`}
              component={this.renderCheckbox}
              label="Required?"
            />
          </div>
        )}
        <span className="text-primary" onClick={() => fields.push({})}>
          <FontAwesomeIcon icon='plus' fixedWidth/> Add Option
        </span>
        {touched && error && <span>{error}</span>}
      </div>
    );
  }

  renderAdminOptions() {
    if(this.props.roles.includes('admin')) {
      return (
        <div>
          {this.renderSystemEventTemplateOption()}
        </div>
      );
    }
  }


  renderSystemEventTemplateOption() {
    return (
      <Field
        name='system_template'
        component={this.renderCheckbox}
        label="System Template?"
      />
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
    const formHeader = <div>Create Event Template</div>;


    if (this.props.roles && (this.props.roles.includes("admin") || this.props.roles.includes("template_manager"))) {
      return (
        <Card className="form-standard">
          <Card.Header>{formHeader}</Card.Header>
          <Card.Body>
            <form onSubmit={ handleSubmit(this.handleFormSubmit.bind(this)) }>
              <Field
                name="event_name"
                component={this.renderTextField}
                type="text"
                label="Button Name"
                required={true}
              />
              <Field
                name="event_value"
                type="text"
                component={this.renderTextField}
                label="Event Value"
                required={true}
              />
              <Field
                name='event_free_text_required'
                component={this.renderCheckbox}
                label={"Free text Required?"}
              />
              {this.renderAdminOptions()}
              <FieldArray name="event_options" component={this.renderOptions}/>
              <br/>
              {this.renderAlert()}
              {this.renderMessage()}
              <div className="float-right" style={{marginRight: "-20px", marginBottom: "-8px"}}>
                <Button variant="secondary" size="sm" disabled={pristine || submitting} onClick={reset}>Reset Form</Button>
                <Button variant="primary" type="submit" size="sm" disabled={pristine || submitting || !valid}>Create</Button>
              </div>
            </form>
          </Card.Body>
        </Card>
      );
    } else {
      return (
        <div>
          What are YOU doing here?
        </div>
      );
    }
  }
}

function validate(formProps) {
  const errors = {};

  if (!formProps.event_name) {
    errors.event_name = 'Required';
  } else if (formProps.event_name.length > 15) {
    errors.event_name = 'Must be 15 characters or less';
  }

  if (!formProps.event_value) {
    errors.event_value = 'Required';
  }
  if (formProps.event_options && formProps.event_options.length) {
    const event_optionsArrayErrors = [];
    formProps.event_options.forEach((event_option, event_optionIndex) => {
      const event_optionErrors = {};
      if (!event_option || !event_option.event_option_name) {
        event_optionErrors.event_option_name = 'Required';
        event_optionsArrayErrors[event_optionIndex] = event_optionErrors;
      }
      if (!event_option || !event_option.event_option_type) {
        event_optionErrors.event_option_type = 'Required';
        event_optionsArrayErrors[event_optionIndex] = event_optionErrors;
      } else {
        if (event_option.event_option_type === 'dropdown') {

          let valueArray = [];

          try {
            valueArray = event_option.event_option_values.split(',');
            valueArray = valueArray.map(string => {
              return string.trim();
            });
          }
          catch(err) {
            event_optionErrors.event_option_values = 'Invalid csv list';
            event_optionsArrayErrors[event_optionIndex] = event_optionErrors;
          }

          if(event_option.event_option_default_value && !valueArray.includes(event_option.event_option_default_value)) {
            event_optionErrors.event_option_default_value = 'Value is not in options list';
            event_optionsArrayErrors[event_optionIndex] = event_optionErrors;
          }
        } else if (event_option.event_option_type === 'checkboxes') {

          let valueArray = [];

          try {
            valueArray = event_option.event_option_values.split(',');
            valueArray = valueArray.map(string => {
              return string.trim();
            });
          }
          catch(err) {
            event_optionErrors.event_option_values = 'Invalid csv list';
            event_optionsArrayErrors[event_optionIndex] = event_optionErrors;
          }

          if(event_option.event_option_default_value && !valueArray.includes(event_option.event_option_default_value)) {
            event_optionErrors.event_option_default_value = 'Value is not in options list';
            event_optionsArrayErrors[event_optionIndex] = event_optionErrors;
          }
        }
      }
    });
    if(event_optionsArrayErrors.length) {
      errors.event_options = event_optionsArrayErrors;
    }
  }
  return errors;
}

const afterSubmit = (result, dispatch) =>
  dispatch(reset('createEventTemplate'));

const selector = formValueSelector('createEventTemplate');

function mapStateToProps(state) {

  return {
    errorMessage: state.event_template.event_template_error,
    message: state.event_template.event_template_message,
    roles: state.user.profile.roles,
    event_options: selector(state, 'event_options')
  };
}

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  reduxForm({
    form: 'createEventTemplate',
    enableReinitialize: true,
    validate: validate,
    onSubmitSuccess: afterSubmit
  })
)(CreateEventTemplate)