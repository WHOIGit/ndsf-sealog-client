import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { reduxForm, Field } from 'redux-form';
import { Button, Col, Form, Row} from 'react-bootstrap';
import moment from 'moment';
import Datetime from 'react-datetime';
import PropTypes from 'prop-types';
import * as mapDispatchToProps from '../actions';

const dateFormat = "YYYY-MM-DD"
const timeFormat = "HH:mm:ss.SSS"

class UpdateLoweringStatsForm extends Component {

  constructor (props) {
    super(props);
  }

  static propTypes = {
    handleFormSubmit: PropTypes.func.isRequired,
    handleHide: PropTypes.func.isRequired,
    milestones: PropTypes.object.isRequired,
    stats: PropTypes.object.isRequired
  };

  componentDidMount() {

    let initialValues = {
      start: this.props.milestones.lowering_start,
      on_bottom: (this.props.milestones.lowering_on_bottom) ? this.props.milestones.lowering_on_bottom : null,
      off_bottom: (this.props.milestones.lowering_off_bottom) ? this.props.milestones.lowering_off_bottom : null,
      stop: this.props.milestones.lowering_stop,
      max_depth: (this.props.stats.max_depth) ? this.props.stats.max_depth : null,
      bbox_north: (this.props.stats.bounding_box.length == 4) ? this.props.stats.bounding_box[0] : null,
      bbox_east: (this.props.stats.bounding_box.length == 4) ? this.props.stats.bounding_box[1] : null,
      bbox_south: (this.props.stats.bounding_box.length == 4) ? this.props.stats.bounding_box[2] : null,
      bbox_west: (this.props.stats.bounding_box.length == 4) ? this.props.stats.bounding_box[3] : null,
      origin_lat: (this.props.stats.dive_origin.length == 3) ? this.props.stats.dive_origin[0] : null,
      origin_lng: (this.props.stats.dive_origin.length == 3) ? this.props.stats.dive_origin[1] : null,
      origin_utm: (this.props.stats.dive_origin.length == 3) ? this.props.stats.dive_origin[2] : null,
    }

    this.props.initialize(initialValues);
  }

  componentWillUnmount() {
    // this.props.leaveUpdateLoweringForm();
  }

  handleFormSubmit(formProps) {

    let milestones = {
      lowering_start: (formProps.start._isAMomentObject) ? formProps.start.toISOString() : formProps.start,
      lowering_on_bottom: (formProps.on_bottom && formProps.on_bottom._isAMomentObject) ? formProps.on_bottom.toISOString() : formProps.on_bottom,
      lowering_off_bottom: (formProps.on_bottom && formProps.off_bottom._isAMomentObject) ? formProps.off_bottom.toISOString() : formProps.off_bottom,
      lowering_stop: (formProps.stop._isAMomentObject) ? formProps.stop.toISOString() : formProps.stop,
    }

    let stats= {
      max_depth: formProps.max_depth,
    }

    if((formProps.bbox_north == null || formProps.bbox_north == "") && (formProps.bbox_east == null || formProps.bbox_east == "") && (formProps.bbox_south == null || formProps.bbox_south == "") && (formProps.bbox_west == null || formProps.bbox_west == "")) {
      stats.bounding_box=[]
    }
    else {
      stats.bounding_box=[formProps.bbox_north, formProps.bbox_east, formProps.bbox_south, formProps.bbox_west]
    }

    if((formProps.origin_lat == null || formProps.origin_lat == "") || (formProps.origin_lng == null || formProps.origin_lng == "") || (formProps.origin_utm == null || formProps.origin_utm == "")) {
      stats.dive_origin=[]
    }
    else {
      stats.dive_origin=[formProps.origin_lat, formProps.origin_lng, formProps.origin_utm]
    }

    this.props.handleFormSubmit(milestones, stats)
  }

  renderTextField({ input, label, placeholder, required, meta: { touched, error } }) {
    let requiredField = (required)? <span className='text-danger'> *</span> : ''
    let placeholder_txt = (placeholder)? placeholder: label

    return (
      <Form.Group as={Row}>
        <Form.Label column sm={4} xs={5}><span className="float-right">{label}{requiredField}</span></Form.Label>
        <Col sm={8} xs={7}>
          <Form.Control size="sm" type="text" {...input} placeholder={placeholder_txt} isInvalid={touched && error}/>
          <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
        </Col>
      </Form.Group>
    )
  }

  renderDatePicker({ input, label, required, meta: { touched, error } }) {
    let requiredField = (required)? <span className='text-danger'> *</span> : ''
    
    return (
      <Form.Group as={Row}>
        <Form.Label column sm={6}>{label}{requiredField}</Form.Label>
        <Col xs={7} sm={5}>
          <Datetime {...input} inputProps={{className: "form-control form-control-sm"}} utc={true} value={input.value ? moment.utc(input.value).format(dateFormat + ' ' + timeFormat) : null} dateFormat={dateFormat} timeFormat={timeFormat} selected={input.value ? moment.utc(input.value) : null }/>
          {touched && (error && <div style={{width: "100%", marginTop: "0.25rem", fontSize: "80%"}} className='text-danger'>{error}</div>)}
        </Col>
      </Form.Group>
    )
  }

  render() {

    const { handleSubmit, submitting, valid } = this.props;

    if (this.props.roles && (this.props.roles.includes("admin") || this.props.roles.includes('cruise_manager'))) {

      return (
            <Form onSubmit={ handleSubmit(this.handleFormSubmit.bind(this)) }>
              <Row>
                <Col md={6}>
                  <Field
                    name="start"
                    component={this.renderDatePicker}
                    label="Start Date/Time (UTC)"
                    required={true}
                  />
                  <Field
                    name="on_bottom"
                    component={this.renderDatePicker}
                    label="On Bottom Date/Time (UTC)"
                  />
                  <Field
                    name="off_bottom"
                    component={this.renderDatePicker}
                    label="Off Bottom Date/Time (UTC)"
                  />
                  <Field
                    name="stop"
                    component={this.renderDatePicker}
                    label="Stop Date/Time (UTC)"
                    required={true}
                  />
                </Col>
                <Col md={6}>
                  <Row>
                    <Col xs={{span:6, offset:3}} sm={{span:6, offset:3}} md={{span:12, offset:0}} lg={{span:7, offset: 0}}>
                      <Field
                        name="max_depth"
                        component={this.renderTextField}
                        label="Max Depth"
                        placeholder="in meters"
                      />
                    </Col>
                  </Row>
                  <Row>
                    <Col xs={{span: 6, offset: 3}}>
                      <Field
                        name="bbox_north"
                        component={this.renderTextField}
                        label="North"
                        placeholder="in ddeg"
                      />
                    </Col>
                  </Row>
                  <Row>
                    <Col>
                      <Field
                        name="bbox_west"
                        component={this.renderTextField}
                        label="West"
                        placeholder="in ddeg"
                      />
                    </Col>
                    <Col>
                      <Field
                        name="bbox_east"
                        component={this.renderTextField}
                        label="East"
                        placeholder="in ddeg"
                      />
                    </Col>
                  </Row>
                  <Row>
                    <Col xs={{span: 6, offset: 3}}>
                      <Field
                        name="bbox_south"
                        component={this.renderTextField}
                        label="South"
                        placeholder="in ddeg"
                      />
                    </Col>
                  </Row>
                  <Row>
                    <Col xs={12}>
                      <span>Origin:</span>
                    </Col>
                    <Col xs={{span:6, offset:3}} sm={{span:6, offset:3}} md={{span:12, offset:0}} lg={{span:7, offset: 0}}>
                      <Field
                        name="origin_lat"
                        component={this.renderTextField}
                        label="Latitude"
                        placeholder="in ddeg"
                      />
                    </Col>
                    <Col xs={{span:6, offset:3}} sm={{span:6, offset:3}} md={{span:12, offset:0}} lg={{span:7, offset: 0}}>
                      <Field
                        name="origin_lng"
                        component={this.renderTextField}
                        label="Longitude"
                        placeholder="in ddeg"
                      />
                    </Col>
                    <Col xs={{span:6, offset:3}} sm={{span:6, offset:3}} md={{span:12, offset:0}} lg={{span:7, offset: 0}}>
                      <Field
                        name="origin_utm"
                        component={this.renderTextField}
                        label="UTM Zone"
                      />
                    </Col>
                  </Row>
                </Col>
              </Row>
              <Row>
                <Col xs={12}>
                  <div className="float-right">
                    <Button variant="secondary" size="sm" onClick={this.props.handleHide}>Cancel</Button>
                    <Button variant="warning" size="sm" type="submit" disabled={submitting || !valid}>Done</Button>
                  </div>
                </Col>
              </Row>
            </Form>
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

  if (formProps.start === '') {
    errors.start = 'Required'
  } else if (!moment.utc(formProps.start).isValid()) {
    errors.start = 'Invalid timestamp'
  }

  if (formProps.stop === '') {
    errors.stop = 'Required'
  } else if (!moment.utc(formProps.stop).isValid()) {
    errors.stop = 'Invalid timestamp'
  }

  if ((formProps.start !== '') && (formProps.stop !== '')) {
    if(moment(formProps.stop, dateFormat + " " + timeFormat).isBefore(moment(formProps.start, dateFormat + " " + timeFormat))) {
      errors.stop = 'Stop date must be later than start data'
    }
  }

  if ((formProps.on_bottom === '') && (formProps.off_bottom !== '')) {
    errors.on_bottom = 'Required if Off Bottom specified'
  } else if ((formProps.on_bottom !== '') && !moment.utc(formProps.on_bottom).isValid()) {
    errors.on_bottom = 'Invalid timestamp'
  }

  if ((formProps.off_bottom === '') && (formProps.on_bottom !== '')) {
    errors.off_bottom = 'Required if On Bottom specified'
  } else if ((formProps.off_bottom !== '') && !moment.utc(formProps.off_bottom).isValid()) {
    errors.off_bottom = 'Invalid timestamp'
  }

  if (!(formProps.max_depth >= 0)) {
    errors.max_depth = 'Must be a positive floating point number'
  }

  if (!(formProps.bbox_north >= -60 && formProps.bbox_north <= 60)) {
    errors.bbox_north = 'Must be a number between +/- 60'
  }

  if (!(formProps.bbox_east >= -180 && formProps.bbox_east <= 180)) {
    errors.bbox_east = 'Must be a number between +/- 180'
  }

  if (!(formProps.bbox_south >= -60 && formProps.bbox_south <= 60)) {
    errors.bbox_south = 'Must be a number between +/- 60'
  }

  if (!(formProps.bbox_west >= -180 && formProps.bbox_west <= 180)) {
    errors.bbox_west = 'Must be a number between +/- 180'
  }

  if (!(formProps.origin_lat >= -60 && formProps.origin_lat <= 60)) {
    errors.origin_lat = 'Must be a number between +/- 60'
  }

  if (!(formProps.origin_lng >= -180 && formProps.origin_lng <= 180)) {
    errors.origin_lng = 'Must be a number between +/- 180'
  }

  if (!(formProps.origin_lng >= -180 && formProps.origin_lng <= 180)) {
    errors.origin_lng = 'Must be a number between +/- 180'
  }

  if (!(formProps.origin_utm >= 0 && formProps.origin_utm <= 60)) {
    errors.origin_utm = 'Must be a number between 0 and 60'
  }

  return errors;

}

function mapStateToProps(state) {
  return {
    roles: state.user.profile.roles
  };
}

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  reduxForm({
    form: 'editLoweringStats',
    validate: validate
  })
)(UpdateLoweringStatsForm);