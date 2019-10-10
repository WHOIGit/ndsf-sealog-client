import React, { Component } from 'react';
import { compose } from 'redux';
import { reduxForm, Field } from 'redux-form';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Form, Row, Col, Card, Button, Alert } from 'react-bootstrap';
import ReCAPTCHA from "react-google-recaptcha";
import * as mapDispatchToProps from '../../actions';
import { RECAPTCHA_SITE_KEY } from '../../client_config';

class ForgotPassword extends Component {
 
  constructor (props) {
    super(props);

    this.state = { 
      reCaptcha: null
    };
  }

  componentWillUnmount() {
    this.props.leaveLoginForm();
  }

  handleFormSubmit({ email }) {
    let reCaptcha = this.state.reCaptcha;
    this.props.forgotPassword({email, reCaptcha});
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

  renderSuccess() {

    if (this.props.successMessage) {
      const panelHeader = (<h4 className="form-signin-heading">Forgot Password</h4>);

      return (
        <Card className="form-signin" >
          <Card.Body>
            {panelHeader}
            <div className="alert alert-success">
              <strong>Success!</strong> {this.props.successMessage}
            </div>
            <div className="float-right">
              <Link to={ `/login` }>Proceed to Login {<FontAwesomeIcon icon="arrow-right"/>}</Link>
            </div>
          </Card.Body>
        </Card>
      );
    }
  }

  renderAlert(){

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

      const panelHeader = (<h5 className="form-signin-heading">Forgot Password</h5>);
      const { handleSubmit, submitting, valid } = this.props;

      const submitButton = (RECAPTCHA_SITE_KEY !== "")?  <Button variant="primary" type="submit" block disabled={submitting || !valid || !this.state.reCaptcha}>Submit</Button> : <Button variant="primary" type="submit" block disabled={submitting || !valid}>Submit</Button>;
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
            {panelHeader}
            <Form onSubmit={ handleSubmit(this.handleFormSubmit.bind(this)) }>
              <Form.Group>
                <Field
                  name="email"
                  component={this.renderTextField}
                  placeholder="Email Address"
                />
              </Form.Group>
              {recaptcha}
              {this.renderAlert()}
              {submitButton}
            </Form>
            <br/>
            <div className="float-right">
              <Link to={ `/login` }>Back to Login {<FontAwesomeIcon icon="arrow-right"/>}</Link>
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
          {this.renderSuccess()}
          {this.renderForm()}
        </Col>
      </Row>
    );
  }
}

const validate = values => {

  // console.log(values)
  const errors = {};
  if (!values.email) {
    errors.email = 'Required';
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
    form: 'forgotPassword',
    validate: validate,
  })
)(ForgotPassword)
