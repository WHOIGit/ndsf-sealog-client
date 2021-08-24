import React, { Component } from 'react';
import axios from 'axios';
import moment from 'moment';
import Cookies from 'universal-cookie';
import PropTypes from 'prop-types';
import { Button, Table, Modal } from 'react-bootstrap';
import { connectModal } from 'redux-modal';
import { API_ROOT_URL, CUSTOM_LOWERING_NAME } from '../client_config';

let fileDownload = require('js-file-download');

const cookies = new Cookies();

class StatsForROVTeamModal extends Component {

  constructor (props) {
    super(props);

    this.state = {
      lowerings: null,
      lowering_stats: null,
      lowering_samples: null,
      lowering_stat_totals: null,
      status_msg: '',
      lowering_name: (CUSTOM_LOWERING_NAME)? CUSTOM_LOWERING_NAME[0].charAt(0).toUpperCase() + CUSTOM_LOWERING_NAME[0].slice(1) : "Lowering",
      lowerings_name: (CUSTOM_LOWERING_NAME)? CUSTOM_LOWERING_NAME[1].charAt(0).toUpperCase() + CUSTOM_LOWERING_NAME[1].slice(1) : "Lowerings"
    }

    this.handleClose = this.handleClose.bind(this);
    this.buildStatsAndTotals = this.buildStatsAndTotals.bind(this);
    this.exportDataToFile = this.exportDataToFile.bind(this);
  }

  static propTypes = {
    cruise: PropTypes.object
  };

  componentDidMount() {
    this.fetchLowerings();
  }

  componentDidUpdate(prevProps, prevState) {

    if(this.props.cruise && this.props.cruise !== prevProps.cruise) {
      // console.log("cruise changed");
      this.fetchLowerings();
    }

    if(this.state.lowerings && this.state.lowerings != prevState.lowerings) {
      // console.log("lowerings changed");
      this.fetchLoweringSampleCount();
    }

    if(this.state.lowering_samples && this.state.lowering_samples != prevState.lowering_samples) {
      // console.log("samples changed");
      this.buildStatsAndTotals();
    }

  }

  async fetchLoweringSampleCount() {

    this.setState({status_msg: "Downloading sample counts..."})
    const samples = await this.state.lowerings.map(async (lowering) => {
      const samples_count = await axios.get(`${API_ROOT_URL}/api/v1/events/bylowering/${lowering.id}?value=SAMPLE`,
        {
          headers: {
          authorization: cookies.get('token')
          }
        }      
      ).then((response) => {

        const sample_events = response.data.filter((event) => event['event_value'] == 'SAMPLE');
        return sample_events.length;

      }).catch((error) => {
        console.log(error)
        if(error.response.status !== 404) {
          console.log(error)
        }

        return 0;
      })

      return samples_count
    })

    Promise.all(samples).then((values) => {
      this.setState({lowering_samples: values, status_msg: ""});
    })
  }


  async fetchLowerings() {

    this.setState({status_msg: `Downloading ${this.state.lowering_name.toLowerCase()} data...`})

    const lowerings = await axios.get(`${API_ROOT_URL}/api/v1/lowerings/bycruise/${this.props.cruise.id}`,
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
  
    lowerings.reverse();

    this.setState({lowerings, status_msg: ""})

  }

  buildStatsAndTotals() {

    const lowering_stats = this.state.lowerings.map((lowering, index) => {

      const stats = {
        start_dt: null,
        off_deck_dt: null,
        descending_dt: null,
        on_bottom_dt: null,
        off_bottom_dt: null,
        floats_on_surface_dt: null,
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

      if (lowering.lowering_additional_meta.milestones && lowering.lowering_additional_meta.milestones.lowering_off_deck) {
        try {
          stats.off_deck_dt = moment.utc(lowering.lowering_additional_meta.milestones.lowering_off_deck);
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

      if (lowering.lowering_additional_meta.milestones && lowering.lowering_additional_meta.milestones.lowering_floats_on_surface) {
        try {
          stats.floats_on_surface_dt = moment.utc(lowering.lowering_additional_meta.milestones.lowering_floats_on_surface);
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
      if (stats.off_deck_dt && stats.stop_dt) {
        stats.total_duration = stats.stop_dt - stats.off_deck_dt
      }

      // deployment_duration
      if (stats.off_deck_dt && stats.descending_dt) {
        stats.deployment_duration = stats.descending_dt - stats.off_deck_dt
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
      if (stats.off_bottom_dt && stats.floats_on_surface_dt) {
        stats.ascent_duration = stats.floats_on_surface_dt - stats.off_bottom_dt
      }

      // recovery_duration
      if (stats.floats_on_surface_dt && stats.stop_dt) {
        stats.recovery_duration = stats.stop_dt - stats.floats_on_surface_dt
      }

      // samples
      stats.samples_collected = (this.state.lowering_samples[index]) ? this.state.lowering_samples[index] : 0;

      return stats

    })

    this.setState({lowering_stats})
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
      'Samples',
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
        stat.samples_collected,
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
      totals.samples_collected += lowering.samples_collected;
      totals.max_depth = (totals.max_depth >= lowering.max_depth) ? totals.max_depth : lowering.max_depth;

      return totals
    },{
      total_duration: 0,
      deployment_duration: 0,
      descent_duration: 0,
      on_bottom_duration: 0,
      ascent_duration: 0,
      recovery_duration: 0,
      samples_collected: 0,
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
      lowering_stat_totals.samples_collected,
      lowering_stat_totals.max_depth
    ])

    let CsvString = "";
    
    Results.forEach(function(RowItem) {
        
      CsvString += RowItem.join(',') + "\r\n";
    
    });
    
    fileDownload(CsvString, `${this.props.cruise.cruise_id}_cruise_data_summary.csv`);
  }

  handleClose() {
    this.props.handleHide();
  }

  renderStatsTable(stats) {

    if(stats == null) {
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
          <th>Samples</th>
          <th>Max Depth</th>
        </tr>
      </thead>
    )

    const statsTableData = stats.map((stat, index) => {
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
          <td>{stat.samples_collected}</td>
          <td>{stat.max_depth}</td>
        </tr>
      )
    })

    const lowering_stat_totals = stats.reduce((totals,lowering) => {
      totals.total_duration += lowering.total_duration;
      totals.deployment_duration += lowering.deployment_duration;
      totals.descent_duration += lowering.descent_duration;
      totals.on_bottom_duration += lowering.on_bottom_duration;
      totals.ascent_duration += lowering.ascent_duration;
      totals.recovery_duration += lowering.recovery_duration;
      totals.samples_collected += lowering.samples_collected;
      totals.max_depth = (totals.max_depth >= lowering.max_depth) ? totals.max_depth : lowering.max_depth;

      return totals

    }, {
      total_duration: 0,
      deployment_duration: 0,
      descent_duration: 0,
      on_bottom_duration: 0,
      ascent_duration: 0,
      recovery_duration: 0,
      samples_collected: 0,
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
        <th>{lowering_stat_totals.samples_collected}</th>
        <th>{lowering_stat_totals.max_depth}</th>
      </tr>
    )

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

    const { show, handleHide, cruise } = this.props

    const statsTable = this.renderStatsTable(this.state.lowering_stats);

    if (cruise) {
      return (
        <Modal size="lg" show={show} onHide={handleHide}>
          <Modal.Header closeButton>
            <Modal.Title as="h5">Stats for ROV Team</Modal.Title>
          </Modal.Header>

          <Modal.Body>
          {statsTable}
          <span className='text-warning'>{this.state.status_msg}</span><span className="float-right"><Button variant="outline-primary" size="sm" onClick={this.exportDataToFile}>Export</Button></span>
          </Modal.Body>
        </Modal>
      );
    }
    else {
      return null;
    }
  }
}

export default connectModal({ name: 'statsForROVTeam' })(StatsForROVTeamModal)
