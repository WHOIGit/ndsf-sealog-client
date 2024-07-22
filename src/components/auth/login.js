import React, { Component } from 'react'
import { compose } from 'redux'
import { reduxForm, Field } from 'redux-form'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { Alert, Row, Col, Form, Card, Button, Image } from 'react-bootstrap'
import { renderTextField } from '../form_elements'
import ReCAPTCHA from 'react-google-recaptcha'
import PropTypes from 'prop-types'
import * as mapDispatchToProps from '../../actions'
import { ROOT_PATH, LOGIN_SCREEN_TXT, LOGIN_IMAGE, RECAPTCHA_SITE_KEY } from '../../client_settings'

class Login extends Component {
  constructor(props) {
    super(props)

    this.state = {
      stdUsers: true
    }

    this.recaptchaRef = React.createRef()

    this.handleIFrameAuth = this.handleIFrameAuth.bind(this)
  }

  componentDidMount() {
    window.addEventListener('message', this.handleIFrameAuth)
  }

  componentWillUnmount() {
    this.props.leaveLoginForm()
  }

  handleIFrameAuth(event) {
    if (event.data.event == 'login-with-token') {
      try {
        if ('loginToken' in event.data) {
          this.handleAutologin(event.data)
        }
      } catch (error) {
        console.debug(error)
      }
    }
  }

  async handleAutologin({ loginToken }) {
    let reCaptcha = RECAPTCHA_SITE_KEY ? await this.recaptchaRef.current.executeAsync() : null
    await this.props.autoLogin({ loginToken, reCaptcha })
  }

  async handleFormSubmit({ username, password }) {
    let reCaptcha = RECAPTCHA_SITE_KEY ? await this.recaptchaRef.current.executeAsync() : null
    username = username.toLowerCase()
    await this.props.login({ username, password, reCaptcha })
  }

  async switch2Guest() {
    let reCaptcha = RECAPTCHA_SITE_KEY ? await this.recaptchaRef.current.executeAsync() : null
    await this.props.switch2Guest(reCaptcha)
  }

  renderMessage(errorMsg, msg) {
    if (errorMsg) {
      return (
        <Alert variant='danger'>
          <strong>Oops!</strong> {errorMsg}
        </Alert>
      )
    } else if (msg) {
      return <Alert variant='success'>{msg}</Alert>
    }
  }

  render() {
    const { handleSubmit, submitting, valid } = this.props
    const loginCardHeader = <h5 className='form-signin-heading'>Please Sign In</h5>

    const recaptcha = RECAPTCHA_SITE_KEY ? (
      <span>
        <ReCAPTCHA ref={this.recaptchaRef} sitekey={RECAPTCHA_SITE_KEY} size='invisible' />
        <br />
      </span>
    ) : null

    const loginButton = (
      <Button variant='primary' type='submit' block disabled={submitting || !valid}>
        Login
      </Button>
    )
    const loginAsGuestButton = (
      <Button variant='success' onClick={() => this.switch2Guest()} block>
        Login as Guest
      </Button>
    )

    const loginImage = LOGIN_IMAGE ? (
      <div className='d-flex justify-content-center'>
        <Image style={{ width: '250px' }} fluid src={`${ROOT_PATH}images/${LOGIN_IMAGE}`} />
      </div>
    ) : null

    return (
      <div className='mb-2'>
        <Row className='justify-content-center'>
          <Col sm={6} md={4} lg={3}>
            <Card>
              <Card.Body>
                {loginCardHeader}
                <Form onSubmit={handleSubmit(this.handleFormSubmit.bind(this))}>
                  <Form.Row>
                    <Field name='username' component={renderTextField} placeholder='Username' />
                    <Field name='password' component={renderTextField} type='password' placeholder='Password' />
                  </Form.Row>
                  {recaptcha}
                  {this.renderMessage(this.props.errorMessage, this.props.message)}
                  {loginButton}
                  {loginAsGuestButton}
                </Form>
                <div className='text-center'>
                  <hr className='border-secondary' />
                  <Link className='btn btn-outline-primary btn-block' to={`/forgotPassword`}>
                    Forgot Password?
                  </Link>
                  <Link className='btn btn-outline-primary btn-block' to={`/register`}>
                    Register New User
                  </Link>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col className='justify-content-center d-none d-md-inline' md={5} lg={4} xl={3}>
            {loginImage}
            <p className='text-justify' style={{ whiteSpace: 'pre-wrap' }}>{LOGIN_SCREEN_TXT}</p>
          </Col>
        </Row>
      </div>
    )
  }
}

Login.propTypes = {
  autoLogin: PropTypes.func.isRequired,
  errorMessage: PropTypes.string.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  leaveLoginForm: PropTypes.func.isRequired,
  login: PropTypes.func.isRequired,
  message: PropTypes.string,
  submitting: PropTypes.bool.isRequired,
  switch2Guest: PropTypes.func.isRequired,
  valid: PropTypes.bool.isRequired
}

const validate = (formProps) => {
  const errors = {}
  if (!formProps.username) {
    errors.username = 'Required'
  }

  if (!formProps.password) {
    errors.password = 'Required'
  }

  return errors
}

const mapStateToProps = (state) => {
  return {
    errorMessage: state.auth.error,
    successMessage: state.auth.message
  }
}

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  reduxForm({
    form: 'login',
    validate: validate
  })
)(Login)
