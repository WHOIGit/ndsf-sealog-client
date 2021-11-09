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
import { API_ROOT_URL, CRUISE_ID_PLACEHOLDER, CRUISE_ID_REGEX } from '../client_config';
import * as mapDispatchToProps from '../actions';
import { _Cruise_ } from '../vocab';

const CRUISE_ROUTE = "/files/cruises";

const cookies = new Cookies();


class CruiseEditorForm extends Component {
  constructor (props) {
    super(props);

    this.state = {
      filepondPristine: true,
    };

    this.handleFileDownload = this.handleFileDownload.bind(this);
    this.handleFileDelete = this.handleFileDelete.bind(this);
  }

  static propTypes = {
    afterFormSubmit: PropTypes.func.isRequired,
    cruise: PropTypes.object,
  };

  get isEdit() {
    return (this.props.cruise !== null);
  }

  get isCreate() {
    return !this.isEdit;
  }

  componentDidMount() {
    if(this.isEdit) {
      this.props.initCruise(this.props.cruise.id);
    }
  }

  componentWillUnmount() {
    this.props.leaveUpdateCruiseForm();
  }

  handleFileDeleteModal(file) {
    this.props.showModal('deleteFile', { file: file, handleDelete: this.handleFileDelete });
  }

  async handleFormSubmit(formProps) {
    // This avoids overwriting any metadata fields that were returned by the API
    // but aren't displayed in the UI.
    if (this.isCreate) {
      formProps.cruise_additional_meta = {};
    }

    // Put fields that belong under cruise_additional_meta back there
    const additional_meta_fields = [
      "cruise_arrival_location",
      "cruise_departure_location",
      "cruise_description",
      "cruise_participants",
      "cruise_pi",
      "cruise_name",
      "cruise_vessel",
    ];

    for (const field of additional_meta_fields) {
      if (formProps[field]) {
        formProps.cruise_additional_meta[field] = formProps[field];
        delete formProps[field];
      }
    }

    // Move the start timestamp to the end of the day
    if (formProps.stop_ts) {
      const end_of_stop_ts = moment(formProps.stop_ts);
      end_of_stop_ts.set({
        hour:   23,
        minute: 59,
        second: 59
      });

      formProps.stop_ts = end_of_stop_ts.toISOString();
    }

    // Trim whitespace from list elements
    formProps.cruise_tags =
      (formProps.cruise_tags || []).map(item => item.trim());
    formProps.cruise_additional_meta.cruise_participants =
      (formProps.cruise_additional_meta.cruise_participants || [])
      .map(item => item.trim());

    // Associate uploaded files with this cruise
    if (this.isEdit) {
      formProps.cruise_additional_meta.cruise_files =
        this.pond.getFiles().map(file => file.serverId);
    }

    // Submit the form
    if (this.isCreate) {
      this.props.createCruise(formProps);
    } else {
      await this.props.updateCruise({...formProps });
      this.pond.removeFiles();  // clears pond contents
    }

    // Notify parent that we have finished submitting the form
    this.props.afterFormSubmit();
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
    if(!this.isEdit)
      return null;

    let files = (this.props.cruise.cruise_additional_meta.cruise_files || [])
      .map((file, index) => {
        return (
          <div className="pl-2" key={`file_${index}`}>
            <a className="text-decoration-none" href="#"
             onClick={() => this.handleFileDownload(file)}>
               {file}
            </a>
            <FontAwesomeIcon
             onClick={() => this.handleFileDeleteModal(file) }
             className='text-danger' icon='trash' fixedWidth
            />
          </div>
        );
    });

    return (
      <React.Fragment>
        <Form.Label>{_Cruise_} Files</Form.Label>
        <div className="mb-2">
          {files}
        </div>
        {this.renderFilepond()}
      </React.Fragment>
    );
  }

  renderFilepond() {
    if(!this.isEdit)
      return null;

    return (<FilePond
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
    </FilePond>);
  }

  get canEditCruise() {
    return (this.props.roles &&
      (this.props.roles.includes("admin") ||
       this.props.roles.includes("cruise_manager")));
  }

  render() {
    if (!this.canEditCruise)
      return null;

    const { handleSubmit, pristine, reset, submitting, valid } = this.props;

    return (
      <Form onSubmit={ handleSubmit(this.handleFormSubmit.bind(this)) }>
        <Form.Row>
          <Field
            name="cruise_id"
            component={renderTextField}
            label={`${_Cruise_} ID`}
            placeholder={CRUISE_ID_PLACEHOLDER || "e.g., CS2001"}
            required={true}
          />
          <Field
            name="cruise_name"
            component={renderTextField}
            label={`${_Cruise_} Name`}
            placeholder="e.g., Lost City 2018"
          />
          <Field
            name="cruise_vessel"
            component={renderTextField}
            label="Vessel Name"
            placeholder="e.g., R/V Discovery"
            required={true}
          />
          <Field
            name="cruise_pi"
            component={renderTextField}
            label="Primary Investigator"
            placeholder="e.g., Dr. Susan Lang"
            required={true}
          />
          <Field
            name="cruise_location"
            component={renderTextField}
            label={`${_Cruise_} Location`}
            placeholder="e.g., Lost City, Mid Atlantic Ridge"
            lg={12}
            sm={12}
          />
        </Form.Row>
        <Form.Row>
          <Field
            name="cruise_description"
            component={renderTextArea}
            label={`${_Cruise_} Description`}
            placeholder={`e.g., A brief description of the ${_Cruise_.toLowerCase()}`}
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
              placeholder="e.g., Norfolk, VA"
              required={true}
            />
            <Field
              name="cruise_arrival_location"
              component={renderTextField}
              label="Arrival Port"
              placeholder="e.g., St. George's, Bermuda"
              required={true}
            />
        </Form.Row>
        <Form.Row>
          <Field
            name="cruise_participants"
            component={renderTextArea}
            label={`${_Cruise_} Participants, comma delimited`}
            placeholder="e.g., Dave Butterfield,Sharon Walker"
            rows={2}
          />
          <Field
            name="cruise_tags"
            component={renderTextArea}
            label={`${_Cruise_} Tags, comma delimited`}
            placeholder="e.g., coral,chemistry,engineering"
            rows={2}
          />
        </Form.Row>
        {this.renderFiles()}
        {renderAlert(this.props.errorMessage)}
        {renderMessage(this.props.message)}
        <div className="float-right">
          <Button className="mr-1" variant="secondary" size="sm" disabled={pristine || submitting} onClick={reset}>Reset Values</Button>
          <Button variant="primary" size="sm" type="submit" disabled={(submitting || !valid || pristine) && this.state.filepondPristine}>
            {this.isCreate ? "Create" : "Update"}
          </Button>
        </div>
      </Form>
    );
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
  return {
    errorMessage: state.cruise.cruise_error,
    message: state.cruise.cruise_message,
    roles: state.user.profile.roles,
  };
}

CruiseEditorForm = compose(
  connect(mapStateToProps, mapDispatchToProps),
  reduxForm({
    form: 'editCruise',
    enableReinitialize: true,
    validate: validate,
    warn: warn
  })
)(CruiseEditorForm);


class CruiseEditor extends Component {
  constructor (props) {
    super(props);
    this.state = { };
  }

  static propTypes = {
    afterFormSubmit: PropTypes.func.isRequired,
    cruise: PropTypes.object,
  };

  get isEdit() {
    return (this.props.cruise !== null);
  }

  get isCreate() {
    return !this.isEdit;
  }

  getInitialValues() {
    if (this.isCreate)
      return {};

    // Merge keys to top level so they map to form field names
    return {
      ...this.props.cruise,
      ...this.props.cruise.cruise_additional_meta,
    };
  }

  render () {
    let formHeader;
    if (this.isEdit) {
      formHeader = (<div>Update {_Cruise_}<span className="float-right"><CopyCruiseToClipboard cruise={this.props.cruise}/></span></div>);
    } else {
      formHeader = (<div>Create New {_Cruise_}</div>);
    }

    return (
      <Card className="border-secondary">
        <Card.Header>{formHeader}</Card.Header>
        <Card.Body>
          <CruiseEditorForm
            afterFormSubmit={ this.props.afterFormSubmit }
            cruise={ this.props.cruise }
            initialValues={ this.getInitialValues() }
          />
        </Card.Body>
      </Card>
    );
  }
}

export default CruiseEditor;
