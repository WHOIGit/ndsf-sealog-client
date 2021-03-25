import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import Cookies from 'universal-cookie';
import { reduxForm, Field } from 'redux-form';
import { Alert, Button, Col, Form, Card, Row} from 'react-bootstrap';
import * as mapDispatchToProps from '../../actions';

const cookies = new Cookies();

class UserProfile extends Component {

  constructor (props) {
    super(props);

    this.state = {
      showToken: false,
    };
  }

  componentDidUpdate() {
  }

  componentWillUnmount() {
    this.props.leaveUpdateProfileForm();
  }

  handleFormSubmit(formProps) {
    this.props.updateProfile(formProps);
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

  showToken() {
    if(this.state.showToken) {
      return (
        <div>
          <p><strong className="text-danger">Warning: DO NOT SHARE THIS!!!</strong></p>
          <p>This token has <strong className="text-warning">FULL</strong> privledges to
          your account including access to you username and email.</p>
          <span style={{wordWrap: "break-word"}}>{cookies.get('token')}</span>
        </div>
      );      
    } else {
      return (
        <Button variant="warning" size="sm" block onClick={()=> {this.setState({showToken: true});setTimeout(()=>{this.setState({showToken: false});}, 10*1000);}}>Show API Token</Button>
      );
    }
  }


  renderAlert() {
    if (this.props.errorMessage) {
      return (
        <Alert variant="danger">
          <strong>Oops!</strong> {this.props.errorMessage}
        </Alert>
      );
    }
  }

  renderMessage() {
    if (this.props.message) {
      return (
        <Alert variant="success">
          <strong>Success!</strong> {this.props.message}
        </Alert>
      );
    }
  }

  render() {

    const { handleSubmit, pristine, reset, submitting, valid } = this.props;

    return (
      <div className="mb-2">
        <Row className="justify-content-center">
          <Col sm={8} md={6} lg={4}>
            <Card>
              <Card.Body>
                <Form className="mb-1" onSubmit={ handleSubmit(this.handleFormSubmit.bind(this)) }>
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
                      disabled={true}
                    />
                    <Field
                      name="password"
                      component={this.renderTextField}
                      type="password"
                      label="Password"
                    />
                    <Field
                      name="confirmPassword"
                      component={this.renderTextField}
                      type="password"
                      label="Confirm Password"
                    />
                  </Form.Row>
                  {this.renderAlert()}
                  {this.renderMessage()}
                  <div className="float-right">
                    <Button className="mr-1" variant="secondary" size="sm" disabled={pristine || submitting} onClick={reset}>Reset Values</Button>
                    <Button variant="primary" size="sm" type="submit" disabled={pristine || submitting || !valid}>Update</Button>
                  </div>
                </Form>
                <br/><hr className="border-secondary"/>
                {this.showToken()}
              </Card.Body>
            </Card>
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
    errors.username = 'Must be 15 characters or less';
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

  if(formProps.password !== formProps.confirmPassword) {
    errors.password = "Passwords must match";
  }

  return errors;

}

function mapStateToProps(state) {

  return {
    errorMessage: state.user.profile_error,
    message: state.user.profile_message,
    initialValues: state.user.profile,
    userID: state.user.profile.id
  };

}

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  reduxForm({
    form: 'user_profile',
    enableReinitialize: true,
    validate: validate
  })
)(UserProfile);