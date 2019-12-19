import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { reduxForm, Field } from 'redux-form';
import { Button, Card, Form, Tooltip, OverlayTrigger} from 'react-bootstrap';
import { renderAlert, renderDatePicker, renderMessage, renderTextField, renderTextArea, dateFormat } from './form_elements';
import axios from 'axios';
import Cookies from 'universal-cookie';
import moment from 'moment';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import FileDownload from 'js-file-download';

import { FilePond } from 'react-filepond';
import 'filepond/dist/filepond.min.css';

import { API_ROOT_URL } from '../client_config';
import * as mapDispatchToProps from '../actions';

const CRUISE_ROUTE = "/files/cruises";

const cookies = new Cookies();

class UpdateCruise extends Component {

  constructor (props) {
    super(props);

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

  handleFormSubmit(formProps) {
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

    this.props.updateCruise({...formProps });
    this.pond.removeFiles();
    this.props.handleFormSubmit()
  }

  async handleFileDownload(cruiseID, filename) {
    await axios.get(`${API_ROOT_URL}${CRUISE_ROUTE}/${cruiseID}/${filename}`,
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

  async handleFileDelete(cruiseID, filename) {
    await axios.delete(`${API_ROOT_URL}${CRUISE_ROUTE}/${cruiseID}/${filename}`,
    {
      headers: {
        authorization: cookies.get('token')
      }
    })
    .then(() => {
        this.props.initCruise(cruiseID)
     })
    .catch(()=>{
      console.log("JWT is invalid, logging out");
    });
  }


  copyToClipboard() {
    if(this.props.cruise.cruise_id) {
      return  (
`Cruise:          ${this.props.cruise.cruise_id}
Name:            ${(this.props.cruise.cruise_additional_meta.cruise_name) ? this.props.cruise.cruise_additional_meta.cruise_name : ""}
Description:     ${(this.props.cruise.cruise_additional_meta.cruise_description) ? this.props.cruise.cruise_additional_meta.cruise_description : ""}
Location:        ${this.props.cruise.cruise_location}
Chief Scientist: ${this.props.cruise.cruise_pi}
Vessel:          ${this.props.cruise.cruise_vessel}\n
Departure Port:  ${this.props.cruise.cruise_additional_meta.cruise_departure_location}
Start of Cruise: ${this.props.cruise.start_ts}\n
Arrival Port:    ${this.props.cruise.cruise_additional_meta.cruise_arrival_location}
End of Cruise:   ${this.props.cruise.stop_ts}\n`
      )
    }
  }

  renderFiles() {
    if(this.props.cruise.cruise_additional_meta && this.props.cruise.cruise_additional_meta.cruise_files && this.props.cruise.cruise_additional_meta.cruise_files.length > 0) {
      let files = this.props.cruise.cruise_additional_meta.cruise_files.map((file, index) => {
        return <li style={{ listStyleType: "none" }} key={`file_${index}`}><span onClick={() => this.handleFileDownload(this.props.cruise.id, file)}><FontAwesomeIcon className='text-primary' icon='download' fixedWidth /></span> <span onClick={() => this.handleFileDelete(this.props.cruise.id, file)}><FontAwesomeIcon className='text-danger' icon='trash' fixedWidth /></span><span> {file}</span></li>
      })
      return <div>{files}<br/></div>
    }
    return null
  }

  render() {

    const { handleSubmit, pristine, reset, submitting, valid } = this.props;
    const updateCruiseFormHeader = (<div>Update Cruise<span className="float-right"><OverlayTrigger placement="top" overlay={<Tooltip id="copyToClipboardTooltip">Copy Cruise to Clipboard</Tooltip>}><CopyToClipboard text={this.copyToClipboard()} ><FontAwesomeIcon icon='clipboard' fixedWidth /></CopyToClipboard></OverlayTrigger></span></div>);

    if (this.props.roles && (this.props.roles.includes("admin") || this.props.roles.includes('cruise_manager'))) {

      return (
        <Card>
          <Card.Header>{updateCruiseFormHeader}</Card.Header>
          <Card.Body>
            <Form onSubmit={ handleSubmit(this.handleFormSubmit.bind(this)) }>
              <Form.Row>
                <Field
                  name="cruise_id"
                  component={renderTextField}
                  label="Cruise ID"
                  placeholder="i.e. AT42-01"
                  required={true}
                />
                <Field
                  name="cruise_name"
                  component={renderTextField}
                  label="Cruise Name"
                  placeholder="i.e. Lost City 2018"
                />
                <Field
                  name="cruise_vessel"
                  component={renderTextField}
                  label="Vessel Name"
                  placeholder="i.e. R/V Atlantis"
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
                  label="Cruise Location"
                  placeholder="i.e. Lost City, Mid Atlantic Ridge"
                  lg={12}
                  sm={12}
                />
              </Form.Row>
              <Form.Row>
                <Field
                  name="cruise_description"
                  component={renderTextArea}
                  label="Cruise Description"
                  placeholder="i.e. A brief summary of the cruise"
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
                  label="Cruise Participants, comma delimited"
                  placeholder="i.e. Dave Butterfield,Sharon Walker"
                  rows={2}
                />
                <Field
                  name="cruise_tags"
                  component={renderTextArea}
                  label="Cruise Tags, comma delimited"
                  placeholder="i.e. coral,chemistry,engineering"
                  rows={2}
                />
              </Form.Row>
                <Form.Label>Cruise Files</Form.Label>
                {this.renderFiles()}
                <FilePond ref={ref => this.pond = ref} allowMultiple={true} 
                  maxFiles={5} 
                  server={{
                    url: API_ROOT_URL,
                    process: {
                      url: CRUISE_ROUTE + '/filepond/process/' + this.props.cruise.id,
                      headers: { authorization: cookies.get('token') },
                    },
                    load: {
                      url: CRUISE_ROUTE + '/filepond/load',
                      headers: { authorization: cookies.get('token') },
                    },
                    revert: {
                      url: CRUISE_ROUTE + '/filepond/revert',
                      headers: { authorization: cookies.get('token') },
                    }
                  }}
                >
                </FilePond>
              {renderAlert(this.props.errorMessage)}
              {renderMessage(this.props.message)}
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

function mapStateToProps(state) {

  let initialValues = { ...state.cruise.cruise }

  if (initialValues.cruise_additional_meta) {
    if (initialValues.cruise_additional_meta.cruise_name) {
      initialValues.cruise_name = initialValues.cruise_additional_meta.cruise_name
    }

    if (initialValues.cruise_additional_meta.cruise_vessel) {
      initialValues.cruise_vessel = initialValues.cruise_additional_meta.cruise_vessel
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
    validate: validate
  })
)(UpdateCruise);