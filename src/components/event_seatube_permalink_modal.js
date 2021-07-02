import React, { Component } from 'react';
import { compose } from 'redux';
import PropTypes from 'prop-types';
import { Button, Form, Modal } from 'react-bootstrap';
import { connectModal } from 'redux-modal';
import { reduxForm, Field } from 'redux-form';
import { renderTextArea } from './form_elements';

const isURL = value => {
     // var urlRegex = '^(?!mailto:)(?:(?:http|https|ftp)://)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$';
     // var url = new RegExp(urlRegex, 'i');
     value && value.length < 2083 && '^(?!mailto:)(?:(?:http|https|ftp)://)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$'.test(value)
     ? 'Invalid URL'
     : undefined
}

class SeatubePermalinkModal extends Component {

  constructor (props) {
    super(props);

    this.handleFormSubmit = this.handleFormSubmit.bind(this);
  }

  static propTypes = {
    event: PropTypes.object,
    handleHide: PropTypes.func.isRequired,
    handleUpdateEvent: PropTypes.func
  };

  componentDidMount() {
    this.populateDefaultValues();
  }

  componentDidUpdate(prevProps) {
    if(prevProps.event !== this.props.event) {
      this.populateDefaultValues();
    }
  }

  componentWillUnmount() {
  }

  async populateDefaultValues() {
    const event_option_comment = (this.props.event) ? this.props.event.event_options.find(event_option => event_option.event_option_name === 'seatube_permalink') : null;
    if (event_option_comment) {
      this.props.initialize({ 'seatube_permalink': event_option_comment.event_option_value });
    }
  }

  handleFormSubmit(formProps) {

    let existing_permalink = false;
    let event_options = this.props.event.event_options = this.props.event.event_options.map(event_option => {
      if(event_option.event_option_name === 'seatube_permalink') {
        existing_permalink = true;
        return { event_option_name: 'seatube_permalink', event_option_value: formProps.seatube_permalink}
      } else {
        return event_option
      }
    })

    if(!existing_permalink) {
      event_options.push({ event_option_name: 'seatube_permalink', event_option_value: formProps.seatube_permalink})
    }

    this.props.handleUpdateEvent(this.props.event.id, this.props.event.event_value, this.props.event.event_free_text, event_options, this.props.event.ts);
    this.props.handleHide(this.props.event.id);
  }

  render() {
    const { show, handleHide, handleSubmit, submitting, valid, event } = this.props

    if (event) {
      return (
        <Modal show={show} onHide={handleHide}>
          <Form onSubmit={ handleSubmit(this.handleFormSubmit.bind(this)) }>
            <Modal.Header closeButton>
              <Modal.Title>Add/Update Seatube Permalink</Modal.Title>
            </Modal.Header>

            <Modal.Body>
              <Field
                name="seatube_permalink"
                component={renderTextArea}
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
    else {
      return null;
    }
  }
}

export default compose(
  connectModal({name: 'eventSeatubePermalink'}),
  reduxForm({form: 'eventSeatubePermalink'}),
)(SeatubePermalinkModal)