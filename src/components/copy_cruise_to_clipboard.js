import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import moment from 'moment';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Tooltip, OverlayTrigger} from 'react-bootstrap';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import * as mapDispatchToProps from '../actions';

class CopyCruiseToClipboard extends Component {

  constructor (props) {
    super(props);

    this.state = {
      text: ''
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
      text += `Cruise:      ${this.props.cruise.cruise_id}\n`;
      text += (this.props.cruise.cruise_additional_meta.cruise_name) ? `Name:        ${this.props.cruise.cruise_additional_meta.cruise_name}\n` : "";
      text += (this.props.cruise.cruise_additional_meta.cruise_description) ? `Description: ${this.props.cruise.cruise_additional_meta.cruise_description}\n` : "";
      text += (this.props.cruise.cruise_additional_meta.cruise_vessel) ? `Vessel:      ${this.props.cruise.cruise_additional_meta.cruise_vessel}\n` : "";
      text += `Location:    ${this.props.cruise.cruise_location}\n`;
      text += '\n';
      text += `Start of Cruise: ${cruiseStartTime.format("YYYY/MM/DD")}\n`;
      text += (this.props.cruise.cruise_additional_meta.cruise_departure_location) ? `Departure Port:  ${this.props.cruise.cruise_additional_meta.cruise_departure_location}\n` : "";
      text += `End of Cruise:   ${cruiseStopTime.format("YYYY/MM/DD")}\n`;
      text += (this.props.cruise.cruise_additional_meta.cruise_arrival_location) ? `Arrival Port:    ${this.props.cruise.cruise_additional_meta.cruise_arrival_location}\n` : "";
      text += '\n';
      text += `Cruise Duration: ${moment.duration(cruiseDurationValue).format("d [days] h [hours] m [minutes]")}\n`;
      text += (this.props.cruiseLowerings && this.props.cruiseLowerings.length > 0) ? `\nLowerings:  ${this.props.cruiseLowerings.map((lowering) => { return lowering.lowering_id }).join(', ')}\n` : "";

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
)(CopyCruiseToClipboard);