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
import { API_ROOT_URL, LOWERING_ID_PLACEHOLDER, LOWERING_ID_REGEX, CUSTOM_LOWERING_NAME } from '../client_config';
import * as mapDispatchToProps from '../actions';

const dateFormat = "YYYY-MM-DD"
const timeFormat = "HH:mm"

const LOWERING_ROUTE = "/files/lowerings";

const cookies = new Cookies();

class UpdateLowering extends Component {

  constructor (props) {
    super(props);

    this.state = {
      filepondPristine: true,
      lowering_name: (CUSTOM_LOWERING_NAME)? CUSTOM_LOWERING_NAME[0].charAt(0).toUpperCase() + CUSTOM_LOWERING_NAME[0].slice(1) : "Lowering"
    }

    this.handleFileDownload = this.handleFileDownload.bind(this);
    this.handleFileDelete = this.handleFileDelete.bind(this);
    this.handleFormSubmit = this.handleFormSubmit.bind(this);
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

  handleFileDeleteModal(file) {
    this.props.showModal('deleteFile', { file: file, handleDelete: this.handleFileDelete });
  }

  async handleFormSubmit(formProps) {
    formProps.lowering_tags = (formProps.lowering_tags)? formProps.lowering_tags.map(tag => tag.trim()): [];

    if(formProps.lowering_description) {
      formProps.lowering_additional_meta.lowering_description = formProps.lowering_description
      delete formProps.lowering_description
    }

    if(this.pond) {
      formProps.lowering_additional_meta.lowering_files = this.pond.getFiles().map(file => file.serverId);
    }

    await this.props.updateLowering({...formProps});
    this.pond.removeFiles();
    this.props.handleFormSubmit()
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
    if(this.props.lowering.lowering_additional_meta && this.props.lowering.lowering_additional_meta.lowering_files && this.props.lowering.lowering_additional_meta.lowering_files.length > 0) {
      let files = this.props.lowering.lowering_additional_meta.lowering_files.map((file, index) => {
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
    const updateLoweringFormHeader = (<div>Update {this.state.lowering_name}<span className="float-right"><CopyLoweringToClipboard lowering={this.props.lowering}/></span></div>);

    if (this.props.roles && (this.props.roles.includes("admin") || this.props.roles.includes('cruise_manager'))) {

      return (
        <Card className="border-secondary">
          <Card.Header>{updateLoweringFormHeader}</Card.Header>
          <Card.Body>
            <Form onSubmit={ handleSubmit(this.handleFormSubmit.bind(this)) }>
              <Form.Row>
                <Field
                  name="lowering_id"
                  component={renderTextField}
                  label={`${this.state.lowering_name} ID`}
                  placeholder={(LOWERING_ID_PLACEHOLDER) ? LOWERING_ID_PLACEHOLDER : "i.e. ROV-0042"}
                  required={true}
                />
                <Field
                  name="lowering_location"
                  component={renderTextField}
                  label={`${this.state.lowering_name} Location`}
                  placeholder="i.e. Kelvin Seamount"
                />
              </Form.Row>
              <Form.Row>
                <Field
                  name="lowering_description"
                  component={renderTextArea}
                  label={`${this.state.lowering_name} Description`}
                  placeholder={`i.e. A brief description of the ${this.state.lowering_name.toLowerCase()}`}
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
                  required={true}
                />
              </Form.Row>
              <Form.Row>
                <Field
                  name="lowering_tags"
                  component={renderTextArea}
                  label={`${this.state.lowering_name} Tags, comma delimited`}
                  placeholder="i.e. coral,chemistry,engineering"
                  rows={2}
                />
              </Form.Row>
              <Form.Label>{this.state.lowering_name} Files</Form.Label>
              {this.renderFiles()}
              <FilePond
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
              </FilePond>
              {renderAlert(this.props.errorMessage)}
              {renderMessage(this.props.message)}
              <Button variant="warning" size="sm" onClick={this.handleSetLoweringStatsModal}>Milestones/Stats</Button>
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
    validate: validate,
    warn: warn
  })
)(UpdateLowering);