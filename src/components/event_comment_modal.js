import React, { Component } from 'react'
import { compose } from 'redux'
import PropTypes from 'prop-types'
import { Button, Form, Modal } from 'react-bootstrap'
import { connectModal } from 'redux-modal'
import { reduxForm, Field } from 'redux-form'
import { renderTextArea } from './form_elements'

class EventCommentModal extends Component {
  constructor(props) {
    super(props)

    this.handleFormSubmit = this.handleFormSubmit.bind(this)
  }

  componentDidMount() {
    this.populateDefaultValues()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.event !== this.props.event) {
      this.populateDefaultValues()
    }
  }

  componentWillUnmount() {}

  async populateDefaultValues() {
    const event_option_comment = this.props.event
      ? this.props.event.event_options.find((event_option) => event_option.event_option_name === 'event_comment')
      : null
    if (event_option_comment) {
      this.props.initialize({
        event_comment: event_option_comment.event_option_value
      })
    }
  }

  handleFormSubmit(formProps) {
    let existing_comment = false
    let event_options = (this.props.event.event_options = this.props.event.event_options.map((event_option) => {
      if (event_option.event_option_name === 'event_comment') {
        existing_comment = true
        return {
          event_option_name: 'event_comment',
          event_option_value: formProps.event_comment
        }
      } else {
        return event_option
      }
    }))

    if (!existing_comment) {
      event_options.push({
        event_option_name: 'event_comment',
        event_option_value: formProps.event_comment
      })
    }

    this.props.handleUpdateEvent({ ...this.props.event, event_options })
    this.props.handleHide()
  }

  render() {
    const { show, handleHide, handleSubmit, submitting, valid, event } = this.props

    if (event) {
      return (
        <Modal show={show} onHide={handleHide}>
          <Form onSubmit={handleSubmit(this.handleFormSubmit.bind(this))}>
            <Modal.Header className='bg-light' closeButton>
              <Modal.Title>Add/Update Comment</Modal.Title>
            </Modal.Header>

            <Modal.Body>
              <Field name='event_comment' component={renderTextArea} />
            </Modal.Body>

            <Modal.Footer>
              <Button variant='secondary' size='sm' disabled={submitting} onClick={handleHide}>
                Cancel
              </Button>
              <Button variant='primary' size='sm' type='submit' disabled={submitting || !valid}>
                Submit
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      )
    } else {
      return null
    }
  }
}

EventCommentModal.propTypes = {
  event: PropTypes.object.isRequired,
  handleHide: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  handleUpdateEvent: PropTypes.func.isRequired,
  initialize: PropTypes.func.isRequired,
  show: PropTypes.bool.isRequired,
  submitting: PropTypes.bool.isRequired,
  valid: PropTypes.bool.isRequired
}

export default compose(connectModal({ name: 'eventComment' }), reduxForm({ form: 'eventCommentModal' }))(EventCommentModal)
