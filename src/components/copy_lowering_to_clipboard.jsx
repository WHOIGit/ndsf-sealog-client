import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import moment from 'moment';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Tooltip, OverlayTrigger} from 'react-bootstrap';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import * as mapDispatchToProps from '../actions';
import { _Lowering_ } from '../vocab';

class CopyLoweringToClipboard extends Component {

  constructor (props) {
    super(props);

    this.state = {
      text: '',
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
      const meta = this.props.lowering.lowering_additional_meta || {};

      let loweringStartTime = moment.utc(this.props.lowering.start_ts);
      let loweringDescendingTime = (meta.milestones && meta.milestones.lowering_descending) ? moment.utc(meta.milestones.lowering_descending) : null;
      let loweringOnBottomTime = (meta.milestones && meta.milestones.lowering_on_bottom) ? moment.utc(meta.milestones.lowering_on_bottom) : null;
      let loweringOffBottomTime = (meta.milestones && meta.milestones.lowering_off_bottom) ? moment.utc(meta.milestones.lowering_off_bottom) : null;
      let loweringOnSurfaceTime = (meta.milestones && meta.milestones.lowering_on_surface) ? moment.utc(meta.milestones.lowering_on_surface) : null;
      let loweringStopTime = moment.utc(this.props.lowering.stop_ts);
      let loweringAbortTime = (meta.milestones && meta.milestones.lowering_aborted) ? moment.utc(meta.milestones.lowering_aborted) : null;
      
      let deck2DeckDurationValue = (loweringStartTime && loweringStopTime) ? loweringStopTime.diff(loweringStartTime) : null;
      let deploymentDurationValue = (loweringStartTime && loweringDescendingTime) ? loweringDescendingTime.diff(loweringStartTime) : null;
      let decentDurationValue = (loweringOnBottomTime && loweringDescendingTime) ? loweringOnBottomTime.diff(loweringDescendingTime) : null;
      let onBottomDurationValue = (loweringOnBottomTime && loweringOffBottomTime) ? loweringOffBottomTime.diff(loweringOnBottomTime) : null;
      let ascentDurationValue = (loweringOffBottomTime && loweringOnSurfaceTime) ? loweringOnSurfaceTime.diff(loweringOffBottomTime) : null;
      let recoveryDurationValue = (loweringStopTime && loweringOnSurfaceTime) ? loweringStopTime.diff(loweringOnSurfaceTime) : null;

      let text = "";

      text += `${_Lowering_} ID:${' '.repeat(9-_Lowering_.length)}${this.props.lowering.lowering_id}\n`;
      text += (meta.lowering_description) ? `Description: ${meta.lowering_description}\n` : "";
      text += `Location: ${this.props.lowering.lowering_location}\n`;
      text += '\n';
      text += `Start of ${_Lowering_}:${' '.repeat(9-_Lowering_.length)}${this.props.lowering.start_ts}\n`;
      text += (loweringDescendingTime) ? `Descending:        ${meta.milestones.lowering_descending}\n` : "";
      text += (loweringOnBottomTime) ? `On Bottom:         ${meta.milestones.lowering_on_bottom}\n` : "";
      text += (loweringOffBottomTime) ? `Off Bottom:        ${meta.milestones.lowering_off_bottom}\n` : "";
      text += (loweringOnSurfaceTime) ? `On Surface:        ${meta.milestones.lowering_on_surface}\n` : "";
      text += `On Deck:           ${this.props.lowering.stop_ts}\n`;
      text += '\n';
      text += (deck2DeckDurationValue) ? `Deck-to-Deck: ${moment.duration(deck2DeckDurationValue).format("d [days] h [hours] m [minutes]")}\n` : "";
      text += (deploymentDurationValue) ? `Deployment:   ${moment.duration(deploymentDurationValue).format("d [days] h [hours] m [minutes]")}\n` : "";
      text += (decentDurationValue) ? `Decent:       ${moment.duration(decentDurationValue).format("d [days] h [hours] m [minutes]")}\n` : "";
      text += (onBottomDurationValue) ? `On bottom:    ${moment.duration(onBottomDurationValue).format("d [days] h [hours] m [minutes]")}\n` : "";
      text += (ascentDurationValue) ? `Ascent:       ${moment.duration(ascentDurationValue).format("d [days] h [hours] m [minutes]")}\n` : "";
      text += (recoveryDurationValue) ? `Recovery:     ${moment.duration(recoveryDurationValue).format("d [days] h [hours] m [minutes]")}\n` : "";
      text += '\n';
      text += (loweringAbortTime) ? `Aborted: ${loweringAbortTime.format("YYYY-MM-DD HH:mm")}\n\n` : "";

      text += (meta.stats && meta.stats.max_depth) ? `Max Depth:    ${meta.stats.max_depth}m\n` : "";
      text += (meta.stats && meta.stats.bounding_box) ? `Bounding Box: ${meta.stats.bounding_box.join(', ')}\n` : "";

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