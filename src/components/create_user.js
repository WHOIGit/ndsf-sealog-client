import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { reduxForm, Field, reset } from 'redux-form';
import { Button, Form, Card } from 'react-bootstrap';
import { renderAlert, renderCheckboxGroup, renderMessage, renderSwitch, renderTextField } from './form_elements';
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

  renderSystemUserOption() {
    return (
      <Field
        name="system_user"
        label="System User"
        component={renderSwitch}
      />
    );
  }

  renderDisableUserOption() {
    return (
      <Field
        name="disabled"
        label="User Disabled"
        component={renderSwitch}
      />
    );
  }

  renderAdminOptions() {
    if(this.props.roles.includes('admin')) {
      return (
        <React.Fragment>
          <Form.Row>
            {this.renderSystemUserOption()}
          </Form.Row>
          <Form.Row>
          {this.renderDisableUserOption()}
          </Form.Row>
        </React.Fragment>
      );
    }
  }

  render() {

    const { handleSubmit, pristine, reset, submitting, valid } = this.props;
    const createUserFormHeader = (<div>Create New User</div>);

    if (this.props.roles && (this.props.roles.includes("admin") || this.props.roles.includes('event_manager'))) {

      let userRoleOptions = this.props.roles.includes('admin')? systemUserRoleOptions.concat(standardUserRoleOptions): standardUserRoleOptions;

      return (
        <Card className="border-secondary">
          <Card.Header>{createUserFormHeader}</Card.Header>
          <Card.Body>
            <Form onSubmit={ handleSubmit(this.handleFormSubmit.bind(this)) }>
              <Form.Row>
                <Field
                  name="username"
                  component={renderTextField}
                  label="Username"
                  required={true}
                  lg={12}
                  sm={12}
                />
                <Field
                  name="fullname"
                  component={renderTextField}
                  label="Full Name"
                  required={true}
                  lg={12}
                  sm={12}
                />
                <Field
                  name="email"
                  component={renderTextField}
                  label="Email"
                  required={true}
                  lg={12}
                  sm={12}
                />
                <Field
                  name="password"
                  component={renderTextField}
                  type="password"
                  label="Password"
                  lg={12}
                  sm={12}
                />
                <Field
                  name="confirmPassword"
                  component={renderTextField}
                  type="password"
                  label="Confirm Password"
                  lg={12}
                  sm={12}
                />
                <Field
                  name="roles"
                  component={renderCheckboxGroup}
                  label="Roles"
                  options={userRoleOptions}
                  required={true}
                />
              </Form.Row>
              {this.renderAdminOptions()}
              {renderAlert(this.props.errorMessage)}
              {renderMessage(this.props.message)}
              <div className="float-right">
                <Button className="mr-1" variant="secondary" size="sm" disabled={pristine || submitting} onClick={reset}>Reset Values</Button>
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
  } else if (formProps.username.length > 32) {
    errors.username = 'Must be 32 characters or less';
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
  } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,5}$/i.test(formProps.email)) {
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