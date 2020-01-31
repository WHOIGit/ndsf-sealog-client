import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Dropdown, OverlayTrigger, Tooltip } from 'react-bootstrap';
import PropTypes from 'prop-types';
import axios from 'axios';
import moment from 'moment';
import Cookies from 'universal-cookie';
import { connect } from 'react-redux';
import { API_ROOT_URL } from '../client_config';

let fileDownload = require('js-file-download');

const dateFormat = "YYYYMMDD";
const timeFormat = "HHmm";

class ExportDropdown extends Component {

  constructor (props) {
    super(props);

    let cruiseOrLowering = "";
    if(this.props.cruiseID) {
      cruiseOrLowering = `/bycruise/${this.props.cruiseID}`
    }
    else if(this.props.loweringID) {
      cruiseOrLowering = `/bylowering/${this.props.loweringID}`
    }

    this.state = {
      id: (this.props.id)? this.props.id : "dropdown-download",
      prefix: (this.props.prefix)? this.props.prefix : null,
      cruiseOrLowering: cruiseOrLowering
    };
  }

  static propTypes = {
    id: PropTypes.string,
    prefix: PropTypes.string,
    cruiseID: PropTypes.string,
    loweringID: PropTypes.string,
    disabled: PropTypes.bool.isRequired,
    hideASNAP: PropTypes.bool.isRequired,
    eventFilter: PropTypes.object.isRequired
  };

  componentDidUpdate(prevProps) {
    // Typical usage (don't forget to compare props):
    if (this.props.cruiseID !== prevProps.cruiseID) {
      const cruiseOrLowering = `/bycruise/${this.props.cruiseID}`
      this.setState({cruiseOrLowering: cruiseOrLowering});
    }
    else if (this.props.loweringID !== prevProps.loweringID) {
      const cruiseOrLowering = `/bylowering/${this.props.loweringID}`
      this.setState({cruiseOrLowering: cruiseOrLowering});
    }

    if (this.props.prefix !== prevProps.prefix) {
      this.setState({prefix: this.props.prefix});
    }

  }

  async fetchEvents(format, eventFilter, hideASNAP) {

    const cookies = new Cookies();
    format = `format=${format}`;
    let startTS = (eventFilter.startTS)? `&startTS=${eventFilter.startTS}` : '';
    let stopTS = (eventFilter.stopTS)? `&stopTS=${eventFilter.stopTS}` : '';
    let value = (eventFilter.value)? `&value=${eventFilter.value.split(',').join("&value=")}` : '';
    value = (hideASNAP)? `&value=!ASNAP${value}` : value;
    let author = (eventFilter.author)? `&author=${eventFilter.author.split(',').join("&author=")}` : '';
    let freetext = (eventFilter.freetext)? `&freetext=${eventFilter.freetext}` : '';
    let datasource = (eventFilter.datasource)? `&datasource=${eventFilter.datasource}` : '';

    return await axios.get(`${API_ROOT_URL}/api/v1/events${this.state.cruiseOrLowering}?${format}${startTS}${stopTS}${value}${author}${freetext}${datasource}`,
      {
        headers: {
          authorization: cookies.get('token')
        }
      }).then((response) => {
      return response.data;
    }).catch((error)=>{
      if(error.response.data.statusCode === 404){
        return [];
      } else {
        console.log(error.response);
        return [];
      }
    }
    );
  }

  async fetchEventAuxData(eventFilter, hideASNAP) {

    const cookies = new Cookies();
    let startTS = (eventFilter.startTS)? `startTS=${eventFilter.startTS}` : '';
    let stopTS = (eventFilter.stopTS)? `&stopTS=${eventFilter.stopTS}` : '';
    let value = (eventFilter.value)? `&value=${eventFilter.value.split(',').join("&value=")}` : '';
    value = (hideASNAP)? `&value=!ASNAP${value}` : value;
    let author = (eventFilter.author)? `&author=${eventFilter.author.split(',').join("&author=")}` : '';
    let freetext = (eventFilter.freetext)? `&freetext=${eventFilter.freetext}` : '';
    let datasource = (eventFilter.datasource)? `&datasource=${eventFilter.datasource}` : '';

    return await axios.get(`${API_ROOT_URL}/api/v1/event_aux_data${this.state.cruiseOrLowering}?${startTS}${stopTS}${value}${author}${freetext}${datasource}`,
      {
        headers: {
          authorization: cookies.get('token')
        }
      }).then((response) => {
      return response.data;
    }).catch((error)=>{
      if(error.response.data.statusCode === 404){
        return [];
      } else {
        console.log(error.response);
        return [];
      }
    }
    );
  }

  async fetchEventsWithAuxData(format, eventFilter, hideASNAP) {

    const cookies = new Cookies();
    format = `format=${format}`;
    let startTS = (eventFilter.startTS)? `&startTS=${eventFilter.startTS}` : '';
    let stopTS = (eventFilter.stopTS)? `&stopTS=${eventFilter.stopTS}` : '';
    let value = (eventFilter.value)? `&value=${eventFilter.value.split(',').join("&value=")}` : '';
    value = (hideASNAP)? `&value=!ASNAP${value}` : value;
    let author = (eventFilter.author)? `&author=${eventFilter.author.split(',').join("&author=")}` : '';
    let freetext = (eventFilter.freetext)? `&freetext=${eventFilter.freetext}` : '';
    let datasource = (eventFilter.datasource)? `&datasource=${eventFilter.datasource}` : '';

    return await axios.get(`${API_ROOT_URL}/api/v1/event_exports${this.state.cruiseOrLowering}?${format}${startTS}${stopTS}${value}${author}${freetext}${datasource}`,
      {
        headers: {
          authorization: cookies.get('token')
        }
      }).then((response) => {
      return response.data;
    }).catch((error)=>{
      if(error.response.data.statusCode === 404){
        return [];
      } else {
        console.log(error.response);
        return [];
      }
    }
    );
  }

  exportEventsWithAuxData(format='json') {
    this.fetchEventsWithAuxData(format, this.props.eventFilter, this.props.hideASNAP).then((results) => {
      let prefix = (this.state.prefix)? this.state.prefix : moment.utc(results[0].ts).format(dateFormat + "_" + timeFormat);
      fileDownload((format == 'json')? JSON.stringify(results) : results, `${prefix}_sealog_export.${format}`);
    }).catch((error) => {
      console.log(error);
    });
  }

  exportEvents(format='json') {
    this.fetchEvents(format, this.props.eventFilter, this.props.hideASNAP).then((results) => {
      let prefix = (this.state.prefix)? this.state.prefix : moment.utc(results[0].ts).format(dateFormat + "_" + timeFormat);
      fileDownload((format == 'json')? JSON.stringify(results) : results, `${prefix}_sealog_eventExport.${format}`);
    }).catch((error) => {
      console.log(error);
    });
  }

  exportAuxData() {
    this.fetchEventAuxData(this.props.eventFilter, this.props.hideASNAP).then((results) => {
      let prefix = (this.state.prefix)? this.state.prefix : moment.utc(results[0].ts).format(dateFormat + "_" + timeFormat);
      fileDownload(JSON.stringify(results), `${prefix}_sealog_auxDataExport.json`);
    }).catch((error) => {
      console.log(error);
    });
  }

  render() {
    const exportTooltip = (<Tooltip id="exportTooltip">Export these events</Tooltip>);

    return (
      <Dropdown as={'span'} disabled={this.props.disabled} id={this.state.id}>
        <Dropdown.Toggle as={'span'}><OverlayTrigger placement="top" overlay={exportTooltip}><FontAwesomeIcon icon='download' fixedWidth/></OverlayTrigger></Dropdown.Toggle>
        <Dropdown.Menu>
          <Dropdown.Header className="text-warning" key="toJSONHeader">JSON format</Dropdown.Header>
          <Dropdown.Item key="toJSONAll" onClick={ () => this.exportEventsWithAuxData('json')}>Events w/aux data</Dropdown.Item>
          <Dropdown.Item key="toJSONEvents" onClick={ () => this.exportEvents('json')}>Events Only</Dropdown.Item>
          <Dropdown.Item key="toJSONAuxData" onClick={ () => this.exportAuxData()}>Aux Data Only</Dropdown.Item>
          <Dropdown.Divider />
          <Dropdown.Header className="text-warning" key="toCSVHeader">CSV format</Dropdown.Header>
          <Dropdown.Item key="toCSVAll" onClick={ () => this.exportEventsWithAuxData('csv')}>Events w/aux data</Dropdown.Item>
          <Dropdown.Item key="toCSVEvents" onClick={ () => this.exportEvents('csv')}>Events Only</Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    );
  }
}

// function mapStateToProps(state) {
//   return {};
// }

export default connect(null, null)(ExportDropdown);
