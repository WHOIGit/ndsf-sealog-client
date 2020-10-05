import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import moment from 'moment';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Tooltip, OverlayTrigger} from 'react-bootstrap';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import * as mapDispatchToProps from '../actions';
import { CUSTOM_LOWERING_NAME } from '../client_config';

class CopyLoweringToClipboard extends Component {

  constructor (props) {
    super(props);

    this.state = {
      text: '',
      lowering_name: (CUSTOM_LOWERING_NAME)? CUSTOM_LOWERING_NAME[0].charAt(0).toUpperCase() + CUSTOM_LOWERING_NAME[0].slice(1) : "Lowering"
    }
  }

  static propTypes = {
    lowering: PropTypes.object
  };

  componentDidMount() {
    this.copyToClipboard();
  }

  componentDidUpdate(prevProps) {
    if(this.props.lowering !== prevProps.lowering) {
      this.copyToClipboard();
    }
  }

  copyToClipboard() {
    if(this.props.lowering && this.props.lowering.lowering_id) {

      let loweringStartTime = moment.utc(this.props.lowering.start_ts);
      let loweringHatchSecuredTime = (this.props.lowering.lowering_additional_meta.milestones && this.props.lowering.lowering_additional_meta.milestones.lowering_hatch_secured) ? moment.utc(this.props.lowering.lowering_additional_meta.milestones.lowering_hatch_secured) : null;
      let loweringOffDeckTime = (this.props.lowering.lowering_additional_meta.milestones && this.props.lowering.lowering_additional_meta.milestones.lowering_off_deck) ? moment.utc(this.props.lowering.lowering_additional_meta.milestones.lowering_off_deck) : null;
      let loweringInWaterTime = (this.props.lowering.lowering_additional_meta.milestones && this.props.lowering.lowering_additional_meta.milestones.lowering_in_water) ? moment.utc(this.props.lowering.lowering_additional_meta.milestones.lowering_in_water) : null;
      let loweringVentingNowTime = (this.props.lowering.lowering_additional_meta.milestones && this.props.lowering.lowering_additional_meta.milestones.lowering_venting_now) ? moment.utc(this.props.lowering.lowering_additional_meta.milestones.lowering_venting_now) : null;
      let loweringSubSurfaceTime = (this.props.lowering.lowering_additional_meta.milestones && this.props.lowering.lowering_additional_meta.milestones.lowering_sub_surface) ? moment.utc(this.props.lowering.lowering_additional_meta.milestones.lowering_sub_surface) : null;
      let loweringVentsSecuredTime = (this.props.lowering.lowering_additional_meta.milestones && this.props.lowering.lowering_additional_meta.milestones.lowering_vents_secured) ? moment.utc(this.props.lowering.lowering_additional_meta.milestones.lowering_vents_secured) : null;
      let loweringOnBottomTime = (this.props.lowering.lowering_additional_meta.milestones && this.props.lowering.lowering_additional_meta.milestones.lowering_on_bottom) ? moment.utc(this.props.lowering.lowering_additional_meta.milestones.lowering_on_bottom) : null;
      let loweringOffBottomTime = (this.props.lowering.lowering_additional_meta.milestones && this.props.lowering.lowering_additional_meta.milestones.lowering_off_bottom) ? moment.utc(this.props.lowering.lowering_additional_meta.milestones.lowering_off_bottom) : null;
      let loweringHolding50mTime = (this.props.lowering.lowering_additional_meta.milestones && this.props.lowering.lowering_additional_meta.milestones.lowering_holding_50m) ? moment.utc(this.props.lowering.lowering_additional_meta.milestones.lowering_holding_50m) : null;
      let loweringOnSurfaceTime = (this.props.lowering.lowering_additional_meta.milestones && this.props.lowering.lowering_additional_meta.milestones.lowering_on_surface) ? moment.utc(this.props.lowering.lowering_additional_meta.milestones.lowering_on_surface) : null;
      let loweringStopTime = moment.utc(this.props.lowering.stop_ts);
      let loweringAborted = (this.props.lowering.lowering_additional_meta.milestones && this.props.lowering.lowering_additional_meta.milestones.lowering_aborted) ? moment.utc(this.props.lowering.lowering_additional_meta.milestones.lowering_aborted) : null;

      let deck2DeckDurationValue = (loweringOffDeckTime) ? loweringStopTime.diff(loweringOffDeckTime) : null;
      let deploymentDurationValue = (loweringOffDeckTime && loweringVentsSecuredTime) ? loweringVentsSecuredTime.diff(loweringOffDeckTime) : null;
      let decentDurationValue = (loweringOnBottomTime && loweringVentsSecuredTime) ? loweringOnBottomTime.diff(loweringVentsSecuredTime) : null;
      let onBottomDurationValue = (loweringOnBottomTime && loweringOffBottomTime) ? loweringOffBottomTime.diff(loweringOnBottomTime) : null;
      let ascentDurationValue = (loweringOffBottomTime && loweringHolding50mTime) ? loweringHolding50mTime.diff(loweringOffBottomTime) : null;
      let recoveryDurationValue = (loweringStopTime && loweringHolding50mTime) ? loweringStopTime.diff(loweringHolding50mTime) : null;

      let text = "";
      text += `Lowering:        ${this.props.lowering.lowering_id}\n`;
      text += (this.props.lowering.lowering_additional_meta.lowering_description) ? `Description:     ${this.props.lowering.lowering_additional_meta.lowering_description}\n` : "";
      text += `Location:        ${this.props.lowering.lowering_location}\n\n`;
      text += `Pilot:           ${this.props.lowering.lowering_additional_meta.pilot}\n`;
      text += `Surface Officer: ${this.props.lowering.lowering_additional_meta.surface_officer}\n`;
      text += (this.props.lowering.lowering_additional_meta.lowering_passengers) ? `Passengers:      ${this.props.lowering.lowering_additional_meta.lowering_passengers.join(', ')}\n` : "";
      text += '\n';
      text += `Start of Dive: ${this.props.lowering.start_ts}\n`;
      text += (loweringOffDeckTime) ?    `Off Deck:      ${this.props.lowering.lowering_additional_meta.milestones.lowering_off_deck}\n` : "";
      text += (loweringVentingNowTime) ? `Descending:    ${this.props.lowering.lowering_additional_meta.milestones.lowering_venting_now}\n` : "";
      text += (loweringOnBottomTime) ?   `On Bottom:     ${this.props.lowering.lowering_additional_meta.milestones.lowering_on_bottom}\n` : "";
      text += (loweringOffBottomTime) ?  `Off Bottom:    ${this.props.lowering.lowering_additional_meta.milestones.lowering_off_bottom}\n` : "";
      text += (loweringOnSurfaceTime) ?  `On Surface:    ${this.props.lowering.lowering_additional_meta.milestones.lowering_on_surface}\n` : "";
      text += `On Deck:       ${this.props.lowering.stop_ts}\n`;
      text += (loweringAborted) ?  `\nAborted:    ${loweringAborted.format("YYYY-MM-DD HH:mm")}\n` : "";
      text += '\n';
      text += (deck2DeckDurationValue) ?  `Deck-to-Deck:  ${moment.duration(deck2DeckDurationValue).format("d [days] h [hours] m [minutes]")}\n` : "";
      text += (deploymentDurationValue) ? `Deployment:    ${moment.duration(deploymentDurationValue).format("d [days] h [hours] m [minutes]")}\n` : "";
      text += (decentDurationValue) ?     `Decent:        ${moment.duration(decentDurationValue).format("d [days] h [hours] m [minutes]")}\n` : "";
      text += (onBottomDurationValue) ?   `On bottom:     ${moment.duration(onBottomDurationValue).format("d [days] h [hours] m [minutes]")}\n` : "";
      text += (ascentDurationValue) ?     `Ascent:        ${moment.duration(ascentDurationValue).format("d [days] h [hours] m [minutes]")}\n` : "";
      text += (recoveryDurationValue) ?   `Recovery:      ${moment.duration(recoveryDurationValue).format("d [days] h [hours] m [minutes]")}\n` : "";
      text += '\n';

      if(this.props.lowering.lowering_additional_meta.stats && (this.props.lowering.lowering_additional_meta.stats.surface_conditions || this.props.lowering.lowering_additional_meta.stats.subsea_conditions)) {
        text += (this.props.lowering.lowering_additional_meta.stats && this.props.lowering.lowering_additional_meta.stats.surface_conditions) ? `Surface Conditions:\n${this.props.lowering.lowering_additional_meta.stats.surface_conditions}\n` : "";
        text += (this.props.lowering.lowering_additional_meta.stats && this.props.lowering.lowering_additional_meta.stats.subsea_conditions) ? `Subsea Conditions:\n${this.props.lowering.lowering_additional_meta.stats.subsea_conditions}\n` : "";
        text += '\n';
      }

      text += (this.props.lowering.lowering_additional_meta.stats && this.props.lowering.lowering_additional_meta.stats.max_depth) ? `Max Depth:     ${this.props.lowering.lowering_additional_meta.stats.max_depth}m\n` : "";
      text += (this.props.lowering.lowering_additional_meta.stats && this.props.lowering.lowering_additional_meta.stats.bounding_box) ? `Bounding Box:  ${this.props.lowering.lowering_additional_meta.stats.bounding_box.join(', ')}\n` : "";

      text += (this.props.lowering.lowering_additional_meta.stats && this.props.lowering.lowering_additional_meta.stats.max_depth) ? `Max Depth:    ${this.props.lowering.lowering_additional_meta.stats.max_depth}m\n` : "";
      text += (this.props.lowering.lowering_additional_meta.stats && this.props.lowering.lowering_additional_meta.stats.bounding_box) ? `Bounding Box: ${this.props.lowering.lowering_additional_meta.stats.bounding_box.join(', ')}\n` : "";

      this.setState({text});
    }
  }

  render() {
    return (<OverlayTrigger placement="top" overlay={<Tooltip id="copyToClipboardTooltip">Copy to clipboard</Tooltip>}><CopyToClipboard text={this.state.text} ><FontAwesomeIcon icon='clipboard' fixedWidth /></CopyToClipboard></OverlayTrigger>);
  }
}

export default compose(
  connect(null, mapDispatchToProps)
)(CopyLoweringToClipboard);