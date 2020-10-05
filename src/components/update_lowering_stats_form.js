import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { reduxForm, Field } from 'redux-form';
import { Button, Col, Form, Row} from 'react-bootstrap';
import { renderDateTimePicker, renderTextField, renderTextArea, dateFormat } from './form_elements';
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
      hatch_secured: (this.props.milestones.lowering_hatch_secured) ? this.props.milestones.lowering_hatch_secured : null,
      off_deck: (this.props.milestones.lowering_off_deck) ? this.props.milestones.lowering_off_deck : null,
      in_water: (this.props.milestones.lowering_in_water) ? this.props.milestones.lowering_in_water : null,
      vents_open: (this.props.milestones.lowering_vents_open) ? this.props.milestones.lowering_vents_open : null,
      sub_surface: (this.props.milestones.lowering_sub_surface) ? this.props.milestones.lowering_sub_surface : null,
      vents_secured: (this.props.milestones.lowering_vents_secured) ? this.props.milestones.lowering_vents_secured : null,
      on_bottom: (this.props.milestones.lowering_on_bottom) ? this.props.milestones.lowering_on_bottom : null,
      clear_to_ascend: (this.props.milestones.lowering_clear_to_ascend) ? this.props.milestones.lowering_clear_to_ascend : null,
      off_bottom: (this.props.milestones.lowering_off_bottom) ? this.props.milestones.lowering_off_bottom : null,
      holding_50m: (this.props.milestones.lowering_holding_50m) ? this.props.milestones.lowering_holding_50m : null,
      clear_to_surface: (this.props.milestones.lowering_clear_to_surface) ? this.props.milestones.lowering_clear_to_surface : null,
      on_surface: (this.props.milestones.lowering_on_surface) ? this.props.milestones.lowering_on_surface : null,
      tanks_blown: (this.props.milestones.lowering_tanks_blown) ? this.props.milestones.lowering_tanks_blown : null,
      on_tow: (this.props.milestones.lowering_on_tow) ? this.props.milestones.lowering_on_tow : null,
      lift_attached: (this.props.milestones.lowering_lift_attached) ? this.props.milestones.lowering_lift_attached : null,
      stop: this.props.milestones.lowering_stop,
      aborted: (this.props.milestones.lowering_aborted) ? this.props.milestones.lowering_aborted : null,

      // start: this.props.milestones.lowering_start,
      // off_deck: (this.props.milestones.lowering_off_deck) ? this.props.milestones.lowering_off_deck : null,
      // descending: (this.props.milestones.lowering_descending) ? this.props.milestones.lowering_descending : null,
      // on_bottom: (this.props.milestones.lowering_on_bottom) ? this.props.milestones.lowering_on_bottom : null,
      // off_bottom: (this.props.milestones.lowering_off_bottom) ? this.props.milestones.lowering_off_bottom : null,
      // on_surface: (this.props.milestones.lowering_on_surface) ? this.props.milestones.lowering_on_surface : null,
      // stop: this.props.milestones.lowering_stop,
      
      surface_conditions: (this.props.stats.surface_conditions) ? this.props.stats.surface_conditions : null,
      subsea_conditions: (this.props.stats.subsea_conditions) ? this.props.stats.subsea_conditions : null,
      // recovery_surface_conditions: (this.props.stats.recovery_surface_conditions) ? this.props.stats.recovery_surface_conditions : null,
      // recovery_subsea_currents: (this.props.stats.recovery_subsea_currents) ? this.props.stats.recovery_subsea_currents : null,

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
      lowering_hatch_secured: (formProps.hatch_secured && formProps.hatch_secured._isAMomentObject) ? formProps.hatch_secured.toISOString(): formProps.hatch_secured,
      lowering_off_deck: (formProps.off_deck && formProps.off_deck._isAMomentObject) ? formProps.off_deck.toISOString(): formProps.off_deck,
      lowering_in_water: (formProps.in_water && formProps.in_water._isAMomentObject) ? formProps.in_water.toISOString(): formProps.in_water,
      lowering_vents_open: (formProps.vents_open && formProps.vents_open._isAMomentObject) ? formProps.vents_open.toISOString(): formProps.vents_open,
      lowering_sub_surface: (formProps.sub_surface && formProps.sub_surface._isAMomentObject) ? formProps.sub_surface.toISOString(): formProps.sub_surface,
      lowering_vents_secured: (formProps.vents_secured && formProps.vents_secured._isAMomentObject) ? formProps.vents_secured.toISOString(): formProps.vents_secured,
      lowering_on_bottom: (formProps.on_bottom && formProps.on_bottom._isAMomentObject) ? formProps.on_bottom.toISOString(): formProps.on_bottom,
      lowering_clear_to_ascend: (formProps.clear_to_ascend && formProps.clear_to_ascend._isAMomentObject) ? formProps.clear_to_ascend.toISOString(): formProps.clear_to_ascend,
      lowering_off_bottom: (formProps.off_bottom && formProps.off_bottom._isAMomentObject) ? formProps.off_bottom.toISOString(): formProps.off_bottom,
      lowering_holding_50m: (formProps.holding_50m && formProps.holding_50m._isAMomentObject) ? formProps.holding_50m.toISOString(): formProps.holding_50m,
      lowering_clear_to_surface: (formProps.clear_to_surface && formProps.clear_to_surface._isAMomentObject) ? formProps.clear_to_surface.toISOString(): formProps.clear_to_surface,
      lowering_on_surface: (formProps.on_surface && formProps.on_surface._isAMomentObject) ? formProps.on_surface.toISOString(): formProps.on_surface,
      lowering_tanks_blown: (formProps.tanks_blown && formProps.tanks_blown._isAMomentObject) ? formProps.tanks_blown.toISOString(): formProps.tanks_blown,
      lowering_on_tow: (formProps.on_tow && formProps.on_tow._isAMomentObject) ? formProps.on_tow.toISOString(): formProps.on_tow,
      lowering_lift_attached: (formProps.lift_attached && formProps.lift_attached._isAMomentObject) ? formProps.lift_attached.toISOString(): formProps.lift_attached,
      lowering_stop: (formProps.stop._isAMomentObject) ? formProps.stop.toISOString() : formProps.stop,
      lowering_aborted: (formProps.aborted && formProps.aborted._isAMomentObject) ? formProps.aborted.toISOString(): formProps.aborted,

      // lowering_start: (formProps.start._isAMomentObject) ? formProps.start.toISOString() : formProps.start,
      // lowering_off_deck: (formProps.off_deck && formProps.off_deck._isAMomentObject) ? formProps.off_deck.toISOString() : formProps.off_deck,
      // lowering_descending: (formProps.descending && formProps.descending._isAMomentObject) ? formProps.descending.toISOString() : formProps.descending,
      // lowering_on_bottom: (formProps.on_bottom && formProps.on_bottom._isAMomentObject) ? formProps.on_bottom.toISOString() : formProps.on_bottom,
      // lowering_off_bottom: (formProps.on_bottom && formProps.off_bottom._isAMomentObject) ? formProps.off_bottom.toISOString() : formProps.off_bottom,
      // lowering_on_surface: (formProps.on_surface && formProps.on_surface._isAMomentObject) ? formProps.on_surface.toISOString() : formProps.on_surface,
      // lowering_stop: (formProps.stop._isAMomentObject) ? formProps.stop.toISOString() : formProps.stop,
    }

    let stats= {
      surface_conditions: formProps.surface_conditions,
      subsea_conditions: formProps.subsea_conditions,
      // recovery_surface_conditions: formProps.recovery_surface_conditions,
      // recovery_subsea_currents: formProps.recovery_subsea_currents,
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
                <Col className="px-1" sm={6}>
                  <Form.Row className="justify-content-sm-center">
                    <Field
                      name="start"
                      component={renderDateTimePicker}
                      label="Start Date/Time (UTC)"
                      timeFormat={timeFormat}
                      required={true}
                      sm={11}
                      md={11}
                      lg={7}
                    />
                  </Form.Row>
                  <Form.Row className="justify-content-sm-center">  
                    <Field
                      name="hatch_secured"
                      component={renderDateTimePicker}
                      label="Hatch Secured Date/Time (UTC)"
                      timeFormat={timeFormat}
                      sm={11}
                      md={11}
                      lg={7}
                    />
                  </Form.Row>
                  <Form.Row className="justify-content-sm-center">  
                    <Field
                      name="off_deck"
                      component={renderDateTimePicker}
                      label="Off Deck Date/Time (UTC)"
                      timeFormat={timeFormat}
                      sm={11}
                      md={11}
                      lg={7}
                    />
                  </Form.Row>
                  <Form.Row className="justify-content-sm-center">  
                    <Field
                      name="in_water"
                      component={renderDateTimePicker}
                      label="In Water Date/Time (UTC)"
                      timeFormat={timeFormat}
                      sm={11}
                      md={11}
                      lg={7}
                    />
                  </Form.Row>
                  <Form.Row className="justify-content-sm-center">  
                    <Field
                      name="vents_open"
                      component={renderDateTimePicker}
                      label="Vents Open Date/Time (UTC)"
                      timeFormat={timeFormat}
                      sm={11}
                      md={11}
                      lg={7}
                    />
                  </Form.Row>
                  <Form.Row className="justify-content-sm-center">  
                    <Field
                      name="sub_surface"
                      component={renderDateTimePicker}
                      label="Sub-surface Date/Time (UTC)"
                      timeFormat={timeFormat}
                      sm={11}
                      md={11}
                      lg={7}
                    />
                  </Form.Row>
                  <Form.Row className="justify-content-sm-center">  
                    <Field
                      name="vents_secured"
                      component={renderDateTimePicker}
                      label="Vents Secured Date/Time (UTC)"
                      timeFormat={timeFormat}
                      sm={11}
                      md={11}
                      lg={7}
                    />
                  </Form.Row>
                  <Form.Row className="justify-content-sm-center">  
                    <Field
                      name="on_bottom"
                      component={renderDateTimePicker}
                      label="On Bottom Date/Time (UTC)"
                      timeFormat={timeFormat}
                      sm={11}
                      md={11}
                      lg={7}
                    />
                  </Form.Row>
                  <Form.Row className="justify-content-sm-center">  
                    <Field
                      name="clear_to_ascend"
                      component={renderDateTimePicker}
                      label="Clear to Ascend Date/Time (UTC)"
                      timeFormat={timeFormat}
                      sm={11}
                      md={11}
                      lg={7}
                    />
                  </Form.Row>
                  <Form.Row className="justify-content-sm-center">  
                    <Field
                      name="off_bottom"
                      component={renderDateTimePicker}
                      label="Off Bottom Date/Time (UTC)"
                      timeFormat={timeFormat}
                      sm={11}
                      md={11}
                      lg={7}
                    />
                  </Form.Row>
                  <Form.Row className="justify-content-sm-center">  
                    <Field
                      name="holding_50m"
                      component={renderDateTimePicker}
                      label="Holding 50m Date/Time (UTC)"
                      timeFormat={timeFormat}
                      sm={11}
                      md={11}
                      lg={7}
                    />
                  </Form.Row>
                  <Form.Row className="justify-content-sm-center">  
                    <Field
                      name="clear_to_surface"
                      component={renderDateTimePicker}
                      label="Clear to Surface Date/Time (UTC)"
                      timeFormat={timeFormat}
                      sm={11}
                      md={11}
                      lg={7}
                    />
                  </Form.Row>
                  <Form.Row className="justify-content-sm-center">  
                    <Field
                      name="on_surface"
                      component={renderDateTimePicker}
                      label="On Surface Date/Time (UTC)"
                      timeFormat={timeFormat}
                      sm={11}
                      md={11}
                      lg={7}
                    />
                  </Form.Row>
                  <Form.Row className="justify-content-sm-center">  
                    <Field
                      name="tanks_blown"
                      component={renderDateTimePicker}
                      label="Tanks Blown Date/Time (UTC)"
                      timeFormat={timeFormat}
                      sm={11}
                      md={11}
                      lg={7}
                    />
                  </Form.Row>
                  <Form.Row className="justify-content-sm-center">  
                    <Field
                      name="on_tow"
                      component={renderDateTimePicker}
                      label="On Tow Date/Time (UTC)"
                      timeFormat={timeFormat}
                      sm={11}
                      md={11}
                      lg={7}
                    />
                  </Form.Row>
                  <Form.Row className="justify-content-sm-center">  
                    <Field
                      name="lift_attached"
                      component={renderDateTimePicker}
                      label="Lift Attached Date/Time (UTC)"
                      timeFormat={timeFormat}
                      sm={11}
                      md={11}
                      lg={7}
                    />
                  </Form.Row>
                  <Form.Row className="justify-content-sm-center">  
                    <Field
                      name="stop"
                      component={renderDateTimePicker}
                      label="On Deck/Stop Date/Time (UTC)"
                      required={true}
                      timeFormat={timeFormat}
                      sm={11}
                      md={11}
                      lg={7}
                    />
                  </Form.Row>
                  <Form.Row className="justify-content-sm-center">  
                    <Field
                      name="aborted"
                      component={renderDateTimePicker}
                      label="Aborted Date/Time (UTC)"
                      required={true}
                      timeFormat={timeFormat}
                      sm={11}
                      md={11}
                      lg={7}
                    />
                  </Form.Row>
                </Col>
                <Col className='px-1' sm={6}>
                  <Form.Row className="justify-content-sm-center">
                    <Field
                      name="surface_conditions"
                      component={renderTextArea}
                      label="Surface Conditions"
                      rows={6}
                      sm={11}
                      md={11}
                      lg={7}
                    />
                  </Form.Row>
                  <Form.Row className="justify-content-sm-center">
                    <Field
                      name="subsea_conditions"
                      component={renderTextArea}
                      label="Subsea Conditions"
                      rows={6}
                      sm={11}
                      md={11}
                      lg={7}
                    />
                  </Form.Row>
                  <Form.Row className="justify-content-sm-center">
                    <Field
                      name="max_depth"
                      component={renderTextField}
                      label="Max Depth"
                      placeholder="in meters"
                      lg={5}
                      md={7}
                      sm={7}
                    />
                  </Form.Row>
                  <Form.Row className="justify-content-sm-center">
                    <Field
                      name="bbox_north"
                      component={renderTextField}
                      label="North"
                      placeholder="in ddeg"
                      lg={5}
                      md={6}
                    />
                  </Form.Row>
                  <Form.Row className="justify-content-sm-center">
                    <Field
                      name="bbox_west"
                      component={renderTextField}
                      label="West"
                      placeholder="in ddeg"
                      lg={5}
                      md={6}
                    />
                    <Field
                      name="bbox_east"
                      component={renderTextField}
                      label="East"
                      placeholder="in ddeg"
                      lg={5}
                      md={6}
                    />
                  </Form.Row>
                  <Form.Row className="justify-content-sm-center">
                    <Field
                      name="bbox_south"
                      component={renderTextField}
                      label="South"
                      placeholder="in ddeg"
                      lg={5}
                      md={6}
                    />
                  </Form.Row>
                </Col>
              </Row>
              <Row>
                <Col xs={12}>
                  <div className="float-right">
                    <Button className="mr-1" variant="secondary" size="sm" onClick={this.props.handleHide}>Cancel</Button>
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

  if(formProps.off_bottom && formProps.off_bottom !== '' && moment.utc(formProps.stop, dateFormat + " " + timeFormat).isBefore(moment.utc(formProps.stop, dateFormat + " " + timeFormat))) {
    errors.off_bottom = 'Off bottom date must be before stop date';
  }

  if(formProps.on_surface && formProps.on_surface !== '' && moment.utc(formProps.on_surface, dateFormat + " " + timeFormat).isBefore(moment.utc(formProps.off_bottom, dateFormat + " " + timeFormat))) {
    errors.on_surface = 'Floats on surface date must be after off bottom date';
  }

  if(formProps.off_bottom && formProps.off_bottom !== '' && moment.utc(formProps.off_bottom, dateFormat + " " + timeFormat).isBefore(moment.utc(formProps.on_bottom, dateFormat + " " + timeFormat))) {
    errors.off_bottom = 'Off bottom date must be after on bottom date';
  }

  if(formProps.on_bottom && formProps.on_bottom !== '' && moment.utc(formProps.on_bottom, dateFormat + " " + timeFormat).isBefore(moment.utc(formProps.vents_secured, dateFormat + " " + timeFormat))) {
    errors.on_bottom = 'On bottom date must be after vents secured date';
  }

  if(formProps.vents_secured && formProps.vents_secured !== '' && moment.utc(formProps.vents_secured, dateFormat + " " + timeFormat).isBefore(moment.utc(formProps.off_deck, dateFormat + " " + timeFormat))) {
    errors.vents_secured = 'Vents secured date must be after off_deck date';
  }

  if(formProps.off_deck && formProps.off_deck !== '' && moment.utc(formProps.off_deck, dateFormat + " " + timeFormat).isBefore(moment.utc(formProps.start, dateFormat + " " + timeFormat))) {
    errors.off_deck = 'Off deck date must be after start date';
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