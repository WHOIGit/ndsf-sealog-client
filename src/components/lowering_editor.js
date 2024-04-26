// TODO
// LoweringEditor and CruiseEditor share a lot of common code. It would be
// worthwhile to factor out commonal functionality.

import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { reduxForm, Field } from 'redux-form';
import { Button, Card, Form } from 'react-bootstrap';
import { renderAlert, renderDateTimePicker, renderMessage, renderTextField, renderTextArea } from './form_elements';
import axios from 'axios';
import Cookies from 'universal-cookie';
import moment from 'moment';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import FileDownload from 'js-file-download';
import { FilePond } from 'react-filepond';
import CopyLoweringToClipboard from './copy_lowering_to_clipboard';
import { API_ROOT_URL, CUSTOM_LOWERING_METADATA_FIELDS, LOWERING_ID_PLACEHOLDER, LOWERING_ID_REGEX } from 'client_config';
import * as mapDispatchToProps from '../actions';
import { _Lowering_, _lowering_ } from '../vocab';

const dateFormat = "YYYY-MM-DD";
const timeFormat = "HH:mm";

const LOWERING_ROUTE = "/files/lowerings";

const cookies = new Cookies();

class LoweringEditorForm extends Component {
  constructor (props) {
    super(props);

    this.state = {
      filepondPristine: true,
    };

    this.handleFileDownload = this.handleFileDownload.bind(this);
    this.handleFileDelete = this.handleFileDelete.bind(this);
    this.handleFormSubmit = this.handleFormSubmit.bind(this);
    this.handleSetLoweringStatsModal = this.handleSetLoweringStatsModal.bind(this);
  }

  static propTypes = {
    afterFormSubmit: PropTypes.func.isRequired,
    lowering: PropTypes.object,
  };

  get isEdit() {
    return (this.props.lowering !== null);
  }

  get isCreate() {
    return !this.isEdit;
  }

  componentDidMount() {
    if(this.isEdit) {
      this.props.initLowering(this.props.lowering.id);
    }
  }

  componentWillUnmount() {
    this.props.leaveUpdateLoweringForm();
  }

  handleFileDeleteModal(file) {
    this.props.showModal('deleteFile', { file: file, handleDelete: this.handleFileDelete });
  }

  async handleFormSubmit(formProps) {
    // This avoids overwriting any metadata fields that were returned by the API
    // but aren't displayed in the UI.
    if (this.isCreate) {
      formProps.lowering_additional_meta = {};
    }

    // Put fields that belong under lowering_additional_meta back there
    const additional_meta_fields = [
      "lowering_description",
      ...CUSTOM_LOWERING_METADATA_FIELDS.map((field) => field.name),
    ];

    for (const field of additional_meta_fields) {
      if (formProps[field]) {
        formProps.lowering_additional_meta[field] = formProps[field];
        delete formProps[field];
      }
    }

    // Trim whitespace from list elements
    formProps.lowering_tags =
      (formProps.lowering_tags || []).map(item => item.trim());

    if(this.pond) {
      formProps.lowering_additional_meta.lowering_files = this.pond.getFiles().map(file => file.serverId);
    }

    // Submit the form
    if (this.isCreate) {
      this.props.createLowering(formProps);
    } else {
      await this.props.updateLowering({...formProps });
      this.pond.removeFiles();  // clears pond contents
    }

    // Notify parent that we have finished submitting the form
    this.props.afterFormSubmit();
  }

  async handleFileDownload(filename) {
    await axios.get(`${API_ROOT_URL}${LOWERING_ROUTE}/${this.props.lowering.id}/${filename}`,
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
    await axios.delete(`${API_ROOT_URL}${LOWERING_ROUTE}/${this.props.lowering.id}/${filename}`,
    {
      headers: {
        authorization: cookies.get('token')
      }
    })
    .then(() => {
        this.props.initLowering(this.props.lowering.id)
     })
    .catch(()=>{
      console.log("JWT is invalid, logging out");
    });
  }

  handleSetLoweringStatsModal() {
    this.props.showModal('setLoweringStats', { lowering: this.props.lowering, handleUpdateLowering: this.handleFormSubmit });
  }

  renderFiles() {
    if(!this.isEdit)
      return null;

    let files = this.props.lowering.lowering_additional_meta.lowering_files.map((file, index) => {
      return <div className="pl-2" key={`file_${index}`}><a className="text-decoration-none" href="#"  onClick={() => this.handleFileDownload(file)}>{file}</a> <FontAwesomeIcon onClick={() => this.handleFileDeleteModal(file)} className='text-danger' icon='trash' fixedWidth /></div>
    });

    return (
      <React.Fragment>
        <Form.Label>{_Lowering_} Files</Form.Label>
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
          url: LOWERING_ROUTE + '/filepond/process/' + this.props.lowering.id,
          headers: { authorization: cookies.get('token') },
        },
        revert: {
          url: LOWERING_ROUTE + '/filepond/revert',
          headers: { authorization: cookies.get('token') },
        }
      }}
      onupdatefiles={() => {
        this.setState({ filepondPristine: false });
      }}
    >
    </FilePond>);
  }

  renderMilestonesAndStatsButton() {
    if(!this.isEdit)
      return null;
    
    return (
      <Button variant="warning" size="sm" onClick={this.handleSetLoweringStatsModal}>Milestones/Stats</Button>
    );
  }

  renderCustomFields() {
    return CUSTOM_LOWERING_METADATA_FIELDS.map((field) => {
      return (
        <Form.Row key={field.name}>
          <Field
            name={field.name}
            component={renderTextField}
            label={field.label}
            placeholder={field.placeholder || ""}
            required={field.required || false}
          />
        </Form.Row>
      );
    });
  }

  get canEditLowering() {
    return (this.props.roles &&
      (this.props.roles.includes("admin") ||
       this.props.roles.includes("cruise_manager")));
  }

  render() {
    if (!this.canEditLowering)
      return null;

    const { handleSubmit, pristine, reset, submitting, valid } = this.props;

    return (
      <Form onSubmit={ handleSubmit(this.handleFormSubmit.bind(this)) }>
        <Form.Row>
          <Field
            name="lowering_id"
            component={renderTextField}
            label={`${_Lowering_} ID`}
            placeholder={LOWERING_ID_PLACEHOLDER || "e.g., ROV-0042"}
            required={true}
          />
          <Field
            name="lowering_location"
            component={renderTextField}
            label={`${_Lowering_} Location`}
            placeholder="e.g., Kelvin Seamount"
          />
        </Form.Row>
        <Form.Row>
          <Field
            name="lowering_description"
            component={renderTextArea}
            label={`${_Lowering_} Description`}
            placeholder={`e.g., A brief description of the ${_lowering_}`}
            rows={8}
          />
        </Form.Row>
        <Form.Row>
          <Field
            name="start_ts"
            component={renderDateTimePicker}
            label="Start Date/Time (UTC)"
            required={true}
          />
          <Field
            name="stop_ts"
            component={renderDateTimePicker}
            label="Stop Date/Time (UTC)"
            required={false}
          />
        </Form.Row>
        {this.renderCustomFields()}
        <Form.Row>
          <Field
            name="lowering_tags"
            component={renderTextArea}
            label={`${_Lowering_} Tags, comma delimited`}
            placeholder="e.g., coral,chemistry,engineering"
            rows={2}
          />
        </Form.Row>
        {this.renderFiles()}
        {renderAlert(this.props.errorMessage)}
        {renderMessage(this.props.message)}
        <div>
          {this.renderMilestonesAndStatsButton()}
          <span className="float-right">
            <Button className="mr-1" variant="secondary" size="sm" disabled={pristine || submitting} onClick={reset}>Reset Values</Button>
            <Button variant="primary" size="sm" type="submit" disabled={(submitting || !valid || pristine) && this.state.filepondPristine}>
              {this.isCreate ? "Create" : "Update"}
            </Button>
          </span>
        </div>
      </Form>
    );
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
    if(moment.utc(formProps.stop_ts, dateFormat + " " + timeFormat).isBefore(moment.utc(formProps.start_ts, dateFormat + " " + timeFormat))) {
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

function warn(formProps) {
  const warnings = {}

  if (formProps.lowering_id && LOWERING_ID_REGEX != null && !formProps.lowering_id.match(LOWERING_ID_REGEX)) {
    warnings.lowering_id = 'Non-standard ID';
  }

  return warnings;
}

function mapStateToProps(state) {
  return {
    errorMessage: state.lowering.lowering_error,
    message: state.lowering.lowering_message,
    roles: state.user.profile.roles
  };
}

LoweringEditorForm = compose(
  connect(mapStateToProps, mapDispatchToProps),
  reduxForm({
    form: 'editLowering',
    enableReinitialize: true,
    validate: validate,
    warn: warn
  })
)(LoweringEditorForm);


class LoweringEditor extends Component {
  constructor (props) {
    super(props);

    this.state = { };
  }

  static propTypes = {
    afterFormSubmit: PropTypes.func.isRequired,
    lowering: PropTypes.object,
  };

  get isEdit() {
    return (this.props.lowering !== null);
  }

  get isCreate() {
    return !this.isEdit;
  }

  getInitialValues() {
    if (this.isCreate)
      return {};

    // Merge keys to top level so they map to form field names
    return {
      ...this.props.lowering,
      ...this.props.lowering.lowering_additional_meta,
    };
  }

  render () {
    let formHeader;
    if (this.isEdit) {
      formHeader = (<div>Update {_Lowering_}<span className="float-right"><CopyLoweringToClipboard cruise={this.props.lowering}/></span></div>);
    } else {
      formHeader = (<div>Create New {_Lowering_}</div>);
    }

    return (
      <Card className="border-secondary">
        <Card.Header>{formHeader}</Card.Header>
        <Card.Body>
          <LoweringEditorForm
            afterFormSubmit={ this.props.afterFormSubmit }
            lowering={ this.props.lowering }
            initialValues={ this.getInitialValues() }
          />
        </Card.Body>
      </Card>
    );
  }
}

export default LoweringEditor;