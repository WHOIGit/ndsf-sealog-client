import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Button, Form, Modal } from 'react-bootstrap';
import { connectModal } from 'redux-modal';
import { reduxForm, Field } from 'redux-form';
import * as mapDispatchToProps from '../actions';

class EventCommentModal extends Component {

  constructor (props) {
    super(props);

    this.handleFormSubmit = this.handleFormSubmit.bind(this);
  }

  static propTypes = {
    event: PropTypes.object.isRequired,
    handleHide: PropTypes.func.isRequired,
    handleUpdateEvent: PropTypes.func.isRequired
  };

  componentDidMount() {
  }

  componentWillUnmount() {
  }

  handleFormSubmit({event_comment = ''}) {

    let existing_comment = false;
    let event_options = this.props.event.event_options = this.props.event.event_options.map(event_option => {
      if(event_option.event_option_name === 'event_comment') {
        existing_comment = true;
        return { event_option_name: 'event_comment', event_option_value: event_comment}
      } else {
        return event_option
      }
    })

    if(!existing_comment) {
      event_options.push({ event_option_name: 'event_comment', event_option_value: event_comment})
    }

    this.props.handleUpdateEvent(this.props.event.id, this.props.event.event_value, this.props.event.event_free_text, event_options, this.props.event.ts);
    this.props.handleDestroy();
  }

  renderTextArea({ input, label, required, meta: { touched, error, warning } }) {
    let requiredField = (required)? <span className='text-danger'> *</span> : ''
    let labelElement = (label)? <Form.Label>{label}{requiredField}</Form.Label> : ''
    return (
      <Form.Group>
        {labelElement}
        <Form.Control as="textarea" {...input} placeholder={label} rows={4}/>
        {touched && (error && <div className='text-danger'>{error}</div>) || (warning && <div className='text-danger'>{warning}</div>)}
      </Form.Group>
    )
  }

  render() {
    const { show, handleHide, handleSubmit, submitting, valid } = this.props

    return (
      <Modal show={show} onHide={handleHide}>
        <Form onSubmit={ handleSubmit(this.handleFormSubmit.bind(this)) }>
          <Modal.Header closeButton>
            <Modal.Title>Add/Update Comment</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <Field
              name="event_comment"
              component={this.renderTextArea}
            />
          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" size="sm" disabled={submitting} onClick={handleHide}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit" disabled={ submitting || !valid}>Submit</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    );
  }
}

function mapStateToProps(state, ownProps) {

  let event_option_comment = ownProps.event.event_options.find(event_option => event_option.event_option_name === 'event_comment')
  if(event_option_comment) {
    return {
      initialValues: { event_comment: event_option_comment.event_option_value }
    }
  }

  return {}
}

export default compose(
  reduxForm({form: 'EventCommentModal', enableReinitialize: true}),
  connectModal({name: 'eventComment', destroyOnHide: true }),
  connect(mapStateToProps, mapDispatchToProps)
)(EventCommentModal)