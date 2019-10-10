import React, { Component } from 'react';
import { compose } from 'redux';
import { reduxForm, Field, reset } from 'redux-form';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Row, Col, Form, Card, Button, Alert } from 'react-bootstrap';
import ReCAPTCHA from "react-google-recaptcha";
import * as mapDispatchToProps from '../../actions';
import { RECAPTCHA_SITE_KEY } from '../../client_config';

class ResetPassword extends Component {
 
  constructor (props) {
    super(props);

    this.state = { 
      reCaptcha: null
    };

    this.handleFormSubmit = this.handleFormSubmit.bind(this);
  }

  componentWillUnmount() {
    this.props.leaveLoginForm();
  }

  handleFormSubmit({ password }) {
    let reCaptcha = this.state.reCaptcha;
    let token = this.props.match.params.token;
    this.props.resetPassword({token, password, reCaptcha});
  }

  onCaptchaChange(token) {
    this.setState({reCaptcha: token});
  }

  renderTextField({ input, label, placeholder, type="text", required, meta: { touched, error } }) {
    let requiredField = (required)? <span className='text-danger'> *</span> : '';
    let placeholder_txt = (placeholder)? placeholder: label;

    const labelComponent = (label)? <Form.Label>{label}{requiredField}</Form.Label> : null;

    return (
      <Form.Group as={Col} lg="12">
        {labelComponent}
        <Form.Control type={type} {...input} placeholder={placeholder_txt} isInvalid={touched && error}/>
        <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
      </Form.Group>
    );
  }

  renderAlert() {

    if(this.props.errorMessage) {
      return (
        <Alert variant="danger">
          <strong>Opps!</strong> {this.props.errorMessage}
        </Alert>
      );
    } else if (this.props.successMessage) {
      return (
        <Alert variant="success">
          <strong>Sweet!</strong> {this.props.successMessage}
        </Alert>
      );
    }
  }
 
  renderForm() {

    if(!this.props.successMessage) {

      const loginCardHeader = (<h5 className="form-signin-heading">Reset Password</h5>);
      const { handleSubmit, submitting, valid } = this.props;

      const loginButton = ( RECAPTCHA_SITE_KEY === "")? <Button variant="primary" type="submit" block disabled={submitting || !valid}>Login</Button> : <Button variant="primary" type="submit" block disabled={submitting || !valid || !this.state.reCaptcha}>Login</Button>;
      const recaptcha = ( RECAPTCHA_SITE_KEY !== "")? (
        <span>
          <ReCAPTCHA
            sitekey={RECAPTCHA_SITE_KEY}
            theme="dark"
            size="normal"
            onChange={this.onCaptchaChange.bind(this)}
          />
          <br/>
        </span>
      ): null;

      return (
        <Card className="form-signin" >
          <Card.Body>
            {loginCardHeader}
            <Form onSubmit={ handleSubmit(this.handleFormSubmit.bind(this)) }>
              <Form.Group>
                <Field
                  name="password"
                  component={this.renderTextField}
                  type="password"
                  placeholder="Password"
                  required={true}
                />
              </Form.Group>
              <Form.Group>
                <Field
                  name="confirmPassword"
                  component={this.renderTextField}
                  type="password"
                  placeholder="Confirm Password"
                  required={true}
                />
              </Form.Group>
              {recaptcha}
              {this.renderAlert()}
              <div>
                {loginButton}
              </div>
            </Form>
            <br/>
            <div className="text-right">
              <Link to={ `/login` }>Go to Login {<FontAwesomeIcon icon="arrow-right"/>}</Link>
            </div>
          </Card.Body>
        </Card>
      );
    }
  }

  render() {
    return(
      <Row>
        <Col>
          {this.renderForm()}
        </Col>
      </Row>
    );
  }
}

const afterSubmit = (result, dispatch) => {
  dispatch(reset('resetPassword'));
};

const validate = values => {
  const errors = {};

  if (!values.password) {
    errors.password = "Required";
  } else if (values.password.length < 8) {
    errors.password = 'Password must be 8 characters or more';
  } else if (values.password.match(/[ ]/)) {
    errors.password = 'Password can not include whitespace';
  }

  if(values.password !== values.confirmPassword) {
    errors.confirmPassword = "Passwords must match";
  }

  return errors;
};

function mapStateToProps(state) {
  return {
    errorMessage: state.auth.error,
    successMessage: state.auth.message
  };
}

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  reduxForm({
    form: 'resetPassword',
    validate: validate,
    onSubmitSuccess: afterSubmit
  })
)(ResetPassword);
