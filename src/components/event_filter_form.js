import React, { Component } from 'react'
import { compose } from 'redux'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { reduxForm, Field } from 'redux-form'
import moment from 'moment'
import { Button, Card, Form } from 'react-bootstrap'
import { renderDateTimePicker, renderTextField } from './form_elements'
import * as mapDispatchToProps from '../actions'

const timeFormat = 'HH:mm:ss'

class EventFilterForm extends Component {
  constructor(props) {
    super(props)

    this.clearForm = this.clearForm.bind(this)
  }

  componentDidMount() {
    if (this.props.initialValues) {
      this.props.initialize(this.props.initialValues)
    }
  }

  handleFormSubmit(formProps) {
    if (formProps.startTS && typeof formProps.startTS === 'object') {
      if (this.props.minDate && formProps.startTS.isBefore(moment(this.props.minDate))) {
        formProps.startTS = this.props.minDate
      } else {
        formProps.startTS = formProps.startTS.toISOString()
      }
    }

    if (formProps.stopTS && typeof formProps.stopTS === 'object') {
      if (this.props.maxDate && formProps.stopTS.isAfter(moment(this.props.maxDate))) {
        formProps.stopTS = this.props.maxDate
      } else {
        formProps.stopTS = formProps.stopTS.toISOString()
      }
    }

    if (formProps.fulltext) {
      formProps.fulltext = formProps.fulltext
        .split(',')
        .map((fulltext) => fulltext.trim())
        .join(',')
    }

    if (formProps.author) {
      formProps.author = formProps.author
        .split(',')
        .map((author) => author.trim())
        .join(',')
    }

    this.props.handlePostSubmit(formProps)
  }

  clearForm() {
    this.props.resetFields('eventFilterForm', {
      fulltext: '',
      author: '',
      startTS: '',
      stopTS: '',
      freetext: '',
      datasource: ''
    })
    this.props.handlePostSubmit({})
  }

  render() {
    const { handleSubmit, submitting, valid } = this.props
    const eventFilterFormHeader = <div>Event Filter</div>
    const startTS = this.props.minDate ? moment(this.props.minDate) : null
    const stopTS = this.props.maxDate ? moment(this.props.maxDate) : null

    return (
      <Card className='form-standard border-secondary'>
        <Card.Header>{eventFilterFormHeader}</Card.Header>
        <Card.Body className='px-0'>
          <Form onSubmit={handleSubmit(this.handleFormSubmit.bind(this))}>
            <Field name='fulltext' component={renderTextField} label='Full text' placeholder='i.e. SAMPLE' disabled={this.props.disabled} />
            <Field name='author' component={renderTextField} label='Author' placeholder='i.e. jsmith' disabled={this.props.disabled} />
            <Field
              name='startTS'
              component={renderDateTimePicker}
              defaultValue={startTS}
              timeFormat={timeFormat}
              label='Start Date/Time (UTC)'
              disabled={this.props.disabled}
            />
            <Field
              name='stopTS'
              component={renderDateTimePicker}
              defaultValue={stopTS}
              timeFormat={timeFormat}
              label='Stop Date/Time (UTC)'
              disabled={this.props.disabled}
            />
            <div className='float-right'>
              <Button className='mr-1' variant='secondary' size='sm' disabled={submitting || this.props.disabled} onClick={this.clearForm}>
                Reset
              </Button>
              <Button className='mr-3' variant='primary' size='sm' type='submit' disabled={submitting || !valid || this.props.disabled}>
                Filter
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    )
  }
}

EventFilterForm.propTypes = {
  disabled: PropTypes.bool.isRequired,
  handlePostSubmit: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  initialize: PropTypes.func.isRequired,
  initialValues: PropTypes.object,
  maxDate: PropTypes.string,
  minDate: PropTypes.string,
  resetFields: PropTypes.func.isRequired,
  submitting: PropTypes.bool.isRequired,
  valid: PropTypes.bool.isRequired
}

const validate = () => {
  const errors = {}
  return errors
}

const mapStateToProps = () => {
  return {}
}

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  reduxForm({
    form: 'eventFilterForm',
    validate: validate
  })
)(EventFilterForm)
