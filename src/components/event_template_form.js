import React, { Component } from 'react'
import { compose } from 'redux'
import { connect } from 'react-redux'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { reduxForm, Field, FieldArray, formValueSelector } from 'redux-form'
import { Button, Form, Card } from 'react-bootstrap'
import PropTypes from 'prop-types'
import { renderAlert, renderHidden, renderMessage, renderSelectField, renderSwitch, renderTextField, renderTextArea } from './form_elements'
import * as mapDispatchToProps from '../actions'
import { EventTemplateOptionTypes } from '../event_template_option_types'

class EventTemplateForm extends Component {
  constructor(props) {
    super(props)

    this.renderOptions = this.renderOptions.bind(this)
    this.renderOptionOptions = this.renderOptionOptions.bind(this)
  }

  componentWillUnmount() {
    this.props.leaveEventTemplateForm()
  }

  handleFormSubmit(formProps) {
    formProps.system_template = formProps.system_template || false
    formProps.disabled = formProps.disabled || false
    formProps.template_categories = formProps.template_categories || []

    if (typeof formProps.template_categories === 'string') {
      formProps.template_categories = formProps.template_categories.split(',')
    }
    formProps.template_categories = formProps.template_categories.map((string) => {
      return string.trim()
    })

    formProps.event_free_text_required = formProps.event_free_text_required || false
    formProps.event_options = formProps.event_options || []

    formProps.event_options = formProps.event_options.map((event_option) => {
      event_option.event_option_allow_freeform = event_option.event_option_allow_freeform || false
      event_option.event_option_required = event_option.event_option_required || false

      if (['dropdown', 'checkboxes', 'radio buttons'].includes(event_option.event_option_type)) {
        if (typeof event_option.event_option_values === 'string') {
          event_option.event_option_values = event_option.event_option_values.split(',')
        }
        event_option.event_option_values = event_option.event_option_values.map((string) => {
          return string.trim()
        })
      } else {
        event_option.event_option_values = []
      }

      return event_option
    })

    if (formProps.id) {
      this.props.updateEventTemplate(formProps)
    } else {
      this.props.createEventTemplate(formProps)
    }

    this.props.handleFormSubmit()
  }

  renderOptionOptions(prefix, index) {
    if (this.props.event_options && this.props.event_options.length > 0) {
      if (this.props.event_options[index].event_option_type === 'static text') {
        return (
          <div>
            <Field name={`${prefix}.event_option_default_value`} component={renderTextField} label='Value' required={true} />
          </div>
        )
      } else if (this.props.event_options[index].event_option_type === 'text') {
        return (
          <div>
            <Field name={`${prefix}.event_option_default_value`} component={renderTextField} label='Default Value' />
          </div>
        )
      } else if (this.props.event_options[index].event_option_type === 'dropdown') {
        return (
          <div>
            <Field name={`${prefix}.event_option_values`} component={renderTextArea} label='Dropdown Options' required={true} rows={2} />
            <Field
              name={`${prefix}.event_option_default_value`}
              component={renderTextField}
              label='Default Selection'
              placeholder='i.e. a value from the list of options'
            />
          </div>
        )
      } else if (this.props.event_options[index].event_option_type === 'checkboxes') {
        return (
          <div>
            <Field name={`${prefix}.event_option_values`} component={renderTextArea} label='Checkbox Options' required={true} rows={2} />
            <Field
              name={`${prefix}.event_option_default_value`}
              component={renderTextField}
              label='Default Selections'
              placeholder='i.e. a value from the list of options'
            />
          </div>
        )
      } else if (this.props.event_options[index].event_option_type === 'radio buttons') {
        return (
          <div>
            <Field
              name={`${prefix}.event_option_values`}
              component={renderTextArea}
              label='Radio Button Options'
              required={true}
              rows={2}
            />
            <Field
              name={`${prefix}.event_option_default_value`}
              component={renderTextField}
              label='Default Selection'
              placeholder='i.e. a value from the list of options'
            />
          </div>
        )
      } else {
        return
      }
    }
  }

  renderOptions({ fields, meta: { touched, error } }) {
    const promote = (index, fields) => {
      if (index > 0) {
        return (
          <FontAwesomeIcon
            className='text-primary float-right'
            icon='chevron-up'
            fixedWidth
            onClick={() => fields.swap(index, index - 1)}
          />
        )
      }
    }

    const demote = (index, fields) => {
      if (index < fields.length - 1) {
        return (
          <FontAwesomeIcon
            className='text-primary float-right'
            icon='chevron-down'
            fixedWidth
            onClick={() => fields.swap(index, index + 1)}
          />
        )
      }
    }

    return (
      <div>
        {fields.map((options, index) => (
          <div key={`option_${index}`}>
            <hr className='border-secondary' />
            <span>
              <Form.Label>Option #{index + 1}</Form.Label>
              <FontAwesomeIcon className='text-danger float-right' icon='times' fixedWidth onClick={() => fields.remove(index)} />
              {promote(index, fields)}
              {demote(index, fields)}
            </span>
            <Field name={`${options}.event_option_name`} component={renderTextField} label='Name' required={true} />
            <Field
              name={`${options}.event_option_type`}
              component={renderSelectField}
              options={EventTemplateOptionTypes}
              label='Type'
              required={true}
            />
            {this.renderOptionOptions(options, index)}
            <Field name={`${options}.event_option_required`} component={renderSwitch} label='Required?' />
          </div>
        ))}
        <span className='text-primary' onClick={() => fields.push({})}>
          <FontAwesomeIcon icon='plus' fixedWidth /> Add Option
        </span>
        {touched && error && <span>{error}</span>}
      </div>
    )
  }

  renderAdminOptions() {
    if (this.props.roles.includes('admin')) {
      return (
        <div>
          {this.renderSystemEventTemplateOption()}
          {this.renderDisableTemplateOption()}
        </div>
      )
    }
  }

  renderSystemEventTemplateOption() {
    return <Field name='system_template' component={renderSwitch} label='System Template' />
  }

  renderDisableTemplateOption() {
    return <Field name='disabled' label='Disable Template' component={renderSwitch} />
  }

  render() {
    const { handleSubmit, pristine, reset, submitting, valid } = this.props
    const formHeader = <div>{this.props.event_template.id ? 'Update' : 'Add'} Event Template</div>

    if (this.props.roles && (this.props.roles.includes('admin') || this.props.roles.includes('template_manager'))) {
      return (
        <Card className='border-secondary'>
          <Card.Header>{formHeader}</Card.Header>
          <Card.Body>
            <Form onSubmit={handleSubmit(this.handleFormSubmit.bind(this))}>
              <Field name='id' component={renderHidden} />
              <Form.Row>
                <Field name='event_name' component={renderTextField} label='Button Name' required={true} />
                <Field name='event_value' component={renderTextField} label='Event Value' required={true} />
                <Field
                  name={'template_categories'}
                  component={renderTextField}
                  label='Template Categories (comma delimited)'
                  placeholder='i.e. biology,geology'
                />
                <Field
                  name='event_free_text_required'
                  id='event_free_text_required'
                  component={renderSwitch}
                  label={'Free text Required?'}
                />
                {this.renderAdminOptions()}
              </Form.Row>
              <FieldArray name='event_options' component={this.renderOptions} />
              {renderAlert(this.props.errorMessage)}
              {renderMessage(this.props.message)}
              <div className='float-right'>
                <Button className='mr-1' variant='secondary' size='sm' disabled={pristine || submitting} onClick={reset}>
                  Reset Form
                </Button>
                <Button variant='primary' size='sm' type='submit' disabled={pristine || submitting || !valid}>
                  {this.props.event_template.id ? 'Update' : 'Add'}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      )
    } else {
      return <div>What are YOU doing here?</div>
    }
  }
}

EventTemplateForm.propTypes = {
  createEventTemplate: PropTypes.func.isRequired,
  errorMessage: PropTypes.string.isRequired,
  event_options: PropTypes.array.isRequired,
  event_template: PropTypes.object.isRequired,
  handleFormSubmit: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  leaveEventTemplateForm: PropTypes.func.isRequired,
  message: PropTypes.string.isRequired,
  pristine: PropTypes.bool.isRequired,
  reset: PropTypes.func.isRequired,
  roles: PropTypes.array,
  submitting: PropTypes.bool.isRequired,
  updateEventTemplate: PropTypes.func.isRequired,
  valid: PropTypes.bool.isRequired
}

const validate = (formProps) => {
  const errors = {}

  if (!formProps.event_name) {
    errors.event_name = 'Required'
  } else if (formProps.event_name.length > 32) {
    errors.event_name = 'Must be 32 characters or less'
  }

  if (!formProps.event_value) {
    errors.event_value = 'Required'
  }

  if (typeof formProps.template_categories === 'string' && formProps.template_categories !== '') {
    try {
      formProps.template_categories.split(',')
    } catch (err) {
      errors.template_categories = 'Invalid csv list'
    }
  }

  const event_optionsArrayErrors = []

  if (formProps.event_options) {
    // look for duplicate keys
    let seen = []
    let dupes = []

    formProps.event_options.forEach((event_option) => {
      if (event_option.event_option_name && event_option.event_option_name.length > 0) {
        if (seen.indexOf(event_option.event_option_name.toLowerCase()) >= 0) {
          dupes.push(event_option.event_option_name.toLowerCase())
        } else {
          seen.push(event_option.event_option_name.toLowerCase())
        }
      }
    })

    formProps.event_options.forEach((event_option, event_optionIndex) => {
      const event_optionErrors = {}

      if (!event_option.event_option_name) {
        event_optionErrors.event_option_name = 'Required'
      }

      if (event_option.event_option_name && dupes.indexOf(event_option.event_option_name.toLowerCase()) >= 0) {
        event_optionErrors.event_option_name = 'Option name must be unique'
        event_optionsArrayErrors[event_optionIndex] = event_optionErrors
      }

      if (!event_option.event_option_type) {
        event_optionErrors.event_option_type = 'Required'
      }

      if (['dropdown', 'checkboxes', 'radio buttons'].includes(event_option.event_option_type)) {
        let valueArray = []

        if (event_option.event_option_values === '') {
          event_optionErrors.event_option_values = 'Required'
        } else {
          try {
            valueArray =
              typeof event_option.event_option_values === 'object'
                ? event_option.event_option_values
                : event_option.event_option_values.split(',')
            valueArray = valueArray.map((string) => {
              return string.trim()
            })
          } catch (err) {
            event_optionErrors.event_option_values = 'Invalid csv list'
          }
        }

        if (event_option.event_option_default_value && !valueArray.includes(event_option.event_option_default_value)) {
          event_optionErrors.event_option_default_value = 'Value is not in options list'
        }
      }

      if (event_option.event_option_type === 'static text') {
        if (!event_option.event_option_default_value || event_option.event_option_default_value.trim() === '') {
          event_optionErrors.event_option_default_value = 'Required'
        }
      }

      event_optionsArrayErrors[event_optionIndex] = event_optionErrors
    })
  }

  if (event_optionsArrayErrors.length) {
    errors.event_options = event_optionsArrayErrors
  }

  return errors
}

EventTemplateForm.propTypes = {
  handleFormSubmit: PropTypes.func.isRequired
}

const mapStateToProps = (state) => {
  let initialValues = { ...state.event_template.event_template }

  return {
    errorMessage: state.event_template.event_template_error,
    message: state.event_template.event_template_message,
    initialValues: initialValues,
    event_template: state.event_template.event_template,
    roles: state.user.profile.roles,
    event_options: selector(state, 'event_options')
  }
}

const selector = formValueSelector('editEventTemplate')

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  reduxForm({
    form: 'editEventTemplate',
    enableReinitialize: true,
    validate: validate
  })
)(EventTemplateForm)
