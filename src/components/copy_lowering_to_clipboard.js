import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import moment from 'moment';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Tooltip, OverlayTrigger} from 'react-bootstrap';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import * as mapDispatchToProps from '../actions';

class CopyLoweringToClipboard extends Component {

  constructor (props) {
    super(props);

    this.state = {
      text: ''
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
      let loweringOnBottomTime = (this.props.lowering.lowering_additional_meta.milestones && this.props.lowering.lowering_additional_meta.milestones.lowering_on_bottom) ? moment.utc(this.props.lowering.lowering_additional_meta.milestones.lowering_on_bottom) : null;
      let loweringOffBottomTime = (this.props.lowering.lowering_additional_meta.milestones && this.props.lowering.lowering_additional_meta.milestones.lowering_off_bottom) ? moment.utc(this.props.lowering.lowering_additional_meta.milestones.lowering_off_bottom) : null;
      let loweringStopTime = moment.utc(this.props.lowering.stop_ts);

      let loweringDurationValue = loweringStopTime.diff(loweringStartTime);
      let decentDurationValue = (loweringOnBottomTime) ? loweringOnBottomTime.diff(loweringStartTime) : null;
      let onBottomDurationValue = (loweringOnBottomTime && loweringOffBottomTime) ? loweringOffBottomTime.diff(loweringOnBottomTime) : null;
      let ascentDurationValue = (loweringOffBottomTime) ? loweringStopTime.diff(loweringOffBottomTime) : null;

      let text = "";
      text += `Lowering:      ${this.props.lowering.lowering_id}\n`;
      text += (this.props.lowering.lowering_additional_meta.lowering_description) ? `Description:   ${this.props.lowering.lowering_additional_meta.lowering_description}\n` : "";
      text += `Location:      ${this.props.lowering.lowering_location}\n`;
      text += '\n';
      text += `Start of Dive: ${this.props.lowering.start_ts}\n`;
      text += (loweringOnBottomTime) ? `On Bottom:     ${this.props.lowering.lowering_additional_meta.milestones.lowering_on_bottom}\n` : "";
      text += (loweringOffBottomTime) ? `Off Bottom:    ${this.props.lowering.lowering_additional_meta.milestones.lowering_off_bottom}\n` : "";
      text += `End of Dive:   ${this.props.lowering.stop_ts}\n`;
      text += '\n';
      text += `Total Duration:     ${moment.duration(loweringDurationValue).format("d [days] h [hours] m [minutes]")}\n`;
      text += (decentDurationValue) ? `Decent Duration:    ${moment.duration(decentDurationValue).format("d [days] h [hours] m [minutes]")}\n` : "";
      text += (onBottomDurationValue) ? `On bottom Duration: ${moment.duration(onBottomDurationValue).format("d [days] h [hours] m [minutes]")}\n` : "";
      text += (ascentDurationValue) ? `Ascent Duration:    ${moment.duration(ascentDurationValue).format("d [days] h [hours] m [minutes]")}\n` : "";
      text += '\n';
      text += (this.props.lowering.lowering_additional_meta.stats && this.props.lowering.lowering_additional_meta.stats.max_depth) ? `Max Depth:     ${this.props.lowering.lowering_additional_meta.stats.max_depth}\n` : "";
      text += (this.props.lowering.lowering_additional_meta.stats && this.props.lowering.lowering_additional_meta.stats.bounding_box) ? `Bounding Box:  ${this.props.lowering.lowering_additional_meta.stats.bounding_box.join(', ')}\n` : "";
      text += '\n';
      text += (this.props.lowering.lowering_additional_meta.stats && this.props.lowering.lowering_additional_meta.stats.dive_origin.length >= 2) ? `Dive Origin:   ${this.props.lowering.lowering_additional_meta.stats.dive_origin[0]}, ${this.props.lowering.lowering_additional_meta.stats.dive_origin[1]}\n` : "";
      text += (this.props.lowering.lowering_additional_meta.stats && this.props.lowering.lowering_additional_meta.stats.dive_origin.length == 3) ? `Dive UTM Zone: ${this.props.lowering.lowering_additional_meta.stats.dive_origin[2]}\n` : "";

      this.setState({text});
    }
  }

  render() {
    return (<OverlayTrigger placement="top" overlay={<Tooltip id="copyToClipboardTooltip">Copy to clipboard</Tooltip>}><CopyToClipboard text={this.state.text} ><FontAwesomeIcon icon='clipboard' fixedWidth /></CopyToClipboard></OverlayTrigger>);
  }
}

function mapStateToProps(state) {
}

export default compose(
  connect(null, mapDispatchToProps)
)(CopyLoweringToClipboard);