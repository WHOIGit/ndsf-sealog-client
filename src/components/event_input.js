import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { reduxForm, Field, reset } from 'redux-form';
import { Button, Form, InputGroup } from 'react-bootstrap';
import * as mapDispatchToProps from '../actions';

class EventInput extends Component {

  constructor (props) {
    super(props);
  }

  handleFormSubmit({eventFreeText}) {
    this.props.createEvent('FREE_FORM', eventFreeText);
  }

  render() {
    const { handleSubmit, submitting, pristine } = this.props;

    return (
      <Form className={this.props.className} onSubmit={ handleSubmit(this.handleFormSubmit.bind(this)) }>
        <InputGroup>
          <Field
            name="eventFreeText"
            component="input"
            type="text"
            placeholder="Type new event"
            className="form-control"
          />
          <InputGroup.Append>
            <Button block type="submit" disabled={submitting || pristine}>Submit</Button>
          </InputGroup.Append>
        </InputGroup>
      </Form>
    );
  }
}

function mapStateToProps() {
  return {};
}

function afterSubmit(result, dispatch) {
  dispatch(reset('eventInput'));
}

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  reduxForm({
    form: 'eventInput',
    onSubmitSuccess: afterSubmit
  })
)(EventInput);
