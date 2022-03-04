import React, { Component } from 'react';
import { compose } from 'redux';
import { reduxForm, Field, reset } from 'redux-form';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Row, Col, Form, Card, Button, Alert } from 'react-bootstrap';
import { renderTextField } from '../form_elements';
import ReCAPTCHA from "react-google-recaptcha";
import * as mapDispatchToProps from '../../actions';
import { RECAPTCHA_SITE_KEY } from '../../client_config';

class ResetPassword extends Component {
 
  constructor (props) {
    super(props);

    this.handleFormSubmit = this.handleFormSubmit.bind(this);
    this.recaptchaRef = React.createRef();

  }

  componentWillUnmount() {
    this.props.leaveLoginForm();
  }

  async handleFormSubmit({ password }) {
    let reCaptcha = ( RECAPTCHA_SITE_KEY !== "") ? await this.recaptchaRef.current.executeAsync() : null
    let token = this.props.match.params.token;
    this.props.resetPassword({token, password, reCaptcha});
  }

  renderMessage(errorMsg, msg){
    if(errorMsg) {
      return (
        <Alert variant="danger">
          <strong>Oops!</strong> {errorMsg}
        </Alert>
      );
    } else if (msg) {
      return (
        <Alert variant="success">
          {msg}
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
            {loginCardHeader}
            <Form onSubmit={ handleSubmit(this.handleFormSubmit.bind(this)) }>
              <Form.Group>
                <Field
                  name="password"
                  component={renderTextField}
                  type="password"
                  placeholder="Password"
                  required={true}
                />
              </Form.Group>
              <Form.Group>
                <Field
                  name="confirmPassword"
                  component={renderTextField}
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

    const { handleSubmit, submitting, valid } = this.props;
    const loginCardHeader = (<h5 className="form-signin-heading">Reset Password</h5>);

    const submitButton = ( RECAPTCHA_SITE_KEY === "")? <Button variant="primary" type="submit" block disabled={submitting || !valid}>Submit</Button> : <Button variant="primary" type="submit" block disabled={submitting || !valid || !this.state.reCaptcha}>Submit</Button>;
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

    return(
      <div className="mb-2">
        <Row className="justify-content-center">
          <Col sm={6} md={4} lg={3}>
            <Card>
              <Card.Body>
                {loginCardHeader}
                <Form onSubmit={ handleSubmit(this.handleFormSubmit.bind(this)) }>
                  <Form.Row>
                    <Field
                      name="password"
                      component={renderTextField}
                      type="password"
                      placeholder="Password"
                      required={true}
                      lg={12}
                      sm={12}
                    />
                    <Field
                      name="confirmPassword"
                      component={renderTextField}
                      type="password"
                      placeholder="Confirm Password"
                      required={true}
                      lg={12}
                      sm={12}
                    />
                  </Form.Row>
                  {recaptcha}
                  {this.renderMessage(this.props.errorMessage, this.props.message)}
                  {submitButton}
                </Form>
                <div className="text-center">
                  <hr className="border-secondary"/>
                  <Link className="btn btn-outline-primary btn-block" to={ `/login` }>Back to Login</Link>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    )
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
