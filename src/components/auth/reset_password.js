import React, { Component } from 'react'
import { compose } from 'redux'
import { reduxForm, Field, reset } from 'redux-form'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { Row, Col, Form, Card, Button, Alert } from 'react-bootstrap'
import ReCAPTCHA from 'react-google-recaptcha'
import PropTypes from 'prop-types'
import { RECAPTCHA_SITE_KEY } from '../../client_settings'
import { renderTextField } from '../form_elements'
import * as mapDispatchToProps from '../../actions'

class ResetPassword extends Component {
  constructor(props) {
    super(props)

    this.handleFormSubmit = this.handleFormSubmit.bind(this)
    this.recaptchaRef = React.createRef()
  }

  componentWillUnmount() {
    this.props.leaveLoginForm()
  }

  async handleFormSubmit({ password }) {
    let reCaptcha = RECAPTCHA_SITE_KEY ? await this.recaptchaRef.current.executeAsync() : null
    let token = this.props.match.params.token
    this.props.resetPassword({ token, password, reCaptcha })
  }

  renderSuccess() {
    if (this.props.successMessage) {
      return (
        <Card className='form-signin'>
          <Card.Body>
            <h5 className='form-signin-heading'>Forgot Password</h5>
            <div className='alert alert-success'>
              <strong>Success!</strong> {this.props.successMessage}
            </div>
            <div className='text-center'>
              <hr className='border-secondary' />
              <Link className='btn btn-outline-primary btn-block' to={`/login`}>
                Back to Login
              </Link>
            </div>
          </Card.Body>
        </Card>
      )
    }
  }

  renderAlert() {
    if (this.props.errorMessage) {
      return (
        <Alert variant='danger'>
          <strong>Oops!</strong> {this.props.errorMessage}
        </Alert>
      )
    } else if (this.props.successMessage) {
      return (
        <Alert variant='success'>
          <strong>Sweet!</strong> {this.props.successMessage}
        </Alert>
      )
    }
  }
  renderForm() {
    if (!this.props.successMessage) {
      const { handleSubmit, submitting, valid } = this.props

      const submitButton = RECAPTCHA_SITE_KEY ? (
        <Button variant='primary' type='submit' block disabled={submitting || !valid || !this.state.reCaptcha}>
          Submit
        </Button>
      ) : (
        <Button variant='primary' type='submit' block disabled={submitting || !valid}>
          Submit
        </Button>
      )
      const recaptcha = RECAPTCHA_SITE_KEY ? (
        <span>
          <ReCAPTCHA ref={this.recaptchaRef} sitekey={RECAPTCHA_SITE_KEY} size='invisible' />
          <br />
        </span>
      ) : null

      return (
        <Card className='form-signin'>
          <Card.Body>
            <h5 className='form-signin-heading'>Reset Password</h5>
            <Form onSubmit={handleSubmit(this.handleFormSubmit.bind(this))}>
              <Form.Row>
                <Field name='password' component={renderTextField} type='password' placeholder='Password' required={true} />
              </Form.Row>
              <Form.Row>
                <Field name='confirmPassword' component={renderTextField} type='password' placeholder='Confirm Password' required={true} />
              </Form.Row>
              {recaptcha}
              {this.renderAlert()}
              <div>{submitButton}</div>
            </Form>
            <div className='text-center'>
              <hr className='border-secondary' />
              <Link className='btn btn-outline-primary btn-block' to={`/login`}>
                Back to Login
              </Link>
            </div>
          </Card.Body>
        </Card>
      )
    }
  }

  render() {
    return (
      <div className='mb-2'>
        <Row className='justify-content-center'>
          <Col sm={6} md={5} lg={4} xl={3}>
            {this.renderSuccess()}
            {this.renderForm()}
          </Col>
        </Row>
      </div>
    )
  }
}

ResetPassword.propTypes = {
  errorMessage: PropTypes.string.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  leaveLoginForm: PropTypes.func.isRequired,
  match: PropTypes.object.isRequired,
  resetPassword: PropTypes.func.isRequired,
  submitting: PropTypes.bool.isRequired,
  successMessage: PropTypes.string.isRequired,
  valid: PropTypes.bool.isRequired
}

const afterSubmit = (result, dispatch) => {
  dispatch(reset('resetPassword'))
}

const validate = (values) => {
  const errors = {}

  if (!values.password) {
    errors.password = 'Required'
  } else if (values.password.length < 8) {
    errors.password = 'Password must be 8 characters or more'
  } else if (values.password.match(/[ ]/)) {
    errors.password = 'Password can not include whitespace'
  }

  if (values.password !== values.confirmPassword) {
    errors.confirmPassword = 'Passwords must match'
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
    form: 'resetPassword',
    validate: validate,
    onSubmitSuccess: afterSubmit
  })
)(ResetPassword)
