import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { reduxForm, Field, FieldArray, formValueSelector, reset } from 'redux-form';
import { Button, Card, Form } from 'react-bootstrap';
import { renderAlert, renderMessage, renderSelectField, renderSwitch, renderTextField } from './form_elements';
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

    if(typeof formProps.system_template === 'undefined'){
      formProps.system_template = false;
    }

    if(typeof formProps.disabled === 'undefined'){
      formProps.disabled = false;
    }

    if(formProps.template_categories) {
      formProps.template_categories = formProps.template_categories.split(',');
      formProps.template_categories = formProps.template_categories.map(string => {
        return string.trim();
      });
    }    

    this.props.createEventTemplate(formProps);
  }

  renderOptionOptions(prefix, index) {
    if(this.props.event_options[index].event_option_type === 'static text') {
      return (
        <div>
          <Field
            name={`${prefix}.event_option_default_value`}
            component={renderTextField}
            label="Value"
            required={true}
            lg={12}
            sm={12}
          />
        </div>
      );
    } else if(this.props.event_options[index].event_option_type === 'text') {
      return (
        <div>
          <Field
            name={`${prefix}.event_option_default_value`}
            component={renderTextField}
            label="Default Value"
            lg={12}
            sm={12}
          />
        </div>
      );
    } else if(this.props.event_options[index].event_option_type === 'dropdown') {
      return (
        <div>
          <Field
            name={`${prefix}.event_option_values`}
            component={renderTextField}
            label="Dropdown Options"
            required={true}
            lg={12}
            sm={12}
          />
          <Field
            name={`${prefix}.event_option_default_value`}
            component={renderTextField}
            label="Default Selection"
            placeholder="i.e. a value from the list of options"
            lg={12}
            sm={12}
          />
        </div>
      );
    } else if(this.props.event_options[index].event_option_type === 'checkboxes') {
      return (
        <div>
          <Field
            name={`${prefix}.event_option_values`}
            component={renderTextField}
            label="Checkbox Options"
            required={true}
            lg={12}
            sm={12}
          />
          <Field
            name={`${prefix}.event_option_default_value`}
            component={renderTextField}
            label="Default Selections"
            placeholder="i.e. a value from the list of options"
            lg={12}
            sm={12}
          />
        </div>
      );
    } else if(this.props.event_options[index].event_option_type === 'radio buttons') {
      return (
        <div>
          <Field
            name={`${prefix}.event_option_values`}
            component={renderTextField}
            label="Radio Button Options"
            required={true}
            lg={12}
            sm={12}
          />
          <Field
            name={`${prefix}.event_option_default_value`}
            component={renderTextField}
            label="Default Selection"
            placeholder="i.e. a value from the list of options"
            lg={12}
            sm={12}
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
      <div className="w-100">
        {fields.map((options, index) =>
          <React.Fragment key={`option_field_${index}`}>
            <hr className="border-secondary" />
            <span>
              <Form.Label>Option #{index + 1}</Form.Label>
              <FontAwesomeIcon className="text-danger float-right" icon='times' fixedWidth onClick={() => fields.remove(index)}/>
              {promote(index, fields)}
              {demote(index, fields)}
            </span>
            <div key={`option_${index}`}>
              <Field
                name={`${options}.event_option_name`}
                component={renderTextField}
                label="Name"
                required={true}
                lg={12}
                sm={12}
              />
              <Field
                name={`${options}.event_option_type`}
                component={renderSelectField}
                options={EventTemplateOptionTypes}
                label="Type"
                required={true}
                lg={12}
                sm={12}
              />
              { this.renderOptionOptions(options, index) }
              <Field
                name={`${options}.event_option_required`}
                component={renderSwitch}
                label="Required?"
                lg={12}
                sm={12}
              />
            </div>
          </React.Fragment>
        )}
        <hr className="border-secondary" />
        <div className="text-primary" onClick={() => fields.push({})}>
          <FontAwesomeIcon icon='plus' fixedWidth/> Add Option
        </div>
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
        component={renderSwitch}
        label="System Template"
        lg={12}
        sm={12}
      />
    );
  }

  renderDisableTemplateOption() {
    return (
      <Field
        name="disabled"
        label="Disable Template"
        component={renderSwitch}
        lg={12}
        sm={12}
      />
    );
  }

  render() {

    const { handleSubmit, pristine, reset, submitting, valid } = this.props;
    const formHeader = <div>Create Event Template</div>;


    if (this.props.roles && (this.props.roles.includes("admin") || this.props.roles.includes("template_manager"))) {
      return (
        <Card className="border-secondary">
          <Card.Header>{formHeader}</Card.Header>
          <Card.Body>
            <Form onSubmit={ handleSubmit(this.handleFormSubmit.bind(this)) }>
              <Form.Row>
                <Field
                  name="event_name"
                  component={renderTextField}
                  label="Button Name"
                  required={true}
                  lg={12}
                  sm={12}
                />
                <Field
                  name="event_value"
                  component={renderTextField}
                  label="Event Value"
                  required={true}
                  lg={12}
                  sm={12}
                />
                <Field
                  name="template_categories"
                  component={renderTextField}
                  label="Template Categories (comma delimited)"
                  placeholder="i.e. biology,geology"
                  lg={12}
                  sm={12}
                />
                <Field
                  name='event_free_text_required'
                  component={renderSwitch}
                  label={"Free text Required?"}
                  lg={12}
                  sm={12}
                />
                {this.renderAdminOptions()}
              </Form.Row>
              <FieldArray name="event_options" component={this.renderOptions}/>
              <br/>
              {renderAlert(this.props.errorMessage)}
              {renderMessage(this.props.message)}
              <div className="float-right">
                <Button className="mr-1" variant="secondary" size="sm" disabled={pristine || submitting} onClick={reset}>Reset Form</Button>
                <Button variant="primary" type="submit" size="sm" disabled={pristine || submitting || !valid}>Create</Button>
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
  } else if (formProps.event_name.length > 32) {
    errors.event_name = 'Must be 32 characters or less';
  }

  if (!formProps.event_value) {
    errors.event_value = 'Required';
  }

  if (typeof formProps.template_categories === 'string' && formProps.template_categories !== '' ) {
    try {
      formProps.template_categories.split(',');
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

          if (!event_option.event_option_values) {
            event_optionErrors.event_option_values = 'Required';
          }
          else {
            try {
              valueArray = event_option.event_option_values.split(',');
              valueArray = valueArray.map(string => {
                return string.trim();
              });
            }
            catch(err) {
              event_optionErrors.event_option_values = 'Invalid csv list';
            }
          }

          if(event_option.event_option_default_value && !valueArray.includes(event_option.event_option_default_value)) {
            event_optionErrors.event_option_default_value = 'Value is not in options list';
          }

          event_optionsArrayErrors[event_optionIndex] = event_optionErrors;

        } else if (event_option.event_option_type === 'checkboxes') {

          let valueArray = [];

          if (!event_option.event_option_values) {
            event_optionErrors.event_option_values = 'Required';
          }
          else {
            try {
              valueArray = event_option.event_option_values.split(',');
              valueArray = valueArray.map(string => {
                return string.trim();
              });
            }
            catch(err) {
              event_optionErrors.event_option_values = 'Invalid csv list';
            }
          }

          if(event_option.event_option_default_value && !valueArray.includes(event_option.event_option_default_value)) {
            event_optionErrors.event_option_default_value = 'Value is not in options list';
          }

          event_optionsArrayErrors[event_optionIndex] = event_optionErrors;
        } else if (event_option.event_option_type === 'radio buttons') {

          let valueArray = [];

          if (!event_option.event_option_values) {
            event_optionErrors.event_option_values = 'Required';
          }
          else {
            try {
              valueArray = event_option.event_option_values.split(',');
              valueArray = valueArray.map(string => {
                return string.trim();
              });
            }
            catch(err) {
              event_optionErrors.event_option_values = 'Invalid csv list';
            }
          }

          if(event_option.event_option_default_value && !valueArray.includes(event_option.event_option_default_value)) {
            event_optionErrors.event_option_default_value = 'Value is not in options list';
          }

          event_optionsArrayErrors[event_optionIndex] = event_optionErrors;
        }
      }
    });
    if(event_optionsArrayErrors.length) {
      errors.event_options = event_optionsArrayErrors;
    }
  }

  // console.log(errors);
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