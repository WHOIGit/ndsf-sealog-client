import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { reduxForm, Field } from 'redux-form';
import { Button, Card, Form } from 'react-bootstrap';
import { renderAlert, renderDatePicker, renderMessage, renderTextField, renderTextArea, dateFormat } from './form_elements';
import axios from 'axios';
import Cookies from 'universal-cookie';
import moment from 'moment';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import FileDownload from 'js-file-download';
import { FilePond } from 'react-filepond';
import CopyCruiseToClipboard from './copy_cruise_to_clipboard';
import { API_ROOT_URL, CRUISE_ID_PLACEHOLDER, CRUISE_ID_REGEX, CUSTOM_CRUISE_NAME } from '../client_config';
import * as mapDispatchToProps from '../actions';

const CRUISE_ROUTE = "/files/cruises";

const cookies = new Cookies();

class UpdateCruise extends Component {

  constructor (props) {
    super(props);

    this.state = {
      filepondPristine: true,
      cruise_name: (CUSTOM_CRUISE_NAME)? CUSTOM_CRUISE_NAME[0].charAt(0).toUpperCase() + CUSTOM_CRUISE_NAME[0].slice(1) : "Cruise"
    }

    this.handleFileDownload = this.handleFileDownload.bind(this);
    this.handleFileDelete = this.handleFileDelete.bind(this);
  }

  static propTypes = {
    handleFormSubmit: PropTypes.func.isRequired
  };

  componentDidMount() {
    if(this.props.cruiseID) {
      this.props.initCruise(this.props.cruiseID);
    }
  }

  componentWillUnmount() {
    this.props.leaveUpdateCruiseForm();
  }

  handleFileDeleteModal(file) {
    // console.log("delete", file)
    this.props.showModal('deleteFile', { file: file, handleDelete: this.handleFileDelete });
  }

  async handleFormSubmit(formProps) {
    formProps.cruise_tags = (formProps.cruise_tags)? formProps.cruise_tags.map(tag => tag.trim()): [];

    // formProps.cruise_additional_meta = {}

    if(formProps.cruise_participants) {
      formProps.cruise_additional_meta.cruise_participants = formProps.cruise_participants.map(participant => participant.trim())
      delete formProps.cruise_participants
    }

    if(formProps.cruise_name) {
      formProps.cruise_additional_meta.cruise_name = formProps.cruise_name
      delete formProps.cruise_name
    }

    if(formProps.cruise_vessel) {
      formProps.cruise_additional_meta.cruise_vessel = formProps.cruise_vessel
      delete formProps.cruise_vessel
    }

    if(formProps.cruise_pi) {
      formProps.cruise_additional_meta.cruise_pi = formProps.cruise_pi
      delete formProps.cruise_pi
    }

    if(formProps.cruise_description) {
      formProps.cruise_additional_meta.cruise_description = formProps.cruise_description
      delete formProps.cruise_description
    }

    if(formProps.cruise_departure_location) {
      formProps.cruise_additional_meta.cruise_departure_location = formProps.cruise_departure_location;
      delete formProps.cruise_departure_location;
    }

    if(formProps.cruise_arrival_location) {
      formProps.cruise_additional_meta.cruise_arrival_location = formProps.cruise_arrival_location;
      delete formProps.cruise_arrival_location;
    }

    formProps.cruise_additional_meta.cruise_files = this.pond.getFiles().map(file => file.serverId)

    await this.props.updateCruise({...formProps });
    this.pond.removeFiles();
    this.props.handleFormSubmit()
  }

  async handleFileDownload(filename) {
    await axios.get(`${API_ROOT_URL}${CRUISE_ROUTE}/${this.props.cruise.id}/${filename}`,
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

  async handleFileDelete(filename) {
    await axios.delete(`${API_ROOT_URL}${CRUISE_ROUTE}/${this.props.cruise.id}/${filename}`,
    {
      headers: {
        authorization: cookies.get('token')
      }
    })
    .then(() => {
        this.props.initCruise(this.props.cruise.id)
     })
    .catch(()=>{
      console.log("JWT is invalid, logging out");
    });
  }

  renderFiles() {
    if(this.props.cruise.cruise_additional_meta && this.props.cruise.cruise_additional_meta.cruise_files && this.props.cruise.cruise_additional_meta.cruise_files.length > 0) {
      let files = this.props.cruise.cruise_additional_meta.cruise_files.map((file, index) => {
        return <div className="pl-2" key={`file_${index}`}><a className="text-decoration-none" href="#"  onClick={() => this.handleFileDownload(file)}>{file}</a> <FontAwesomeIcon onClick={() => this.handleFileDeleteModal(file)} className='text-danger' icon='trash' fixedWidth /></div>
      })

      return (
        <div className="mb-2">
          {files}
        </div>
      )
    }
      
    return null
  }

  render() {

    const { handleSubmit, pristine, reset, submitting, valid } = this.props;
    const updateCruiseFormHeader = (<div>Update {this.state.cruise_name}<span className="float-right"><CopyCruiseToClipboard cruise={this.props.cruise}/></span></div>);

    if (this.props.roles && (this.props.roles.includes("admin") || this.props.roles.includes('cruise_manager'))) {

      return (
        <Card className="border-secondary">
          <Card.Header>{updateCruiseFormHeader}</Card.Header>
          <Card.Body>
            <Form onSubmit={ handleSubmit(this.handleFormSubmit.bind(this)) }>
              <Form.Row>
                <Field
                  name="cruise_id"
                  component={renderTextField}
                  label={`${this.state.cruise_name} ID`}
                  placeholder={(CRUISE_ID_PLACEHOLDER) ? CRUISE_ID_PLACEHOLDER : "i.e. CS2001"}
                  required={true}
                />
                <Field
                  name="cruise_name"
                  component={renderTextField}
                  label={`${this.state.cruise_name} Name`}
                  placeholder="i.e. Lost City 2018"
                />
                <Field
                  name="cruise_vessel"
                  component={renderTextField}
                  label="Vessel Name"
                  placeholder="i.e. R/V Discovery"
                  required={true}
                />
                <Field
                  name="cruise_pi"
                  component={renderTextField}
                  label="Primary Investigator"
                  placeholder="i.e. Dr. Susan Lang"
                  required={true}
                />
                <Field
                  name="cruise_location"
                  component={renderTextField}
                  label={`${this.state.cruise_name} Location`}
                  placeholder="i.e. Lost City, Mid Atlantic Ridge"
                  lg={12}
                  sm={12}
                />
              </Form.Row>
              <Form.Row>
                <Field
                  name="cruise_description"
                  component={renderTextArea}
                  label={`${this.state.cruise_name} Description`}
                  placeholder={`i.e. A brief description of the ${this.state.cruise_name.toLowerCase()}`}
                  rows={8}
                />
              </Form.Row>
              <Form.Row>
                <Field
                  name="start_ts"
                  component={renderDatePicker}
                  label="Start Date (UTC)"
                  required={true}
                />
                <Field
                  name="stop_ts"
                  component={renderDatePicker}
                  label="Stop Date (UTC)"
                  required={true}
                />
              </Form.Row>
              <Form.Row>
                  <Field
                    name="cruise_departure_location"
                    component={renderTextField}
                    label="Departure Port"
                    placeholder="i.e. Norfolk, VA"
                    required={true}
                  />
                  <Field
                    name="cruise_arrival_location"
                    component={renderTextField}
                    label="Arrival Port"
                    placeholder="i.e. St. George's, Bermuda"
                    required={true}
                  />
              </Form.Row>
              <Form.Row>
                <Field
                  name="cruise_participants"
                  component={renderTextArea}
                  label={`${this.state.cruise_name} Participants, comma delimited`}
                  placeholder="i.e. Dave Butterfield,Sharon Walker"
                  rows={2}
                />
                <Field
                  name="cruise_tags"
                  component={renderTextArea}
                  label={`${this.state.cruise_name} Tags, comma delimited`}
                  placeholder="i.e. coral,chemistry,engineering"
                  rows={2}
                />
              </Form.Row>
                <Form.Label>{this.state.cruise_name} Files</Form.Label>
                {this.renderFiles()}
                <FilePond
                  ref={ref => this.pond = ref}
                  allowMultiple={true} 
                  maxFiles={5}
                  server={{
                    url: API_ROOT_URL,
                    process: {
                      url: CRUISE_ROUTE + '/filepond/process/' + this.props.cruise.id,
                      headers: { authorization: cookies.get('token') },
                    },
                    revert: {
                      url: CRUISE_ROUTE + '/filepond/revert',
                      headers: { authorization: cookies.get('token') },
                    }
                  }}
                  onupdatefiles={() => {
                    // Set currently active file objects to this.state
                    this.setState({ filepondPristine: false });
                  }}
                >
                </FilePond>
              {renderAlert(this.props.errorMessage)}
              {renderMessage(this.props.message)}
              <div className="float-right">
                <Button className="mr-1" variant="secondary" size="sm" disabled={pristine || submitting} onClick={reset}>Reset Values</Button>
                <Button variant="primary" size="sm" type="submit" disabled={(submitting || !valid || pristine) && this.state.filepondPristine}>Update</Button>
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

  if (!formProps.cruise_id) {
    errors.cruise_id = 'Required'
  } else if (formProps.cruise_id.length > 15) {
    errors.cruise_id = 'Must be 15 characters or less'
  }

  if (!formProps.cruise_vessel) {
    errors.cruise_vessel = 'Required'
  }

  if (!formProps.cruise_pi) {
    errors.cruise_pi = 'Required'
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
    if(moment(formProps.stop_ts, dateFormat).isBefore(moment(formProps.start_ts, dateFormat))) {
      errors.stop_ts = 'Stop date must be later than start data'
    }
  }

  if (!formProps.cruise_departure_location) {
    errors.cruise_departure_location = 'Required';
  }

  if (!formProps.cruise_arrival_location) {
    errors.cruise_arrival_location = 'Required';
  }

  if (typeof formProps.cruise_tags === "string") {
    if (formProps.cruise_tags === '') {
      formProps.cruise_tags = []
    } else {
      formProps.cruise_tags = formProps.cruise_tags.split(',');
    }
  }

  if (typeof formProps.cruise_participants === "string") {
    if (formProps.cruise_participants === '') {
      formProps.cruise_participants = []
    } else {
      formProps.cruise_participants = formProps.cruise_participants.split(',');
    }
  }

  return errors;

}

function warn(formProps) {

  const warnings = {}

  if (formProps.cruise_id && CRUISE_ID_REGEX != null && !formProps.cruise_id.match(CRUISE_ID_REGEX)) {
    warnings.cruise_id = 'Non-standard ID';
  }

  return warnings;
}

function mapStateToProps(state) {

  let initialValues = { ...state.cruise.cruise }

  if (initialValues.cruise_additional_meta) {
    if (initialValues.cruise_additional_meta.cruise_name) {
      initialValues.cruise_name = initialValues.cruise_additional_meta.cruise_name
    }

    if (initialValues.cruise_additional_meta.cruise_vessel) {
      initialValues.cruise_vessel = initialValues.cruise_additional_meta.cruise_vessel
    }

    if (initialValues.cruise_additional_meta.cruise_pi) {
      initialValues.cruise_pi = initialValues.cruise_additional_meta.cruise_pi
    }

    if (initialValues.cruise_additional_meta.cruise_description) {
      initialValues.cruise_description = initialValues.cruise_additional_meta.cruise_description
    }

    if (initialValues.cruise_additional_meta.cruise_participants) {
      initialValues.cruise_participants = initialValues.cruise_additional_meta.cruise_participants
    }

    if (initialValues.cruise_additional_meta.cruise_departure_location) {
      initialValues.cruise_departure_location = initialValues.cruise_additional_meta.cruise_departure_location
    }

    if (initialValues.cruise_additional_meta.cruise_arrival_location) {
      initialValues.cruise_arrival_location = initialValues.cruise_additional_meta.cruise_arrival_location
    }
    // delete initialValues.cruise_additional_meta
  }

  return {
    errorMessage: state.cruise.cruise_error,
    message: state.cruise.cruise_message,
    initialValues: initialValues,
    cruise: state.cruise.cruise,
    roles: state.user.profile.roles
  };
}

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  reduxForm({
    form: 'editCruise',
    enableReinitialize: true,
    validate: validate,
    warn: warn
  })
)(UpdateCruise);