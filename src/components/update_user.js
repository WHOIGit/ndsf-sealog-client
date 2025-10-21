import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { reduxForm, Field } from 'redux-form';
import { Button, Card, Form, } from 'react-bootstrap';
import { renderAlert, renderCheckboxGroup, renderMessage, renderSwitch, renderTextField } from './form_elements';
import * as mapDispatchToProps from '../actions';
import { standardUserRoleOptions } from '../standard_user_role_options';
import { systemUserRoleOptions } from '../system_user_role_options';

class UpdateUser extends Component {

  componentDidMount() {
    if(this.props.userID) {
      this.props.initUser(this.props.userID);
    }
  }

  componentWillUnmount() {
    this.props.leaveUpdateUserForm();
  }

  handleFormSubmit(formProps) {
    this.props.updateUser(formProps);
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
    if(this.props.profile.id !== this.props.user.id) {
      return (
        <Field
          name="disabled"
          label="User Disabled"
          component={renderSwitch}
        />
      );
    }
  }

  render() {

    const { handleSubmit, pristine, reset, submitting, valid } = this.props;
    const updateUserFormHeader = (<div>Update User</div>);


    if (this.props.roles.includes("admin") || this.props.roles.includes('event_manager')) {

      let userRoleOptions = this.props.roles.includes('admin')? systemUserRoleOptions.concat(standardUserRoleOptions): standardUserRoleOptions;

      return (
        <Card className="border-secondary">
          <Card.Header>{updateUserFormHeader}</Card.Header>
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
                  disabled={true}
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
                  lg={12}
                  sm={12}
                />
              </Form.Row>
              {this.renderAdminOptions()}
              {renderAlert(this.props.errorMessage)}
              {renderMessage(this.props.message)}
              <div className="float-right">
                <Button className="mr-1" variant="secondary" size="sm" disabled={pristine || submitting} onClick={reset}>Reset Values</Button>
                <Button variant="primary" size="sm" type="submit" disabled={submitting || !valid || pristine}>Update</Button>
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

function mapStateToProps(state) {
  return {
    errorMessage: state.user.user_error,
    message: state.user.user_message,
    initialValues: state.user.user,
    user: state.user.user,
    roles: state.user.profile.roles,
    profile: state.user.profile
  };
}

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  reduxForm({
    form: 'editUser',
    enableReinitialize: true,
    validate: validate
  })
)(UpdateUser);