import React, { Component } from 'react';
import { compose } from 'redux';
import { reduxForm, Field } from 'redux-form';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Alert, Row, Col, Container, Form, Card, Button, Image } from 'react-bootstrap';
import { renderAlert, renderTextField } from '../form_elements';
import ReCAPTCHA from "react-google-recaptcha";
import * as mapDispatchToProps from '../../actions';
import { ROOT_PATH, LOGIN_SCREEN_TXT, LOGIN_IMAGE, RECAPTCHA_SITE_KEY } from '../../client_config';

class Login extends Component {
 
  constructor (props) {
    super(props);

    this.state = {
      reCaptcha: null,
      stdUsers: true
    };
  }

  componentWillUnmount() {
    this.props.leaveLoginForm();
  }

  onCaptchaChange(token) {
    this.setState({reCaptcha: token});
  }

  handleFormSubmit({ username, password }) {
    username = username.toLowerCase();
    let reCaptcha = this.state.reCaptcha;
    this.props.login({username, password, reCaptcha});
  }

  renderMessage(errorMsg, msg){
    if(errorMsg) {
      return (
        <Alert variant="danger">
          <strong>Opps!</strong> {errorMsg}
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
 
  render() {
    const { handleSubmit, submitting, valid } = this.props;
    const loginCardHeader = (<h5 className="form-signin-heading">Please Sign In</h5>);

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

    const loginButton = ( RECAPTCHA_SITE_KEY === "")? <Button variant="primary" type="submit" block disabled={submitting || !valid}>Login</Button> : <Button variant="primary" type="submit" block disabled={submitting || !valid || !this.state.reCaptcha}>Login</Button>;
    const loginAsGuestButton = ( RECAPTCHA_SITE_KEY === "")? <Button variant="success" onClick={() => this.props.switch2Guest()} block>Login as Guest</Button> : <Button variant="success" onClick={() => this.props.switch2Guest(this.state.reCaptcha)} block disabled={!this.state.reCaptcha}>Login as Guest</Button>;

    const loginImage = ( LOGIN_IMAGE !== "" )? 
    <div className="d-flex justify-content-center" style={{marginBottom: "16px"}}>
      <Image style={{width:"250px", margin: "0 auto"}} fluid src={`${ROOT_PATH}images/${LOGIN_IMAGE}`} />
    </div> : null


    return (
      <Container>
        <Row>
          <Col sm={12} md={6} lg={{span:5, offset:1}}>
            <Card className="form-signin">
              <Card.Body>
                {loginCardHeader}
                <Form onSubmit={ handleSubmit(this.handleFormSubmit.bind(this)) }>
                  <Form.Group>
                    <Field
                      name="username"
                      component={renderTextField}
                      placeholder="Username"
                      lg={12}
                      sm={12}
                    />
                    <Field
                      name="password"
                      component={renderTextField}
                      type="password"
                      placeholder="Password"
                      lg={12}
                      sm={12}
                    />
                  </Form.Group>
                  {recaptcha}
                  {this.renderMessage(this.props.errorMessage, this.props.message)}
                  {loginButton}
                  {loginAsGuestButton}
                </Form>
                <br/>
                <div>
                  <span>
                    <Link to={ `/forgotPassword` }>{<FontAwesomeIcon icon="arrow-left"/>} Forgot Password?</Link>
                  </span>
                  <span className="float-right">
                    <Link to={ `/register` }>Register New User {<FontAwesomeIcon icon="arrow-right"/>}</Link>
                  </span>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6} lg={5}>
            <div className="form-signin">
              { loginImage }
              <div style={{padding: "0px 16px 0px 16px"}}>{LOGIN_SCREEN_TXT}</div>
            </div>
          </Col>
        </Row>
      </Container>
    );
  }
}

const validate = values => {

  const errors = {};
  if (!values.username) {
    errors.username = 'Required';
  }

  if (!values.password) {
    errors.password = 'Required';
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
    form: 'login',
    validate: validate,
  })
)(Login);
