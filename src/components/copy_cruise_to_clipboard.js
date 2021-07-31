import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import axios from 'axios';
import moment from 'moment';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Tooltip, OverlayTrigger} from 'react-bootstrap';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { authorizationHeader } from '../actions';
import * as mapDispatchToProps from '../actions';
import { API_ROOT_URL, CUSTOM_CRUISE_NAME, CUSTOM_LOWERING_NAME } from '../client_config';

function ConvertDDToDDM(D, lng){
    const M=0|(D%1)*60e7;

    return {
        dir : D<0?lng?'W':'S':lng?'E':'N',
        deg : 0|(D<0?D=-D:D),
        min : Math.round(Math.abs(M/1e7) * 1000) / 1000,
        // sec : (0|M/1e6%1*6e4)/100
    };
}

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

  async componentDidMount() {
    await this.copyToClipboard();
  }

  async componentDidUpdate(prevProps) {
    if(this.props.cruise !== prevProps.cruise || this.props.cruiseLowerings !== prevProps.cruiseLowerings) {
      await this.copyToClipboard();
    }
  }

  async copyToClipboard() {
    if(this.props.cruise && this.props.cruise.cruise_id) {

      let cruiseStartTime = moment.utc(this.props.cruise.start_ts);
      let cruiseStopTime = moment.utc(this.props.cruise.stop_ts);

      let cruiseDurationValue = cruiseStopTime.diff(cruiseStartTime);

      let lowering_data = (this.props.cruiseLowerings && this.props.cruiseLowerings.length > 0) ? this.props.cruiseLowerings.map(async (lowering) => {

      let position_aux_data = null;

        try {
          const response = await axios.get(`${API_ROOT_URL}/api/v1/event_exports?startTS=${lowering.lowering_additional_meta.milestones.lowering_descending}&stopTS=${lowering.lowering_additional_meta.milestones.lowering_descending}`, authorizationHeader)

          const event_data = await response.data;
            
	  position_aux_data = event_data.length > 0 ? event_data[0].aux_data.find((data) => data['data_source'] === 'vehicleRealtimeNavData') : null
        }
	catch {
          console.warn("No event data found");
	}

	let descent_position = null;
        if(position_aux_data != null) {
          const latitude_data = position_aux_data.data_array.find((data) => data['data_name'] === 'latitude')
          const longitude_data = position_aux_data.data_array.find((data) => data['data_name'] === 'longitude')
          descent_position = latitude_data && longitude_data ? [parseFloat(latitude_data['data_value']), parseFloat(longitude_data['data_value'])] : null; 

        }

        let latitude_obj = null;
        let longitude_obj = null;
        if( descent_position != null) {
          latitude_obj = ConvertDDToDDM(descent_position[0], false)
          longitude_obj = ConvertDDToDDM(descent_position[1], true)
        }

        return [
          lowering.lowering_id,
          moment.utc(lowering.start_ts).format('MM/DD/YY'),
          this.props.cruise.cruise_additional_meta.cruise_name,
          this.props.cruise.cruise_location,
          lowering.lowering_location,
          (descent_position != null) ? `${latitude_obj.dir}${latitude_obj.deg}:${latitude_obj.min}` : '',
          (descent_position != null) ? `${longitude_obj.dir}${longitude_obj.deg}:${longitude_obj.min}` : '',
          '',
          this.props.cruise.cruise_additional_meta.cruise_pi,
          lowering.lowering_additional_meta.milestones.lowering_descending ? moment.utc(lowering.lowering_additional_meta.milestones.lowering_descending).format("MM/DD/YYYY HH:mm:ss") : '',
          lowering.lowering_additional_meta.milestones.lowering_undock ? moment.utc(lowering.lowering_additional_meta.milestones.lowering_undock).format("MM/DD/YYYY HH:mm:ss") : '',
          lowering.lowering_additional_meta.milestones.lowering_dock ? moment.utc(lowering.lowering_additional_meta.milestones.lowering_dock).format("MM/DD/YYYY HH:mm:ss") : '',
          lowering.lowering_additional_meta.milestones.lowering_on_surface ? moment.utc(lowering.lowering_additional_meta.milestones.lowering_on_surface).format("MM/DD/YYYY HH:mm:ss") : '',
          '',
          '',
          (lowering.lowering_additional_meta.stats && lowering.lowering_additional_meta.stats.max_depth) ? ~~lowering.lowering_additional_meta.stats.max_depth : '',
          '',
          '',
          lowering.lowering_id
        ].join('\t') })
      : ""

      const results = await Promise.all(lowering_data);

      let text = "";
      text += `${this.state.cruise_name} ID:${' '.repeat(13-this.state.cruise_name.length)}${this.props.cruise.cruise_id}\n`;
      text += (this.props.cruise.cruise_additional_meta.cruise_name) ? `${this.state.cruise_name} Name:${' '.repeat(11-this.state.cruise_name.length)}${this.props.cruise.cruise_additional_meta.cruise_name}\n` : "";
      text += (this.props.cruise.cruise_additional_meta.cruise_pi) ? `Chief Scientist: ${this.props.cruise.cruise_additional_meta.cruise_pi}\n` : "";
      text += (this.props.cruise.cruise_additional_meta.cruise_description) ? `Description:     ${this.props.cruise.cruise_additional_meta.cruise_description}\n` : "";
      text += (this.props.cruise.cruise_additional_meta.cruise_vessel) ? `Vessel:          ${this.props.cruise.cruise_additional_meta.cruise_vessel}\n` : "";
      text += (this.props.cruise.cruise_location) ? `Location:        ${this.props.cruise.cruise_location}\n` : "";
      text += '\n';
      text += `Start of ${this.state.cruise_name}: ${cruiseStartTime.format("YYYY/MM/DD")}\n`;
      text += (this.props.cruise.cruise_additional_meta.cruise_departure_location) ? `Departure Port:  ${this.props.cruise.cruise_additional_meta.cruise_departure_location}\n` : "";
      text += `End of ${this.state.cruise_name}:   ${cruiseStopTime.format("YYYY/MM/DD")}\n`;
      text += (this.props.cruise.cruise_additional_meta.cruise_arrival_location) ? `Arrival Port:    ${this.props.cruise.cruise_additional_meta.cruise_arrival_location}\n` : "";
      text += '\n';
      text += `${this.state.cruise_name} Duration: ${moment.duration(cruiseDurationValue).format("d [days] h [hours] m [minutes]")}\n`;
      text += (this.props.cruiseLowerings && this.props.cruiseLowerings.length > 0) ? `\n${this.state.lowerings_name}: ${this.props.cruiseLowerings.map((lowering) => { return lowering.lowering_id }).join(', ')}\n` : "";
      text += (this.props.cruiseLowerings && this.props.cruiseLowerings.length > 0) ?  `\n${results.join('\n')}` : "";

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
