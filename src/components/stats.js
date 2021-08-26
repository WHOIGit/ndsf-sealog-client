import React, { Component } from 'react';
import axios from 'axios';
import moment from 'moment';
import Cookies from 'universal-cookie';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Button, Row, Col, Container, ListGroup, Table } from 'react-bootstrap';
import { API_ROOT_URL, CUSTOM_CRUISE_NAME, CUSTOM_LOWERING_NAME } from '../client_config';

import * as mapDispatchToProps from '../actions';

let fileDownload = require('js-file-download');

const cookies = new Cookies();

class Stats extends Component {

  constructor (props) {
    super(props);

    this.state = {
      cruises: null,
      cruise_stats: null,
      lowerings: null,
      lowering_stats: null,
      lowering_samples: null,
      status_msg: '',
      cruise_name: (CUSTOM_CRUISE_NAME)? CUSTOM_CRUISE_NAME[0].charAt(0).toUpperCase() + CUSTOM_CRUISE_NAME[0].slice(1) : "Cruise",
      cruises_name: (CUSTOM_CRUISE_NAME)? CUSTOM_CRUISE_NAME[1].charAt(0).toUpperCase() + CUSTOM_CRUISE_NAME[1].slice(1) : "Cruises",
      lowering_name: (CUSTOM_LOWERING_NAME)? CUSTOM_LOWERING_NAME[0].charAt(0).toUpperCase() + CUSTOM_LOWERING_NAME[0].slice(1) : "Lowering",
      lowerings_name: (CUSTOM_LOWERING_NAME)? CUSTOM_LOWERING_NAME[1].charAt(0).toUpperCase() + CUSTOM_LOWERING_NAME[1].slice(1) : "Lowerings"
    };

    this.buildStatsAndTotals = this.buildStatsAndTotals.bind(this);
    this.exportDataToFile = this.exportDataToFile.bind(this);

  }


  async componentDidMount() {
    await this.fetchCruises();
    await this.fetchLowerings();
    // await this.fetchLoweringSampleCount();
    this.buildStatsAndTotals()
  }


  async componentDidUpdate(prevProps, prevState) {
  }


  async fetchLoweringSampleCount() {

    this.setState({status_msg: "Downloading sample counts..."})
    const samples = await Promise.all(this.state.lowerings.map(async (lowering) => {
      const response = await axios.get(`${API_ROOT_URL}/api/v1/events/bylowering/${lowering.id}?value=SAMPLE`,
        {
          headers: {
          authorization: cookies.get('token')
          }
        }      
      ).then((response) => {

        const sample_events = response.data.filter((event) => event['event_value'] == 'SAMPLE');
        return sample_events.length;

      }).catch((error) => {
        // console.log(error)
        if(error.response.status !== 404) {
          console.log(error)
        }

        return 0;
      })

      return await response
    }))

    this.setState({lowering_samples: samples, status_msg: ""});
  }


  async fetchCruises() {

    this.setState({status_msg: `Downloading ${this.state.cruise_name.toLowerCase()} data...`})

    const response = await axios.get(`${API_ROOT_URL}/api/v1/cruises`,
      {
        headers: {
        authorization: cookies.get('token')
        }
      }      
    ).then((response) => {

      return response.data

    }).catch((error) => {
      if(error.response.status !== 404) {
        console.log(error)
      }

      return []
    })
  
    const cruises = await response;
    cruises.reverse();

    this.setState({cruises, status_msg: ""})

  }


  async fetchLowerings() {

    this.setState({status_msg: `Downloading ${this.state.lowering_name.toLowerCase()} data...`})

    const response = await axios.get(`${API_ROOT_URL}/api/v1/lowerings`,
      {
        headers: {
        authorization: cookies.get('token')
        }
      }      
    ).then((response) => {

      return response.data

    }).catch((error) => {
      if(error.response.status !== 404) {
        console.log(error)
      }

      return []
    })

    const lowerings = await response;
  
    lowerings.reverse();

    this.setState({lowerings, status_msg: ""})
  }

  buildStatsAndTotals() {

    this.setState({status_msg: `Calculating stats...`})

    const lowering_stats = this.state.lowerings.map((lowering, index) => {

      const stats = {
        start_dt: null,
        start_dt: null,
        descending_dt: null,
        on_bottom_dt: null,
        off_bottom_dt: null,
        on_surface_dt: null,
        stop_dt: null,
        max_depth: 0,
        bounding_box: null,
        total_duration: null,
        deployment_duration: null,
        descent_duration: null,
        on_bottom_duration: null,
        ascent_duration: null,
        recovery_duration: null,
        samples_collected: 0
      }

      if (lowering.start_ts) {
        try {
          stats.start_dt = moment.utc(lowering.start_ts);
        }
        catch(err) {
          console.error(err);
        }
      }

      if (lowering.stop_ts) {
        try {
          stats.stop_dt = moment.utc(lowering.stop_ts);
        }
        catch(err) {
          console.error(err);
        }
      }

      if (lowering.lowering_additional_meta.milestones && lowering.lowering_additional_meta.milestones.lowering_start) {
        try {
          stats.start_dt = moment.utc(lowering.lowering_additional_meta.milestones.lowering_start);
        }
        catch(err) {
          console.error(err);
        }
      }

      if (lowering.lowering_additional_meta.milestones && lowering.lowering_additional_meta.milestones.lowering_descending) {
        try {
          stats.descending_dt = moment.utc(lowering.lowering_additional_meta.milestones.lowering_descending);
        }
        catch(err) {
          console.error(err);
        }
      }

      if (lowering.lowering_additional_meta.milestones && lowering.lowering_additional_meta.milestones.lowering_on_bottom) {
        try {
          stats.on_bottom_dt = moment.utc(lowering.lowering_additional_meta.milestones.lowering_on_bottom);
        }
        catch(err) {
          console.error(err);
        }
      }

      if (lowering.lowering_additional_meta.milestones && lowering.lowering_additional_meta.milestones.lowering_off_bottom) {
        try {
          stats.off_bottom_dt = moment.utc(lowering.lowering_additional_meta.milestones.lowering_off_bottom);
        }
        catch(err) {
          console.error(err);
        }
      }

      if (lowering.lowering_additional_meta.milestones && lowering.lowering_additional_meta.milestones.lowering_on_surface) {
        try {
          stats.on_surface_dt = moment.utc(lowering.lowering_additional_meta.milestones.lowering_on_surface);
        }
        catch(err) {
          console.error(err);
        }
      }

      if (lowering.lowering_additional_meta.stats && lowering.lowering_additional_meta.stats.max_depth) { 
        try {
          stats.max_depth = parseFloat(lowering.lowering_additional_meta.stats.max_depth);
        }
        catch(err) {
          console.error(err);
        }
      }

      if (lowering.lowering_additional_meta.stats && lowering.lowering_additional_meta.stats.bounding_box) { 
        try {
          stats.bounding_box = lowering.lowering_additional_meta.stats.bounding_box.map((coord) => parseFloat(coord))
        }
        catch(err) {
          console.error(err);
        }
      }

      // total_duration
      if (stats.start_dt && stats.stop_dt) {
        stats.total_duration = stats.stop_dt - stats.start_dt
      }

      // deployment_duration
      if (stats.start_dt && stats.descending_dt) {
        stats.deployment_duration = stats.descending_dt - stats.start_dt
      }

      // descent_duration
      if (stats.descending_dt && stats.on_bottom_dt) {
        stats.descent_duration = stats.on_bottom_dt - stats.descending_dt
      }

      // on_bottom_duration
      if (stats.on_bottom_dt && stats.off_bottom_dt) {
        stats.on_bottom_duration = stats.off_bottom_dt - stats.on_bottom_dt
      }

      // ascent_duration
      if (stats.off_bottom_dt && stats.on_surface_dt) {
        stats.ascent_duration = stats.on_surface_dt - stats.off_bottom_dt
      }

      // recovery_duration
      if (stats.on_surface_dt && stats.stop_dt) {
        stats.recovery_duration = stats.stop_dt - stats.on_surface_dt
      }

      // samples
      // stats.samples_collected = (this.state.lowering_samples[index]) ? this.state.lowering_samples[index] : 0;

      return stats

    })

    this.setState({lowering_stats, status_msg: ""})

  }

  exportDataToFile() {

    var Results = [];

    Results.push([
      `${this.state.lowering_name} ID`,
      'Location',
      'Deck to Deck',
      'Deployment',
      'Descent',
      'Seabed',
      'Ascent',
      'Recovery',
      // 'Samples',
      'Max Depth'
    ])

    this.state.lowering_stats.forEach((stat, index) => {
      Results.push([
        this.state.lowerings[index].lowering_id,
        "\"" + this.state.lowerings[index].lowering_location + "\"",
        moment.duration(stat.total_duration).format('HH:mm:ss', { trim: false }),
        moment.duration(stat.deployment_duration).format('HH:mm:ss', { trim: false }),
        moment.duration(stat.descent_duration).format('HH:mm:ss', { trim: false }),
        moment.duration(stat.on_bottom_duration).format('HH:mm:ss', { trim: false }),
        moment.duration(stat.ascent_duration).format('HH:mm:ss', { trim: false }),
        moment.duration(stat.recovery_duration).format('HH:mm:ss', { trim: false }),
        // stat.samples_collected,
        stat.max_depth
      ])
    })

    const lowering_stat_totals = this.state.lowering_stats.reduce((totals,lowering) => {
      totals.total_duration += lowering.total_duration;
      totals.deployment_duration += lowering.deployment_duration;
      totals.descent_duration += lowering.descent_duration;
      totals.on_bottom_duration += lowering.on_bottom_duration;
      totals.ascent_duration += lowering.ascent_duration;
      totals.recovery_duration += lowering.recovery_duration;
      // totals.samples_collected += lowering.samples_collected;
      totals.max_depth = (totals.max_depth >= lowering.max_depth) ? totals.max_depth : lowering.max_depth;

      return totals
    },{
      total_duration: 0,
      deployment_duration: 0,
      descent_duration: 0,
      on_bottom_duration: 0,
      ascent_duration: 0,
      recovery_duration: 0,
      // samples_collected: 0,
      max_depth: 0
    });

    Results.push([
      `${this.state.lowerings.length} ${this.state.lowerings_name}`,
      "Totals:",
      moment.duration(lowering_stat_totals.total_duration).format('HH:mm:ss', { trim: false }),
      moment.duration(lowering_stat_totals.deployment_duration).format('HH:mm:ss', { trim: false }),
      moment.duration(lowering_stat_totals.descent_duration).format('HH:mm:ss', { trim: false }),
      moment.duration(lowering_stat_totals.on_bottom_duration).format('HH:mm:ss', { trim: false }),
      moment.duration(lowering_stat_totals.ascent_duration).format('HH:mm:ss', { trim: false }),
      moment.duration(lowering_stat_totals.recovery_duration).format('HH:mm:ss', { trim: false }),
      // lowering_stat_totals.samples_collected,
      lowering_stat_totals.max_depth
    ])

    let CsvString = "";
    
    Results.forEach(function(RowItem) {
        
      CsvString += RowItem.join(',') + "\r\n";
    
    });
    
    fileDownload(CsvString, `total_${this.state.lowering_name}_stats.csv`);
  }

  handleClose() {
    this.props.handleHide();
  }

  renderStatsTable() {

    if(this.state.lowering_stats == null) {
      return null;
    }

    const statTableHeaders = (
      <thead>
        <tr>
          <th>{this.state.lowering_name} ID</th>
          <th>Location</th>
          <th>Deck to Deck</th>
          <th>Deployment</th>
          <th>Descent</th>
          <th>Seabed</th>
          <th>Ascent</th>
          <th>Recovery</th>
          <th>Max Depth</th>
        </tr>
      </thead>
    )

    // Removed for performance reasons
    // <th>Samples</th>

    const statsTableData = this.state.lowering_stats.map((stat, index) => {
      return (
        <tr key={`lowering_${this.state.lowerings[index].lowering_id}`}>
          <td>{this.state.lowerings[index].lowering_id}</td>
          <td>{this.state.lowerings[index].lowering_location}</td>
          <td>{`${moment.duration(stat.total_duration).format('HH:mm:ss', { trim: false })}`}</td>
          <td>{`${moment.duration(stat.deployment_duration).format('HH:mm:ss', { trim: false })}`}</td>
          <td>{`${moment.duration(stat.descent_duration).format('HH:mm:ss', { trim: false })}`}</td>
          <td>{`${moment.duration(stat.on_bottom_duration).format('HH:mm:ss', { trim: false })}`}</td>
          <td>{`${moment.duration(stat.ascent_duration).format('HH:mm:ss', { trim: false })}`}</td>
          <td>{`${moment.duration(stat.recovery_duration).format('HH:mm:ss', { trim: false })}`}</td>
          <td>{stat.max_depth}</td>
        </tr>
      )
    })

    // Removed for performance reasons
    // <td>{stat.samples_collected}</td>


    const lowering_stat_totals = this.state.lowering_stats.reduce((totals,lowering) => {
      totals.total_duration += lowering.total_duration;
      totals.deployment_duration += lowering.deployment_duration;
      totals.descent_duration += lowering.descent_duration;
      totals.on_bottom_duration += lowering.on_bottom_duration;
      totals.ascent_duration += lowering.ascent_duration;
      totals.recovery_duration += lowering.recovery_duration;
      // totals.samples_collected += lowering.samples_collected;
      totals.max_depth = (totals.max_depth >= lowering.max_depth) ? totals.max_depth : lowering.max_depth;

      return totals

    }, {
      total_duration: 0,
      deployment_duration: 0,
      descent_duration: 0,
      on_bottom_duration: 0,
      ascent_duration: 0,
      recovery_duration: 0,
      // samples_collected: 0,
      max_depth: 0
    })

    const statTableDataTotals = (
      <tr key='stat_totals'>
        <th>{`${this.state.lowerings.length} ${this.state.lowerings_name}`}</th>
        <th>Totals:</th>
        <th>{`${moment.duration(lowering_stat_totals.total_duration).format('HH:mm:ss', { trim: false })}`}</th>
        <th>{`${moment.duration(lowering_stat_totals.deployment_duration).format('HH:mm:ss', { trim: false })}`}</th>
        <th>{`${moment.duration(lowering_stat_totals.descent_duration).format('HH:mm:ss', { trim: false })}`}</th>
        <th>{`${moment.duration(lowering_stat_totals.on_bottom_duration).format('HH:mm:ss', { trim: false })}`}</th>
        <th>{`${moment.duration(lowering_stat_totals.ascent_duration).format('HH:mm:ss', { trim: false })}`}</th>
        <th>{`${moment.duration(lowering_stat_totals.recovery_duration).format('HH:mm:ss', { trim: false })}`}</th>
        <th>{lowering_stat_totals.max_depth}</th>
      </tr>
    )

    // Removed for performance reasons
    // <th>{lowering_stat_totals.samples_collected}</th>


    return (
      <Table striped bordered hover responsive size="sm" style={{fontSize: '.8rem'}}>
        {statTableHeaders}
        <tbody>
          {statsTableData}
          {statTableDataTotals}
        </tbody>
      </Table>
    )
  }

  render() {
    if (!this.props.roles) {
      return (
        <div>Loading...</div>
      );
    }

    else if(this.props.roles.includes("admin")) {
      
      const statsTable = this.renderStatsTable(this.state.lowering_stats);

      return (
        <Container>
          { statsTable }
          { (statsTable) ? <Row><Col><div><span className="float-right"><Button variant="outline-primary" size="sm" onClick={this.exportDataToFile}>Export</Button></span></div></Col></Row> : <Row className='text-warning'>{this.state.status_msg}</Row> }
        </Container>
      );

    } else {
      this.props.gotoHome();
    }
  }
}

function mapStateToProps(state) {

  return {
    roles: state.user.profile.roles,
  };
}

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
)(Stats);