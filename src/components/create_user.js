import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { reduxForm, Field, reset } from 'redux-form';
import { Alert, Button, Col, Form, Card, Tooltip, OverlayTrigger } from 'react-bootstrap';
import * as mapDispatchToProps from '../actions';
import { standardUserRoleOptions } from '../standard_user_role_options';
import { systemUserRoleOptions } from '../system_user_role_options';

class CreateUser extends Component {

  constructor (props) {
    super(props);
  }

  componentWillUnmount() {
    this.props.leaveCreateUserForm();
  }

  handleFormSubmit(formProps) {
    this.props.createUser(formProps);
  }

  renderTextField({ input, label, placeholder, type="text", required, meta: { touched, error } }) {
    let requiredField = (required)? <span className='text-danger'> *</span> : '';
    let placeholder_txt = (placeholder)? placeholder: label;

    return (
      <Form.Group as={Col} lg="12">
        <Form.Label>{label}{requiredField}</Form.Label>
        <Form.Control type={type} {...input} placeholder={placeholder_txt} isInvalid={touched && error}/>
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
      <Form.Group as={Col} lg="12">
        <Form.Label>{label}{requiredField}</Form.Label>
        <Form.Control as="select" {...input} placeholder={placeholder_txt} isInvalid={touched && error}>
          { defaultOption }
          { optionList }
        </Form.Control>
        <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
      </Form.Group>
    );
  }

  renderCheckboxGroup({ label, options, input, required, meta: { dirty, error } }) {

    let requiredField = (required)? (<span className='text-danger'> *</span>) : '';
    let checkboxList = options.map((option, index) => {

      let tooltip = (option.description)? (<Tooltip id={`${option.value}_Tooltip`}>{option.description}</Tooltip>) : null;

      return (
        <OverlayTrigger key={`${label}.${index}`} placement="top" overlay={tooltip}>
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
        </OverlayTrigger>
      );
    });

    return (
      <span>
        <Form.Label>{label}{requiredField}</Form.Label><br/>
        <Form.Group as={Col} xs="4">
          {checkboxList}
        </Form.Group>
        <Form.Group as={Col} xs="12">
          {dirty && (error && <div className="text-danger" style={{marginTop: "-16px", fontSize: "80%"}}>{error}</div>)}
        </Form.Group>
      </span>
    );
  }

  renderCheckbox({ input, label, meta: { dirty, error } }) {    
    return (
      <Form.Group as={Col} lg="12">
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

  renderSystemUserOption() {
    return (
      <Field
        name="system_user"
        label="System User"
        component={this.renderSwitch}
      />
    );
  }

  renderDisableUserOption() {
    return (
      <Field
        name="disabled"
        label="User Disabled"
        component={this.renderSwitch}
      />
    );
  }

  renderAdminOptions() {
    if(this.props.roles.includes('admin')) {
      return (
        <div>
          {this.renderSystemUserOption()}
          {this.renderDisableUserOption()}
        </div>
      );
    }
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
    const createUserFormHeader = (<div>Create New User</div>);

    if (this.props.roles && (this.props.roles.includes("admin") || this.props.roles.includes('event_manager'))) {

      let userRoleOptions = this.props.roles.includes('admin')? systemUserRoleOptions.concat(standardUserRoleOptions): standardUserRoleOptions;

      return (
        <Card className="form-standard">
          <Card.Header>
            {createUserFormHeader}
          </Card.Header>
          <Card.Body>
            <Form onSubmit={ handleSubmit(this.handleFormSubmit.bind(this)) }>
              <Field
                name="username"
                component={this.renderTextField}
                label="Username"
                required={true}
              />
              <Field
                name="fullname"
                component={this.renderTextField}
                label="Full Name"
                required={true}
              />
              <Field
                name="email"
                component={this.renderTextField}
                label="Email"
                required={true}
              />
              <Field
                name="password"
                component={this.renderTextField}
                type="password"
                label="Password"
              />
              <Field
                name="confirmPassword"
                component={this.renderTextField}
                type="password"
                label="Confirm Password"
              />
              <Field
                name="roles"
                component={this.renderCheckboxGroup}
                label="Roles"
                options={userRoleOptions}
                required={true}
              />
              {this.renderAdminOptions()}
              {this.renderAlert()}
              {this.renderMessage()}
              <div className="float-right" style={{marginRight: "-20px", marginBottom: "-8px"}}>
                <Button variant="secondary" size="sm" disabled={pristine || submitting} onClick={reset}>Reset Values</Button>
                <Button variant="primary" size="sm" type="submit" disabled={submitting || !valid}>Create</Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      );
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

  if (!formProps.username) {
    errors.username = 'Required';
  } else if (formProps.username.length > 15) {
    errors.username = 'Must be 15 characters or less';
  } else if (formProps.username.match(/[A-Z]/)) {
    errors.username = 'Username must be all lowercase';
  } else if (formProps.username.match(/[ ]/)) {
    errors.username = 'Username can not include whitespace';
  }

  if (!formProps.fullname) {
    errors.fullname = 'Required';
  }

  if (!formProps.email) {
    errors.email = 'Required';
  } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(formProps.email)) {
    errors.email = 'Invalid email address';
  }

  if(formProps.password !== formProps.confirmPassword) {
    errors.password = "Passwords must match";
  }

  if(!formProps.roles || formProps.roles.length === 0) {
    errors.roles = "Must select at least one role";
  }

  return errors;

}

const afterSubmit = (result, dispatch) =>
  dispatch(reset('createUser'));

function mapStateToProps(state) {

  return {
    errorMessage: state.user.user_error,
    message: state.user.user_message,
    roles: state.user.profile.roles
  };

}

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  reduxForm({
    form: 'createUser',
    enableReinitialize: true,
    validate: validate,
    onSubmitSuccess: afterSubmit
  })
)(CreateUser)