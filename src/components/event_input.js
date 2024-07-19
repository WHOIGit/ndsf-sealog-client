import React, { Component } from 'react'
import { compose } from 'redux'
import { connect } from 'react-redux'
import { reduxForm, Field, reset } from 'redux-form'
import { Button, Form, InputGroup } from 'react-bootstrap'
import PropTypes from 'prop-types'
import * as mapDispatchToProps from '../actions'

class EventInput extends Component {
  constructor(props) {
    super(props)
  }

  handleFormSubmit(formProps) {
    this.props.createEvent({ ...formProps, event_value: 'FREE_FORM' })
  }

  render() {
    const { handleSubmit, submitting, pristine } = this.props

    return (
      <Form className={this.props.className} onSubmit={handleSubmit(this.handleFormSubmit.bind(this))}>
        <InputGroup>
          <Field name='event_free_text' component='input' type='text' placeholder='Type new event' className='form-control' />
          <InputGroup.Append>
            <Button block type='submit' disabled={submitting || pristine}>
              Submit
            </Button>
          </InputGroup.Append>
        </InputGroup>
      </Form>
    )
  }
}

EventInput.propTypes = {
  className: PropTypes.string,
  createEvent: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  pristine: PropTypes.bool.isRequired,
  submitting: PropTypes.bool.isRequired
}

const mapStateToProps = () => {
  return {}
}

const afterSubmit = (result, dispatch) => {
  dispatch(reset('eventInput'))
}

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  reduxForm({
    form: 'eventInput',
    onSubmitSuccess: afterSubmit
  })
)(EventInput)
