import React, { Component } from 'react';
import axios from 'axios';
import moment from 'moment';
import Cookies from 'universal-cookie';
import PropTypes from 'prop-types';
import { Button, Modal } from 'react-bootstrap';
import Highcharts from 'highcharts';
import HighchartsNoDataToDisplay from "highcharts/modules/no-data-to-display";
import HighchartsReact from 'highcharts-react-official';
import { connectModal } from 'redux-modal';
import { API_ROOT_URL } from '../client_config';

HighchartsNoDataToDisplay(Highcharts);

let fileDownload = require('js-file-download');

const cookies = new Cookies();

class SVProfileModal extends Component {

  constructor (props) {
    super(props);

    this.state = {
      ctd_data: null,
      status_msg: '',
      error_msg: ''
    }

    this.handleClose = this.handleClose.bind(this);
    this.exportDataToFile = this.exportDataToFile.bind(this);
  }

  static propTypes = {
    lowering: PropTypes.object
  };

  componentDidMount() {
    this.fetchCTDData();
  }

  componentDidUpdate(prevProps) {

    if(this.props.lowering && this.props.lowering !== prevProps.lowering) {
      this.fetchCTDData();
    }
  }

  async fetchCTDData() {

    if(this.props.lowering.lowering_additional_meta.milestones && this.props.lowering.lowering_additional_meta.milestones.lowering_off_deck && this.props.lowering.lowering_additional_meta.milestones.lowering_on_bottom) {

      this.setState({status_msg: "Downloading CTD data..."})
      const ctd_data = await axios.get(`${API_ROOT_URL}/api/v1/event_aux_data?datasource=vehicleRealtimeCTDData&startTS=${this.props.lowering.lowering_additional_meta.milestones.lowering_off_deck}&stopTS=${this.props.lowering.lowering_additional_meta.milestones.lowering_on_bottom}`,
        {
          headers: {
          authorization: cookies.get('token')
          }
        }      
      ).then((response) => {

        return response.data;

      }).catch((error) => {
        if(error.response.status !== 404) {
          console.log(error)
        }

        return null;
      })

      if(!ctd_data) {
        this.setState({error_msg: "No CTD data found!!!"})
      }

      this.setState({status_msg: ""})
      this.setState({ctd_data});
      return
    }

    this.setState({error_msg: "Missing required dive milestones!!!"})

  }


  exportDataToFile() {

    const header = []
    header.push(['DIVE: ' + this.props.lowering.lowering_id])
    header.push([moment.utc().format('YYYY-MM-DD')])
    header.push([moment.utc().format('HH:mm:ss')])
    header.push(['Probe: ROV'])
    header.push(['Source: Sealog'])

    const profile_data = this.state.ctd_data.map((data_point) => {
      let depth = data_point.data_array.find((value) => value.data_name == 'depth')
      depth = (depth) ? parseFloat(depth.data_value) : null

      let sv = data_point.data_array.find((value) => value.data_name == 'sv')
      sv = (sv) ? parseFloat(sv.data_value) : null

      let sal = data_point.data_array.find((value) => value.data_name == 'sal')
      sal = (sal) ? parseFloat(sal.data_value) : null

      let temp = data_point.data_array.find((value) => value.data_name == 'temp')
      temp = (temp) ? parseFloat(temp.data_value) : null

      return [depth, sv, sal, temp]
    })

    if(profile_data) {
      profile_data.sort((current, next) => {
        if (current[0] < next[0]) {
          return -1;
        }

        if (current[0] > next[0]) {
          return 1;
        }

        return 0
      })
    }

    const Results = header.concat(profile_data);

    let CsvString = "";
    
    Results.forEach(function(RowItem) {
      CsvString += RowItem.join('\t\t') + "\r\n"
    });
    
    fileDownload(CsvString, `${this.props.lowering.lowering_id}_SVP_ROV_DOWNCAST.pro`);
  }

  handleClose() {
    this.props.handleHide();
  }

  renderSVProfile(ctd_data) {

    if(!ctd_data) {
      const svProfileOptions = {
        title: {
          text: null
        },
        chart: {
          inverted: true,
          height: 600
          // zoomType: 'x'
        },
        legend: {
          enabled: false
        },
        series: [
          {
            data: []
          }
        ],
        xAxis: {
          title: {
            text: 'Depth [m]',
          }
        },
        yAxis: {
          lineWidth:1,
          title: {
            text: 'Sound Velocity [m/s]',
          }
        },
      }

      return (
        <HighchartsReact
          highcharts={Highcharts}
          options={svProfileOptions}
          oneToOne={true}
        />
      )
    }

    const profile_data = ctd_data.map((data_point) => {
      let depth = data_point.data_array.find((value) => value.data_name == 'depth')
      depth = (depth) ? parseFloat(depth.data_value) : null

      let sv = data_point.data_array.find((value) => value.data_name == 'sv')
      sv = (sv) ? parseFloat(sv.data_value) : null

      return [depth, sv]
    })

    if(profile_data) {
      profile_data.sort((current, next) => {
        if (current[0] < next[0]) {
          return -1;
        }

        if (current[0] > next[0]) {
          return 1;
        }

        return 0
      })
    }

    const svProfileOptions = {
      title: {
        text: null
      },
      chart: {
        inverted: true,
        height: 600
      },
      legend: {
        enabled: false
      },
      series: [
        {
          data: profile_data,
          states: {
            hover: {
              enabled: false
            }
          }
        }
      ],
      tooltip: {
        enabled: false
      },
      xAxis: {
        gridLineWidth: 1,
        title: {
          text: 'Depth [m]',
        }
      },
      yAxis: {
        lineWidth:1,
        title: {
          text: 'Sound Velocity [m/s]',
        }
      },
    }

    return (
      <HighchartsReact
        highcharts={Highcharts}
        options={svProfileOptions}
        oneToOne={true}
      />
    )
  }


  render() {

    const { show, handleHide, lowering } = this.props

    if (lowering) {
      const statsTable = this.renderSVProfile(this.state.ctd_data);

      return (
        <Modal size="lg" show={show} onHide={handleHide}>
          <Modal.Header closeButton>
            <Modal.Title as="h5">SV Profile</Modal.Title>
          </Modal.Header>

          <Modal.Body>
          {statsTable}
          <div className="mt-2">
            <span className="text-warning">{this.state.status_msg}</span><span className="text-danger">{this.state.error_msg}</span><span className="float-right"><Button variant="outline-primary" size="sm" onClick={this.exportDataToFile} disabled={!this.state.ctd_data}>Export</Button></span>
          </div>
          </Modal.Body>
        </Modal>
      );
    }
    else {
      return null;
    }
  }
}

export default connectModal({ name: 'svProfile' })(SVProfileModal)
