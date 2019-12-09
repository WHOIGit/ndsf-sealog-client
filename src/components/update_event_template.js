import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { reduxForm, Field, FieldArray, formValueSelector } from 'redux-form';
import { Alert, Button, Form, Card } from 'react-bootstrap';
import * as mapDispatchToProps from '../actions';
import { EventTemplateOptionTypes } from '../event_template_option_types';

class UpdateEventTemplate extends Component {

  constructor (props) {
    super(props);

    this.renderOptions = this.renderOptions.bind(this);
    this.renderOptionOptions = this.renderOptionOptions.bind(this);
  }

  componentDidMount() {
    //console.log(this.props.match);
    if(this.props.eventTemplateID) {
      this.props.initEventTemplate(this.props.eventTemplateID);
    }
  }

  componentWillUnmount() {
    this.props.leaveUpdateEventTemplateForm();
  }

  handleFormSubmit(formProps) {
    if(typeof formProps.system_template === 'undefined') {
      formProps.system_template = false;
    }

    if(typeof(formProps.template_disabled) === 'undefined') {
      formProps.template_disabled = false;
    }

    if(formProps.template_categories && typeof formProps.template_categories !== 'object') {
      formProps.template_categories = formProps.template_categories.split(',');
      formProps.template_categories = formProps.template_categories.map(string => {
        return string.trim();
      });
    }    

    // console.log("formProps:", formProps);
    this.props.updateEventTemplate(formProps);
    this.props.fetchEventTemplates();
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

  renderTextarea({ input, label, placeholder, rows, required, meta: { touched, error } }) {
    let requiredField = (required)? <span className='text-danger'> *</span> : '';
    let placeholder_txt = (placeholder)? placeholder: label;

    return (
      <Form.Group>
        <Form.Label>{label}{requiredField}</Form.Label>
        <Form.Control as="textarea" {...input} placeholder={placeholder_txt} rows={rows} isInvalid={touched && error}/>
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

  renderSwitch({ input, label, meta: { dirty, error } }) {    

    return (
      <Form.Group>
        <Form.Switch
          {...input}
          id={input.name}
          checked={input.value ? true : false}
          onChange={(e) => input.onChange(e.target.checked)}
          isInvalid={dirty && error}
          label={label}
        >
        </Form.Switch>
        <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
      </Form.Group>
    );
  }

  renderOptionOptions(prefix, index) {

    if(this.props.event_options && this.props.event_options.length > 0) {
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
              component={this.renderTextarea}
              label="Dropdown Options"
              rows={2}
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
              component={this.renderTextarea}
              label="Checkbox Options"
              rows={2}
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
              <FontAwesomeIcon className="text-danger float-right" icon='times' fixedWidth onClick={() => fields.remove(index)}/>
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
              component={this.renderSwitch}
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
          {this.renderDisableTemplateOption()}
        </div>
      );
    }
  }

  renderSystemEventTemplateOption() {
    return (
      <Field
        name='system_template'
        component={this.renderSwitch}
        label="System Template"
      />
    );
  }

  renderDisableTemplateOption() {
    return (
      <Field
        name="template_disabled"
        label="Disable Template"
        component={this.renderSwitch}
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
    const formHeader = (<div>Update Event Template</div>);

    if (this.props.roles && (this.props.roles.includes("admin") || this.props.roles.includes("template_manager"))) {
      return (
        <Card className="form-standard">
          <Card.Header>{formHeader}</Card.Header>
          <Card.Body>
            <Form onSubmit={ handleSubmit(this.handleFormSubmit.bind(this)) }>
              <Field
                name="event_name"
                component={this.renderTextField}
                label="Button Name"
                required={true}
              />
              <Field
                name="event_value"
                component={this.renderTextField}
                label="Event Value"
                required={true}
              />
              <Field
                name={"template_categories"}
                component={this.renderTextField}
                label="Template Categories (comma delimited)"
                placeholder="i.e. biology,geology"
              />
              <Field
                name='event_free_text_required'
                id='event_free_text_required'
                component={this.renderSwitch}
                label={"Free text Required?"}
              />
              {this.renderAdminOptions()}
              <FieldArray name="event_options" component={this.renderOptions}/>
              {this.renderAlert()}
              {this.renderMessage()}
              <div className="float-right" style={{marginRight: "-20px", marginBottom: "-8px"}}>
                <Button variant="secondary" size="sm" disabled={pristine || submitting} onClick={reset}>Reset Form</Button>
                <Button variant="primary" size="sm" type="submit" disabled={pristine || submitting || !valid}>Update</Button>
              </div>
            </Form>
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

  if (!formProps.template_categories) {
    try {
      const valueArray = formProps.template_categories.split(',');
    }
    catch(err) {
      errors.template_categories = 'Invalid csv list';
    }
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
        }
      }
    });
    if(event_optionsArrayErrors.length) {
      errors.event_options = event_optionsArrayErrors;
    }
  }

  // console.log(errors)

  return errors;

}


function mapStateToProps(state) {

  return {
    errorMessage: state.event_template.event_template_error,
    message: state.event_template.event_template_message,
    initialValues: state.event_template.event_template,
    roles: state.user.profile.roles,
    event_options: selector(state, 'event_options')
  };

}

const selector = formValueSelector('editEventTemplate');

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  reduxForm({
    form: 'editEventTemplate',
    enableReinitialize: true,
    validate: validate
  })
)(UpdateEventTemplate);