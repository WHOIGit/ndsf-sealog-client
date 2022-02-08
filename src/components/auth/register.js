import React, { Component } from 'react';
import { compose } from 'redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { connect } from 'react-redux';
import { reduxForm, Field } from 'redux-form';
import { Link } from 'react-router-dom';
import { Row, Col, Card, Form, Button } from 'react-bootstrap';
import ReCAPTCHA from "react-google-recaptcha";
import { RECAPTCHA_SITE_KEY } from 'client_config';
import * as mapDispatchToProps from '../../actions';

class Register extends Component {

  constructor (props) {
    super(props);

    this.recaptchaRef = React.createRef();

  }

  componentWillUnmount() {
    this.props.leaveRegisterForm();
  }

  async handleFormSubmit({username, fullname, email, password}) {
    let reCaptcha = ( RECAPTCHA_SITE_KEY !== "") ? await this.recaptchaRef.current.executeAsync() : null
    username = username.toLowerCase();
    this.props.registerUser({username, fullname, email, password, reCaptcha});
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


  renderSuccess() {
    if (this.props.message) {
      const panelHeader = (<h4>New User Registration</h4>);

      return (
        <Card className="form-signin" >
          <Card.Body>
            {panelHeader}
            <div className="alert alert-success">
              <strong>Success!</strong> {this.props.message}
            </div>
            <div className="float-right">
              <Link to="/login">Proceed to Login <FontAwesomeIcon icon="arrow-right"/></Link>
            </div>
          </Card.Body>
        </Card>
      );
    }
  }

  renderAlert() {
    if (this.props.errorMessage) {
      return (
        <div className="alert alert-danger">
          <strong>Oops!</strong> {this.props.errorMessage}
        </div>
      );
    }
  }

  renderForm() {

    if (!this.props.message) {

      const panelHeader = (<h5 className="form-signin-heading">User Registration</h5>);
      const { handleSubmit, submitting, valid } = this.props;
      //console.log(this.props);
      const recaptcha = ( RECAPTCHA_SITE_KEY !== "")? (
        <span>
          <ReCAPTCHA
            ref={this.recaptchaRef}
            sitekey={RECAPTCHA_SITE_KEY}
            theme="dark"
            size="invisible"
          />
          <br/>
        </span>
      ): null;

      return (
        <Card className="form-signin" >
          <Card.Body>
            {panelHeader}
            <Form onSubmit={ handleSubmit(this.handleFormSubmit.bind(this)) }>
              <Form.Row>
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
                  required={true}
                />
                <Field
                  name="confirmPassword"
                  component={this.renderTextField}
                  type="password"
                  label="Confirm Password"
                  required={true}
                />
              </Form.Row>
              {recaptcha}
              {this.renderAlert()}
              <Button variant="primary" block type="submit" disabled={submitting || !valid}>Register</Button>
            </Form>
            <div>
              <hr className="border-secondary"/>
              <Link className="btn btn-outline-primary btn-block" to="/login">Back to Login</Link>
            </div>
          </Card.Body>
        </Card>
      );
    }
  }

  render() {

    return(
      <div className="mb-2">
        <Row className="justify-content-center">
          <Col sm={6} md={5} lg={4} xl={3}>
            {this.renderSuccess()}
            {this.renderForm()}
          </Col>
        </Row>
      </div>
    );
  }
}

function validate(formProps) {
  const errors = {};

  if (!formProps.username) {
    errors.username = 'Required';
  } else if (formProps.username.length > 15) {
    errors.username = 'Username must be 15 characters or less';
  } else if (formProps.username.match(/[ ]/)) {
    errors.username = 'Username can not include whitespace';
  } else if (formProps.username.match(/[A-Z]/)) {
    errors.username = 'Username can NOT include uppercase letters';
  }

  if (!formProps.fullname) {
    errors.fullname = 'Required';
  }

  if (!formProps.email) {
    errors.email = 'Required';
  } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(formProps.email)) {
    errors.email = 'Invalid email address';
  }

  if (!formProps.password) {
    errors.password = "Required";
  } else if (formProps.password.length < 8) {
    errors.password = 'Password must be 8 characters or more';
  } else if (formProps.password.match(/[ ]/)) {
    errors.password = 'Password can not include whitespace';
  }

  if(formProps.password !== formProps.confirmPassword) {
    errors.confirmPassword = "Passwords must match";
  }

  return errors;
}

let recaptchaInstance = null;

const afterSubmit = () => {
  if (recaptchaInstance) {
    recaptchaInstance.reset();
  }
};

function mapStateToProps(state) {
  return {
    errorMessage: state.user.register_error,
    message: state.user.register_message
  };
}

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  reduxForm({
    form: 'register',
    validate: validate,
    onSubmitSuccess: afterSubmit
  })
)(Register);