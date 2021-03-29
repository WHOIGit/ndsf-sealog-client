import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import moment from 'moment';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Tooltip, OverlayTrigger} from 'react-bootstrap';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import * as mapDispatchToProps from '../actions';
import { CUSTOM_CRUISE_NAME, CUSTOM_LOWERING_NAME } from '../client_config';

class CopyCruiseToClipboard extends Component {

  constructor (props) {
    super(props);

    this.state = {
      text: '',
      cruise_name: (CUSTOM_CRUISE_NAME)? CUSTOM_CRUISE_NAME[0].charAt(0).toUpperCase() + CUSTOM_CRUISE_NAME[0].slice(1) : "Cruise",
      lowerings_name: (CUSTOM_LOWERING_NAME)? CUSTOM_LOWERING_NAME[1].charAt(0).toUpperCase() + CUSTOM_LOWERING_NAME[1].slice(1) : "Lowerings"
    }
  }

  static propTypes = {
    cruise: PropTypes.object,
    cruiseLowerings: PropTypes.array
  };

  componentDidMount() {
    this.copyToClipboard();
  }

  componentDidUpdate(prevProps) {
    if(this.props.cruise !== prevProps.cruise || this.props.cruiseLowerings !== prevProps.cruiseLowerings) {
      this.copyToClipboard();
    }
  }

  copyToClipboard() {
    if(this.props.cruise && this.props.cruise.cruise_id) {

      let cruiseStartTime = moment.utc(this.props.cruise.start_ts);
      let cruiseStopTime = moment.utc(this.props.cruise.stop_ts);

      let cruiseDurationValue = cruiseStopTime.diff(cruiseStartTime);

      let text = "";
      text += `${this.state.cruise_name} ID:${' '.repeat(13-this.state.cruise_name.length)}${this.props.cruise.cruise_id}\n`;
      text += (this.props.cruise.cruise_additional_meta.cruise_name) ? `${this.state.cruise_name} Name:${' '.repeat(11-this.state.cruise_name.length)}${this.props.cruise.cruise_additional_meta.cruise_name}\n` : "";
      text += (this.props.cruise.cruise_additional_meta.cruise_pi) ? `Chief Scientist: ${this.props.cruise.cruise_additional_meta.cruise_pi}\n` : "";
      text += (this.props.cruise.cruise_additional_meta.cruise_description) ? `Description:     ${this.props.cruise.cruise_additional_meta.cruise_description}\n` : "";
      text += (this.props.cruise.cruise_additional_meta.cruise_vessel) ? `Vessel:   ${this.props.cruise.cruise_additional_meta.cruise_vessel}\n` : "";
      text += (this.props.cruise.cruise_location) ? `Location: ${this.props.cruise.cruise_location}\n` : "";
      text += '\n';
      text += `Start of ${this.state.cruise_name}: ${cruiseStartTime.format("YYYY/MM/DD")}\n`;
      text += (this.props.cruise.cruise_additional_meta.cruise_departure_location) ? `Departure Port:      ${this.props.cruise.cruise_additional_meta.cruise_departure_location}\n` : "";
      text += `End of ${this.state.cruise_name}:   ${cruiseStopTime.format("YYYY/MM/DD")}\n`;
      text += (this.props.cruise.cruise_additional_meta.cruise_arrival_location) ? `Arrival Port:        ${this.props.cruise.cruise_additional_meta.cruise_arrival_location}\n` : "";
      text += '\n';
      text += `${this.state.cruise_name} Duration: ${moment.duration(cruiseDurationValue).format("d [days] h [hours] m [minutes]")}\n`;
      text += (this.props.cruiseLowerings && this.props.cruiseLowerings.length > 0) ? `\n${this.state.lowerings_name}: ${this.props.cruiseLowerings.map((lowering) => { return lowering.lowering_id }).join(', ')}\n` : "";

      this.setState({text});
    }
  }

  render() {
    return (<OverlayTrigger placement="top" overlay={<Tooltip id="copyToClipboardTooltip">Copy to clipboard</Tooltip>}><CopyToClipboard text={this.state.text} ><FontAwesomeIcon icon='clipboard' fixedWidth /></CopyToClipboard></OverlayTrigger>);
  }
}

export default compose(
  connect(null, mapDispatchToProps)
)(CopyCruiseToClipboard);