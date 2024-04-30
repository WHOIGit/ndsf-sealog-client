import React, { Component } from 'react';
import { compose } from 'redux';
import { reduxForm, Field } from 'redux-form';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Form, Row, Col, Card, Button, Alert } from 'react-bootstrap';
import ReCAPTCHA from "react-google-recaptcha";
import * as mapDispatchToProps from '../../actions';
import { renderTextField } from '../form_elements';
import { RECAPTCHA_SITE_KEY } from '../../client_config';

class ForgotPassword extends Component {
 
  constructor (props) {
    super(props);

    this.recaptchaRef = React.createRef();

  }

  componentWillUnmount() {
    this.props.leaveLoginForm();
  }

  async handleFormSubmit({ email }) {
    let reCaptcha = ( RECAPTCHA_SITE_KEY !== "") ? await this.recaptchaRef.current.executeAsync() : null
    this.props.forgotPassword({email, reCaptcha});
  }

  renderSuccess() {

    if (this.props.successMessage) {

      return (
        <Card className="form-signin" >
          <Card.Body>
            <h5 className="form-signin-heading">Forgot Password</h5>
            <div className="alert alert-success">
              <strong>Success!</strong> {this.props.successMessage}
            </div>
            <div className="text-center">
              <hr className="border-secondary"/>
              <Link className="btn btn-outline-primary btn-block" to={ `/login` }>Back to Login</Link>
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
          <strong>Oops!</strong> {this.props.errorMessage}
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

      const { handleSubmit, submitting, valid } = this.props;

      const submitButton = <Button variant="primary" type="submit" block disabled={submitting || !valid}>Submit</Button>;
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
            <h5 className="form-signin-heading">Forgot Password</h5>
            <Form onSubmit={ handleSubmit(this.handleFormSubmit.bind(this)) }>
              <Form.Row>
                <Field
                  name="email"
                  component={renderTextField}
                  placeholder="Email Address"
                />
              </Form.Row>
              {recaptcha}
              {this.renderAlert()}
              {submitButton}
            </Form>
            <div className="text-center">
              <hr className="border-secondary"/>
              <Link className="btn btn-outline-primary btn-block" to={ `/login` }>Back to Login</Link>
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

const validate = (formProps) => {

  const errors = {};
  if (!formProps.email) {
    errors.email = 'Required';
  }

  return errors;
};

const mapStateToProps = (state) => {
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
