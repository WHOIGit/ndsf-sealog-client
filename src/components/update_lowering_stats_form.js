import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { reduxForm, Field } from 'redux-form';
import { Button, Col, Form, Row} from 'react-bootstrap';
import { renderDateTimePicker, renderTextField, dateFormat } from './form_elements';
import moment from 'moment';
import PropTypes from 'prop-types';
import * as mapDispatchToProps from '../actions';

const timeFormat = "HH:mm:ss.SSS";

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
      bbox_west: (this.props.stats.bounding_box.length == 4) ? this.props.stats.bounding_box[3] : null
    }

    this.props.initialize(initialValues);
  }

  componentWillUnmount() {
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

  render() {

    const { handleSubmit, submitting, valid, pristine } = this.props;

    if (this.props.roles && (this.props.roles.includes("admin") || this.props.roles.includes('cruise_manager'))) {

      return (
            <Form onSubmit={ handleSubmit(this.handleFormSubmit.bind(this)) }>
              <Row>
                <Col md={6}>
                  <Field
                    name="start"
                    component={renderDateTimePicker}
                    label="Start Date/Time (UTC)"
                    timeFormat={timeFormat}
                    required={true}
                    sm={12}
                  />
                  <Field
                    name="on_bottom"
                    component={renderDateTimePicker}
                    label="On Bottom Date/Time (UTC)"
                    timeFormat={timeFormat}
                    sm={12}
                  />
                  <Field
                    name="off_bottom"
                    component={renderDateTimePicker}
                    label="Off Bottom Date/Time (UTC)"
                    timeFormat={timeFormat}
                    sm={12}
                  />
                  <Field
                    name="stop"
                    component={renderDateTimePicker}
                    label="Stop Date/Time (UTC)"
                    required={true}
                    timeFormat={timeFormat}
                    sm={12}
                  />
                </Col>
                <Col md={6}>
                  <Row>
                    <Col xs={{span:6, offset:3}} sm={{span:6, offset:3}} md={{span:12, offset:0}} lg={{span:7, offset: 0}}>
                      <Field
                        name="max_depth"
                        component={renderTextField}
                        label="Max Depth"
                        placeholder="in meters"
                        lg={12}
                        sm={12}
                      />
                    </Col>
                  </Row>
                  <Row>
                    <Col xs={{span: 6, offset: 3}}>
                      <Field
                        name="bbox_north"
                        component={renderTextField}
                        label="North"
                        placeholder="in ddeg"
                        lg={12}
                        sm={12}
                      />
                    </Col>
                  </Row>
                  <Row>
                    <Col>
                      <Field
                        name="bbox_west"
                        component={renderTextField}
                        label="West"
                        placeholder="in ddeg"
                        lg={12}
                        sm={12}
                      />
                    </Col>
                    <Col>
                      <Field
                        name="bbox_east"
                        component={renderTextField}
                        label="East"
                        placeholder="in ddeg"
                        lg={12}
                        sm={12}
                      />
                    </Col>
                  </Row>
                  <Row>
                    <Col xs={{span: 6, offset: 3}}>
                      <Field
                        name="bbox_south"
                        component={renderTextField}
                        label="South"
                        placeholder="in ddeg"
                        lg={12}
                        sm={12}
                      />
                    </Col>
                  </Row>
                </Col>
              </Row>
              <Row>
                <Col xs={12}>
                  <div className="float-right">
                    <Button variant="secondary" size="sm" onClick={this.props.handleHide}>Cancel</Button>
                    <Button variant="warning" size="sm" type="submit" disabled={pristine || submitting || !valid}>Done</Button>
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
    if(moment.utc(formProps.stop, dateFormat + " " + timeFormat).isBefore(moment.utc(formProps.start, dateFormat + " " + timeFormat))) {
      errors.stop = 'Stop date must be later than start date'
    }
  }

  if(formProps.off_bottom && formProps.off_bottom !== '' && moment.utc(formProps.stop, dateFormat + " " + timeFormat).isBefore(moment.utc(formProps.off_bottom, dateFormat + " " + timeFormat))) {
    errors.off_bottom = 'Off bottom date must be before stop date';
  }

  if(formProps.on_bottom && formProps.on_bottom !== '' && moment.utc(formProps.on_bottom, dateFormat + " " + timeFormat).isBefore(moment.utc(formProps.start, dateFormat + " " + timeFormat))) {
    errors.on_bottom = 'On bottom date must be after start date';
  }

  if (formProps.on_bottom && formProps.on_bottom !== '' && formProps.off_bottom && formProps.off_bottom !== '') {
    if(moment.utc(formProps.off_bottom, dateFormat + " " + timeFormat).isBefore(moment.utc(formProps.on_bottom, dateFormat + " " + timeFormat))) {
      errors.on_bottom = 'Off bottom date must be later than on bottom date';
      errors.off_bottom = 'Off bottom date must be later than on bottom date';
    }
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