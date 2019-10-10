import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { reduxForm, Field } from 'redux-form';
import { Alert, Button, Col, Card, Form, Tooltip, OverlayTrigger} from 'react-bootstrap';
import axios from 'axios';
import Cookies from 'universal-cookie';
import moment from 'moment';
import Datetime from 'react-datetime';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import FileDownload from 'js-file-download';

import { FilePond } from 'react-filepond';
import 'filepond/dist/filepond.min.css';

import { API_ROOT_URL } from '../client_config';
import * as mapDispatchToProps from '../actions';

const dateFormat = "YYYY-MM-DD"
const timeFormat = "HH:mm"

const LOWERING_ROUTE = "/files/lowerings";

const cookies = new Cookies();

class UpdateLowering extends Component {

  constructor (props) {
    super(props);

    this.handleFileDownload = this.handleFileDownload.bind(this);
    this.handleFileDelete = this.handleFileDelete.bind(this);
    this.handleSetLoweringStatsModal = this.handleSetLoweringStatsModal.bind(this);
  }

  static propTypes = {
    handleFormSubmit: PropTypes.func.isRequired
  };

  componentDidMount() {
    if(this.props.loweringID) {
      this.props.initLowering(this.props.loweringID);
    }
  }

  componentWillUnmount() {
    this.props.leaveUpdateLoweringForm();
  }

  handleFormSubmit(formProps) {
    formProps.lowering_tags = (formProps.lowering_tags)? formProps.lowering_tags.map(tag => tag.trim()): [];

    // formProps.lowering_additional_meta = {}

    if(formProps.lowering_description) {
      formProps.lowering_additional_meta.lowering_description = formProps.lowering_description
      delete formProps.lowering_description
    }

    formProps.lowering_additional_meta.lowering_files = this.pond.getFiles().map(file => file.serverId)

    this.props.updateLowering({...formProps});
    this.pond.removeFiles();
    this.props.handleFormSubmit()
  }

  handleFileDownload(loweringID, filename) {
    axios.get(`${API_ROOT_URL}${LOWERING_ROUTE}/${loweringID}/${filename}`,
    {
      headers: {
        authorization: cookies.get('token')
      },
      responseType: 'arraybuffer'
    })
    .then((response) => {
        FileDownload(response.data, filename);
     })
    .catch(()=>{
      console.log("JWT is invalid, logging out");
    });
  }

  handleFileDelete(loweringID, filename) {
    axios.delete(`${API_ROOT_URL}${LOWERING_ROUTE}/${loweringID}/${filename}`,
    {
      headers: {
        authorization: cookies.get('token')
      }
    })
    .then(() => {
        this.props.initLowering(loweringID)
     })
    .catch(()=>{
      console.log("JWT is invalid, logging out");
    });
  }

  handleSetLoweringStatsModal() {
    this.props.showModal('setLoweringStats', { lowering: this.props.lowering, handleUpdateLowering: this.props.updateLowering });
  }

  copyToClipboard() {
    if(this.props.lowering.lowering_id) {
      return  (
`Lowering:      ${this.props.lowering.lowering_id}
Description:   ${(this.props.lowering.lowering_additional_meta.lowering_description) ? this.props.lowering.lowering_additional_meta.lowering_description : ""}
Location:      ${this.props.lowering.lowering_location}\n
Start of Dive: ${this.props.lowering.start_ts}
On Bottom:     ${(this.props.lowering.lowering_additional_meta.milestones && this.props.lowering.lowering_additional_meta.milestones.lowering_on_bottom) ? this.props.lowering.lowering_additional_meta.milestones.lowering_on_bottom : ""}
Off Bottom:    ${(this.props.lowering.lowering_additional_meta.milestones && this.props.lowering.lowering_additional_meta.milestones.lowering_off_bottom) ? this.props.lowering.lowering_additional_meta.milestones.lowering_off_bottom : ""}
End of Dive:   ${this.props.lowering.stop_ts}\n
Dive Origin:   ${(this.props.lowering.lowering_additional_meta.stats && this.props.lowering.lowering_additional_meta.stats.dive_origin.length >= 2) ? this.props.lowering.lowering_additional_meta.stats.dive_origin[0] + ', ' + this.props.lowering.lowering_additional_meta.stats.dive_origin[1] : ""}
Dive UTM Zone: ${(this.props.lowering.lowering_additional_meta.stats && this.props.lowering.lowering_additional_meta.stats.dive_origin.length == 3) ? this.props.lowering.lowering_additional_meta.stats.dive_origin[2] : ""}\n
Max Depth:     ${(this.props.lowering.lowering_additional_meta.stats && this.props.lowering.lowering_additional_meta.stats.max_depth) ? this.props.lowering.lowering_additional_meta.stats.max_depth : ""}
Bounding Box:  ${(this.props.lowering.lowering_additional_meta.stats && this.props.lowering.lowering_additional_meta.stats.bounding_box) ? this.props.lowering.lowering_additional_meta.stats.bounding_box.join(', ') : ""}\n`
      )
    }
  }

  renderTextField({ input, label, placeholder, required, meta: { touched, error } }) {
    let requiredField = (required)? <span className='text-danger'> *</span> : ''
    let placeholder_txt = (placeholder)? placeholder: label

    return (
      <Form.Group as={Col} lg="6">
        <Form.Label>{label}{requiredField}</Form.Label>
        <Form.Control type="text" {...input} placeholder={placeholder_txt} isInvalid={touched && error}/>
        <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
      </Form.Group>
    )
  }

  renderTextArea({ input, label, placeholder, required, rows = 4, meta: { error } }) {
    let requiredField = (required)? <span className='text-danger'> *</span> : ''
    let placeholder_txt = (placeholder)? placeholder: label

    return (
      <Form.Group as={Col} lg="12">
        <Form.Label>{label}{requiredField}</Form.Label>
        <Form.Control as="textarea" {...input} placeholder={placeholder_txt} rows={rows}/>
        <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
      </Form.Group>
    )
  }

  renderSelectField({ input, label, placeholder, required, options, meta: { touched, error } }) {

    let requiredField = (required)? <span className='text-danger'> *</span> : ''
    let placeholder_txt = (placeholder)? placeholder: label
    let defaultOption = ( <option key={`${input.name}.empty`} value=""></option> );
    let optionList = options.map((option, index) => {
      return (
        <option key={`${input.name}.${index}`} value={`${option}`}>{ `${option}`}</option>
      );
    });

    return (
      <Form.Group as={Col} lg="6">
        <Form.Label>{label}{requiredField}</Form.Label>
        <Form.Control as="select" {...input} placeholder={placeholder_txt} isInvalid={touched && error}>
          { defaultOption }
          { optionList }
        </Form.Control>
        <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
      </Form.Group>
    )
  }

  renderDatePicker({ input, label, required, meta: { touched, error } }) {
    let requiredField = (required)? <span className='text-danger'> *</span> : ''
    
    return (
      <Form.Group as={Col} lg="6">
        <Form.Label>{label}{requiredField}</Form.Label>
        <Datetime {...input} utc={true} value={input.value ? moment.utc(input.value).format(dateFormat + ' ' + timeFormat) : null} dateFormat={dateFormat} timeFormat={timeFormat} selected={input.value ? moment.utc(input.value, dateFormat) : null }/>
        {touched && (error && <div style={{width: "100%", marginTop: "0.25rem", fontSize: "80%"}} className='text-danger'>{error}</div>)}
      </Form.Group>
    )
  }

  renderCheckboxGroup({ label, options, input, required, meta: { dirty, error } }) {

    let requiredField = (required)? (<span className='text-danger'> *</span>) : ''
    let checkboxList = options.map((option, index) => {

    return (
        <Form.Check
          inline
          label={option.value}
          name={`${option.label}[${index}]`}
          key={`${label}.${index}`}
          value={option.value}
          checked={input.value.indexOf(option.value) !== -1}
          onChange={event => {
            const newValue = [...input.value];
            if(event.target.checked) {
              newValue.push(option.value);
            } else {
              newValue.splice(newValue.indexOf(option.value), 1);
            }
            return input.onChange(newValue);
          }}
        />
      );
    });

    return (
      <Form.Group>
        <Form.Label>{label}{requiredField}</Form.Label><br/>
        {checkboxList}
        {dirty && (error && <div className="text-danger" style={{width: "100%", marginTop: "0.25rem", fontSize: "80%"}}>{error}</div>)}
      </Form.Group>
    );
  }

  renderCheckbox({ input, label, meta: { dirty, error } }) {    
    return (
      <Form.Group as={Col} lg="6">
        <Form.Check
          {...input}
          label={label}
          checked={input.value ? true : false}
          onChange={(e) => input.onChange(e.target.checked)}
          isInvalid={dirty && error}
        >
        </Form.Check>
        <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
      </Form.Group>
    );
  }

  renderFiles() {
    if(this.props.lowering.lowering_additional_meta && this.props.lowering.lowering_additional_meta.lowering_files && this.props.lowering.lowering_additional_meta.lowering_files.length > 0) {
      let files = this.props.lowering.lowering_additional_meta.lowering_files.map((file, index) => {
        return <li style={{ listStyleType: "none" }} key={`file_${index}`}><span onClick={() => this.handleFileDownload(this.props.lowering.id, file)}><FontAwesomeIcon className='text-primary' icon='download' fixedWidth /></span> <span onClick={() => this.handleFileDelete(this.props.lowering.id, file)}><FontAwesomeIcon className='text-danger' icon='trash' fixedWidth /></span><span> {file}</span></li>
      })
      return <div>{files}<br/></div>
    }
    return null
  }

  renderAlert() {
    if (this.props.errorMessage) {
      return (
        <Alert variant="danger">
          <strong>Opps!</strong> {this.props.errorMessage}
        </Alert>
      )
    }
  }

  renderMessage() {
    if (this.props.message) {
      return (
        <Alert variant="success">
          <strong>Success!</strong> {this.props.message}
        </Alert>
      )
    }
  }

  render() {

    const { handleSubmit, pristine, reset, submitting, valid } = this.props;
    const updateLoweringFormHeader = (<div>Update Lowering<span className="float-right"><OverlayTrigger placement="top" overlay={<Tooltip id="copyToClipboardTooltip">Copy Lowering to Clipboard</Tooltip>}><CopyToClipboard text={this.copyToClipboard()} ><FontAwesomeIcon icon='clipboard' fixedWidth /></CopyToClipboard></OverlayTrigger></span></div>);

    if (this.props.roles && (this.props.roles.includes("admin") || this.props.roles.includes('cruise_manager'))) {

      return (
        <Card>
          <Card.Header>{updateLoweringFormHeader}</Card.Header>
          <Card.Body>
            <Form onSubmit={ handleSubmit(this.handleFormSubmit.bind(this)) }>
              <Form.Row>
                <Field
                  name="lowering_id"
                  component={this.renderTextField}
                  label="Lowering ID"
                  placeholder="i.e. J2-1000"
                  required={true}
                />
                <Field
                  name="lowering_location"
                  component={this.renderTextField}
                  label="Lowering Location"
                  placeholder="i.e. Kelvin Seamount"
                />
              </Form.Row>
              <Form.Row>
                <Field
                  name="lowering_description"
                  component={this.renderTextArea}
                  label="Lowering Description"
                  placeholder="i.e. A brief description of the lowering"
                  rows={8}
                />
              </Form.Row>
              <Form.Row>
                <Field
                  name="start_ts"
                  component={this.renderDatePicker}
                  label="Start Date/Time (UTC)"
                  required={true}
                />
                <Field
                  name="stop_ts"
                  component={this.renderDatePicker}
                  label="Stop Date/Time (UTC)"
                  required={true}
                />
              </Form.Row>
              <Form.Row>
                <Field
                  name="lowering_tags"
                  component={this.renderTextArea}
                  label="Lowering Tags, comma delimited"
                  placeholder="i.e. coral,chemistry,engineering"
                  rows={2}
                />
              </Form.Row>
              <Form.Label>Lowering Files</Form.Label>
              {this.renderFiles()}
              <FilePond ref={ref => this.pond = ref} allowMultiple={true} 
                maxFiles={5} 
                server={{
                  url: API_ROOT_URL,
                  process: {
                    url: LOWERING_ROUTE + '/filepond/process/' + this.props.lowering.id,
                    headers: { authorization: cookies.get('token') },
                  },
                  load: {
                    url: LOWERING_ROUTE + '/filepond/load',
                    headers: { authorization: cookies.get('token') },
                  },
                  revert: {
                    url: LOWERING_ROUTE + '/filepond/revert',
                    headers: { authorization: cookies.get('token') },
                  }
                }}
              >
              </FilePond>
              {this.renderAlert()}
              {this.renderMessage()}
              <Button variant="warning" size="sm" onClick={this.handleSetLoweringStatsModal}>Milestones/Stats</Button>
              <div className="float-right" style={{marginRight: "-20px", marginBottom: "-8px"}}>
                <Button variant="secondary" size="sm" disabled={pristine || submitting} onClick={reset}>Reset Values</Button>
                <Button variant="primary" size="sm" type="submit" disabled={submitting || !valid || pristine}>Update</Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      )
    } else {
      return (
        <div>
          What are YOU doing here?
        </div>
      )
    }
  }
}

function validate(formProps) {

  const errors = {};

  if (!formProps.lowering_id) {
    errors.lowering_id = 'Required'
  } else if (formProps.lowering_id.length > 15) {
    errors.lowering_id = 'Must be 15 characters or less'
  }

  if (!formProps.lowering_name) {
    errors.lowering_name = 'Required'
  }

  if (formProps.start_ts === '') {
    errors.start_ts = 'Required'
  } else if (!moment.utc(formProps.start_ts).isValid()) {
    errors.start_ts = 'Invalid timestamp'
  }

  if (formProps.stop_ts === '') {
    errors.stop_ts = 'Required'
  } else if (!moment.utc(formProps.stop_ts).isValid()) {
    errors.stop_ts = 'Invalid timestamp'
  }

  if ((formProps.start_ts !== '') && (formProps.stop_ts !== '')) {
    if(moment(formProps.stop_ts, dateFormat + " " + timeFormat).isBefore(moment(formProps.start_ts, dateFormat + " " + timeFormat))) {
      errors.stop_ts = 'Stop date must be later than start data'
    }
  }

  if (typeof formProps.lowering_tags === "string") {
    if (formProps.lowering_tags === '') {
      formProps.lowering_tags = []
    } else {
      formProps.lowering_tags = formProps.lowering_tags.split(',');
    }
  }

  return errors;

}

function mapStateToProps(state) {

  let initialValues = { ...state.lowering.lowering }

  if (initialValues.lowering_additional_meta) {

    if (initialValues.lowering_additional_meta.lowering_description) {
      initialValues.lowering_description = initialValues.lowering_additional_meta.lowering_description
    }

    // delete initialValues.lowering_additional_meta
  }

  return {
    errorMessage: state.lowering.lowering_error,
    message: state.lowering.lowering_message,
    initialValues: initialValues,
    lowering: state.lowering.lowering,
    roles: state.user.profile.roles
  };
}

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  reduxForm({
    form: 'editLowering',
    enableReinitialize: true,
    validate: validate
  })
)(UpdateLowering);