import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { connectModal } from 'redux-modal';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Map, TileLayer, WMSTileLayer, Marker, Polyline, Popup, LayersControl, ScaleControl } from 'react-leaflet';
import L from 'leaflet';
import Highcharts from 'highcharts';
import HighchartsExporting from "highcharts/modules/exporting";
import HighchartsNoDataToDisplay from "highcharts/modules/no-data-to-display";
import HighchartsReact from 'highcharts-react-official';
import moment from 'moment';
import axios from 'axios';
import Cookies from 'universal-cookie';
import { Alert, Button, Row, Col, Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
import UpdateLoweringStatsForm from './update_lowering_stats_form';
import tilelayers from '../map_tilelayers';

HighchartsExporting(Highcharts);
HighchartsNoDataToDisplay(Highcharts);

import * as mapDispatchToProps from '../actions';

import { API_ROOT_URL } from '../client_config';

const { BaseLayer } = LayersControl

const cookies = new Cookies();

class SetLoweringStatsModal extends Component {

  constructor (props) {
    super(props);

    this.state = {
      lowering: {},

      event: null,

      fetching: false,
      tracklines: {},
      events: [],

      show_edit_form: false,

      zoom: 13,
      center:{lat:41.522664576, lng:-70.657830702},
      position:{lat:41.522664576, lng:-70.657830702},
      showMarker: false,
      height: "400px",

      milestone_to_edit: null,
      milestones: {
        lowering_start: this.props.lowering.start_ts,
        lowering_on_bottom: (this.props.lowering.lowering_additional_meta.milestones && this.props.lowering.lowering_additional_meta.milestones.lowering_on_bottom) ? this.props.lowering.lowering_additional_meta.milestones.lowering_on_bottom : null,
        lowering_off_bottom: (this.props.lowering.lowering_additional_meta.milestones && this.props.lowering.lowering_additional_meta.milestones.lowering_off_bottom) ? this.props.lowering.lowering_additional_meta.milestones.lowering_off_bottom : null,
        lowering_stop: this.props.lowering.stop_ts
      },
      stats: {
        max_depth: (this.props.lowering.lowering_additional_meta.stats && this.props.lowering.lowering_additional_meta.stats.max_depth) ? this.props.lowering.lowering_additional_meta.stats.max_depth : null,
        bounding_box: (this.props.lowering.lowering_additional_meta.stats && this.props.lowering.lowering_additional_meta.stats.bounding_box) ? this.props.lowering.lowering_additional_meta.stats.bounding_box : [],
        dive_origin: (this.props.lowering.lowering_additional_meta.stats && this.props.lowering.lowering_additional_meta.stats.dive_origin) ? this.props.lowering.lowering_additional_meta.stats.dive_origin : [],
      },
      touched: false,
      depthChartOptions: {
        title: {
          text: null
        },
        chart: {
          height: 200,
          zoomType: 'x'
        },
        legend: {
          enabled: false
        },
        series: [
          {
            data: []
          }
        ],
        tooltip: {
          enabled: true,
          crosshairs: true,
          formatter: this.tooltipFormatter.bind(this)
        },
        xAxis: {
          type: 'datetime',
          plotLines: []
        },
        yAxis: {
          title: {
            text: null,
          },
          reversed: true
        },
        plotOptions: {
          series: {
            animation: false,
            events: {
              mouseOut: this.clearEvent.bind(this)
            },
            point: {
              events: {
                click: this.handleClick.bind(this),
                mouseOver: this.setEventbyTS.bind(this)
              },
              marker: {
                lineWidth: 1
              }
            },
          }
        }
      }
    }

    // this.auxDatasourceFilters = ['vehicleRealtimeNavData', 'vehicleReNavData'];
    this.auxDatasourceFilters = ['vehicleRealtimeNavData'];

    this.handleMoveEnd = this.handleMoveEnd.bind(this);
    this.handleZoomEnd = this.handleZoomEnd.bind(this);
    this.initMapView = this.initMapView.bind(this);
    this.setEventbyTS = this.setEventbyTS.bind(this);
    this.clearEvent = this.clearEvent.bind(this);
    this.handleTweak = this.handleTweak.bind(this);
    this.handleShowEditForm = this.handleShowEditForm.bind(this);

  }

  static propTypes = {
    lowering: PropTypes.object.isRequired,
    handleHide: PropTypes.func.isRequired,
    handleUpdateLowering: PropTypes.func.isRequired,
    message: PropTypes.string,
    errorMessage: PropTypes.string
  };

  componentDidMount() {
    this.initEvents(this.props.lowering.id)
    this.initLoweringTrackline(this.props.lowering.id)
  }

  componentDidUpdate() {
  }

  componentWillUnmount() {
    this.props.initLowering(this.props.lowering.id)
  }

  async initEvents() {

    const data = await axios.get(`${API_ROOT_URL}/api/v1/event_exports/bylowering/${this.props.lowering.id}`,
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

    return await data

  }

  async initLoweringTrackline() {
    this.setState({ fetching: true});

    let events = await this.initEvents()

    let tracklines = {}

    this.auxDatasourceFilters.map((auxDatasource) => {

      let trackline = {
        ts: [],
        polyline: L.polyline([]),
        depth: [],
      };
    
      events.map((event) => {

        let aux_data = event['aux_data'].find((aux_data => aux_data['data_source'] == auxDatasource))
        if(aux_data) {
          trackline.polyline.addLatLng([ parseFloat(aux_data['data_array'].find(data => data['data_name'] == 'latitude')['data_value']), parseFloat(aux_data['data_array'].find(data => data['data_name'] == 'longitude')['data_value'])]);
          trackline.ts.push(moment.utc(event['ts']).valueOf());
          trackline.depth.push([trackline.ts[trackline.ts.length-1], parseFloat(aux_data['data_array'].find(data => data['data_name'] == 'depth')['data_value'])]);
        }
      })

      if(trackline.ts.length > 0) {
        tracklines[auxDatasource] = trackline
      }
    })

    if(tracklines.vehicleRealtimeNavData) {
      this.setState((prevState) => { return { events: events, tracklines: tracklines, fetching: false, depthChartOptions: Object.assign(prevState.depthChartOptions, { series: [ { data: tracklines.vehicleRealtimeNavData.depth } ] }) } });
    }
    else {
      this.setState({ events: events, tracklines: tracklines, fetching: false }); 
    }
    this.initMapView();
  }

  initMapView() {
    if(this.state.tracklines.vehicleReNavData && !this.state.tracklines.vehicleReNavData.polyline.isEmpty()) {
      this.map.leafletElement.panTo(this.state.tracklines.vehicleReNavData.polyline.getBounds());
      this.map.leafletElement.fitBounds(this.state.tracklines.vehicleReNavData.polyline.getBounds());
    }
    else if(this.state.tracklines.vehicleRealtimeNavData && !this.state.tracklines.vehicleRealtimeNavData.polyline.isEmpty()) {
      this.map.leafletElement.panTo(this.state.tracklines.vehicleRealtimeNavData.polyline.getBounds().getCenter());
      this.map.leafletElement.fitBounds(this.state.tracklines.vehicleRealtimeNavData.polyline.getBounds());
    }
  }

  handleShowEditForm() {
    this.setState((prevState) => { return { show_edit_form: !prevState.show_edit_form}})  
  }

  handleTweak(milestones, stats) {
    this.setState({milestones, stats, touched: true, show_edit_form: false})
  }

  handleCalculateBoundingBox() {
    if(this.state.tracklines.vehicleRealtimeNavData && !this.state.tracklines.vehicleRealtimeNavData.polyline.isEmpty()) {
      let lowering_bounds = this.state.tracklines.vehicleRealtimeNavData.polyline.getBounds()
      this.setState((prevState) => { return { touched: true, stats: Object.assign(prevState.stats, { bounding_box: [lowering_bounds.getNorth(),lowering_bounds.getEast(),lowering_bounds.getSouth(),lowering_bounds.getWest()] }) } });
    }
  }

  handleCalculateMaxDepth() {

    if(this.state.tracklines.vehicleRealtimeNavData && this.state.tracklines.vehicleRealtimeNavData.depth.length > 0) {
      let maxDepth = this.state.tracklines.vehicleRealtimeNavData.depth.reduce((current_max_depth, depth) => {
        current_max_depth = (depth[1] > current_max_depth) ? depth[1] : current_max_depth
        return current_max_depth
      }, 0)

      this.setState((prevState) => { return { touched: true, stats: Object.assign(prevState.stats, { max_depth: maxDepth }) } });
      // this.setPlotLines()
    }
  }

  handleClick() {
    if(this.state.milestone_to_edit) {
      this.setState((prevState) => { return { touched: true, milestones: Object.assign(prevState.milestones, { [prevState.milestone_to_edit]: prevState.event.ts }) } });
      this.setMilestoneToEdit()
    }
  }

  handleUpdateLowering() {
    let loweringRecord = Object.assign({}, this.props.lowering)
    let loweringMilestones = Object.assign({}, this.state.milestones)
    let loweringStats = Object.assign({}, this.state.stats)

    loweringRecord.start_ts = loweringMilestones.lowering_start
    loweringRecord.stop_ts = loweringMilestones.lowering_stop
    delete loweringMilestones.lowering_start
    delete loweringMilestones.lowering_stop

    loweringRecord.lowering_additional_meta.milestones = loweringMilestones
    loweringRecord.lowering_additional_meta.stats = loweringStats

    this.props.handleUpdateLowering(loweringRecord)
    this.setState({touched: false})
  }

  setMilestoneToEdit(milestone = null) {
    if(milestone !== null && milestone !== this.state.milestone_to_edit) {
      this.setState({milestone_to_edit: milestone})
      // this.setPlotLines()
    }
    else {
      this.setState({milestone_to_edit: null}) 
    }
  }

  // setPlotLines() {

  //   // let plotLines = []

  //   let xAxis = this.state.depthChartOptions.xAxis
  //   xAxis.plotLines = []

  //   let milestones = Object.values(this.state.milestones)
  //   milestones.forEach((milestone) => {
  //     // propertyName is what you want
  //     // you can get the value like this: myObject[propertyName]
  //     if(milestone) {
  //       xAxis.plotLines.push({
  //           color: '#000000',
  //           width: 2,
  //           value: moment.utc(milestone).valueOf()
  //       })
  //     }
  //   })

  //   if(this.state.stats.max_depth) {
  //     let maxDepthPair = this.state.tracklines.vehicleRealtimeNavData.depth.find((depth) => depth[1] === this.state.stats.max_depth)
  //     if(maxDepthPair) {
  //       xAxis.plotLines.push({
  //           color: '#FF0000',
  //           width: 2,
  //           value: maxDepthPair[0]
  //       })
  //     }
  //   }

  //   this.setState((prevState) => { return { depthChartOptions: Object.assign(prevState.depthChartOptions, { xAxis: xAxis }) } });
  // }

  clearEvent(){
    this.setState({event: null})
  }

  setEventbyTS(e) {
    let tsStr = moment.utc(e.target.x).toISOString();
    this.setState({event: this.state.events.find(event => event.ts === tsStr)});
  }

  tooltipFormatter() {
    // console.log(this)
    let event_txt = `<b>EVENT: ${this.state.event.event_value}</b>`
    if(this.state.event.event_value === 'FREE_FORM') {
      event_txt = `<span>${event_txt}<br/><b>Text:</b> ${this.state.event.event_free_text}</span>`
    }
    else if(this.state.event.event_value === 'VEHICLE') {
      const milestone = this.state.event.event_options.find((option) => option['event_option_name'] === 'milestone')
      if(milestone) {
        event_txt = `<span>${event_txt}<br/><b>Milestone:</b> ${milestone['event_option_value']}</span>`
      }
    }

    return `${event_txt}<br/><span>${this.state.event.ts}</span><br/>
      ${(this.state.milestone_to_edit) ? '<span>Click to set ' + this.state.milestone_to_edit + '.</span>' : '' }`
  }

  handleZoomEnd() {
    if(this.map) {
      // console.log("zoom end:", this.map.leafletElement.getZoom())
      this.setState({zoom: this.map.leafletElement.getZoom()});
    }
  }

  handleMoveEnd() {
    if(this.map) {
      // console.log("move end:", this.map.leafletElement.getCenter())
      this.setState({center: this.map.leafletElement.getCenter()});
    }
  }

  renderMarker() {

    if(this.state.event) {

      const realtimeNavData = this.state.event.aux_data.find((data) => data['data_source'] === 'vehicleRealtimeNavData');
      return (
        <Marker position={[ parseFloat(realtimeNavData['data_array'].find(data => data['data_name'] == 'latitude')['data_value']), parseFloat(realtimeNavData['data_array'].find(data => data['data_name'] == 'longitude')['data_value'])]}>
          <Popup>
            You are here! :-)
          </Popup>
        </Marker>
      );
    }
  }

  renderAlert() {
    if (this.props.errorMessage) {
      return (
        <Alert variant="danger">
          <strong>Opps!</strong> {this.props.errorMessage}
        </Alert>
      )
    }
  }

  renderMessage() {
    if (this.props.message) {
      return (
        <Alert variant="success">
          <strong>Success!</strong> {this.props.message}
        </Alert>
      )
    }
  }

  render() {
    const { show, handleHide } = this.props

    const baseLayers = tilelayers.map((layer, index) => {
      if(layer.wms) {
        return (
          <BaseLayer checked={layer.default} key={`baseLayer_${index}`} name={layer.name}>
            <WMSTileLayer
              attribution={layer.attribution}
              url={layer.url}
              layers={layer.layers}
              transparent={layer.transparent}
            />
          </BaseLayer>
        )
      }
      else {
        return (
          <BaseLayer checked={layer.default} key={`baseLayer_${index}`} name={layer.name}>
            <TileLayer
              attribution={layer.attribution}
              url={layer.url}
            />
          </BaseLayer>
        )
      }
    })

    // if (this.state.tracklines.vehicleRealtimeNavData && this.state.tracklines.vehicleRealtimeNavData.depth) {
    //   console.log("depth:", this.state.tracklines.vehicleRealtimeNavData.depth)
    // }

    const milestones_and_stats = (this.state.show_edit_form) ?
      <Col md={12}>
        <UpdateLoweringStatsForm milestones={this.state.milestones} stats={this.state.stats} handleHide={this.handleShowEditForm} handleFormSubmit={this.handleTweak}/>
      </Col>
    : [<Col key="milestones" md={6}>
        <div>
          <span className={(this.state.milestone_to_edit == 'lowering_start')? "text-warning" : ""} onClick={() => this.setMilestoneToEdit('lowering_start')}>Dive Start: {this.state.milestones.lowering_start}</span><br/>
          <span className={(this.state.milestone_to_edit == 'lowering_on_bottom')? "text-warning" : ""} onClick={() => this.setMilestoneToEdit('lowering_on_bottom')}>On Bottom: {this.state.milestones.lowering_on_bottom}</span><br/>
          <span className={(this.state.milestone_to_edit == 'lowering_off_bottom')? "text-warning" : ""} onClick={() => this.setMilestoneToEdit('lowering_off_bottom')}>Off Bottom: {this.state.milestones.lowering_off_bottom}</span><br/>
          <span className={(this.state.milestone_to_edit == 'lowering_stop')? "text-warning" : ""} onClick={() => this.setMilestoneToEdit('lowering_stop')}>Dive End: {this.state.milestones.lowering_stop}</span>
        </div>
      </Col>,
      <Col key="stats" md={6}>
        <div>
          <span>Max Depth: {this.state.stats.max_depth} <OverlayTrigger placement="top" overlay={<Tooltip id="maxDepthTooltip">Click to calculate max depth from depth data.</Tooltip>}><FontAwesomeIcon className="text-primary" onClick={ () => this.handleCalculateMaxDepth() } icon='calculator' fixedWidth/></OverlayTrigger></span><br/>
          <span>Bounding Box: {(this.state.stats.bounding_box) ? this.state.stats.bounding_box.join(", ") : ""}  <OverlayTrigger placement="top" overlay={<Tooltip id="boundingBoxTooltip">Click to calculate the bounding box from position data.</Tooltip>}><FontAwesomeIcon className="text-primary" onClick={ () => this.handleCalculateBoundingBox() } icon='calculator' fixedWidth/></OverlayTrigger></span><br/>
          <span>Dive Origin: {(this.state.stats.dive_origin) ? this.state.stats.dive_origin.join(", ") : ""}</span><br/>
        </div>
      </Col>]     

    const depth_profile = 
      <HighchartsReact
        highcharts={Highcharts}
        options={this.state.depthChartOptions}
        oneToOne={true}
      />

    const realtimeTrack = (this.state.tracklines.vehicleRealtimeNavData && !this.state.tracklines.vehicleRealtimeNavData.polyline.isEmpty()) ? 
      <Polyline color="lime" positions={this.state.tracklines.vehicleRealtimeNavData.polyline.getLatLngs()} />
      : null;

    const reNavTrack = (this.state.tracklines.vehicleReNavData && !this.state.tracklines.vehicleReNavData.polyline.isEmpty()) ? 
      <Polyline color="red" positions={this.state.tracklines.vehicleReNavData.polyline.getLatLngs()} />
      : null;
    
    if(!this.state.fetching) {
      return (
        <Modal size="lg" show={show} onHide={handleHide}>
            <Modal.Header closeButton>
              <Modal.Title as="h5">Lowering Details: {this.props.lowering.lowering_id}</Modal.Title>
            </Modal.Header>

            <Modal.Body>
              <Row style={{paddingTop: "8px"}}>
                <Col xs={12}>
                  <Map
                    style={{ height: this.state.height }}
                    center={this.state.center}
                    zoom={this.state.zoom}
                    onMoveEnd={this.handleMoveEnd}
                    onZoomEnd={this.handleZoomEnd}
                    ref={ (map) => this.map = map}
                  >
                  <LayersControl position="topright">
                    {baseLayers}
                  </LayersControl>
                  <ScaleControl position="bottomleft" />
                    {realtimeTrack}
                    {reNavTrack}
                    {this.renderMarker()}
                  </Map>
                </Col>
              </Row>
              <Row style={{paddingTop: "8px"}}>
                <Col xs={12}>
                  {depth_profile}
                </Col>
              </Row>
              <Row style={{paddingTop: "8px"}}>
                {milestones_and_stats}
              </Row>
              <Row style={{paddingTop: "8px"}}>
                <Col xs={12}>
                  {this.renderAlert()}
                  {this.renderMessage()}
                </Col>
              </Row>
              <Row style={{paddingTop: "8px"}}>
                <Col xs={12}>
                  <span className="float-right">
                    {(!this.state.show_edit_form) ? <Button variant="warning" size="sm" onClick={() => this.handleShowEditForm()}>Tweak!</Button> : null}
                    {(!this.state.show_edit_form) ? <Button variant="secondary" size="sm" onClick={handleHide}>Close</Button> : null}
                    {(!this.state.show_edit_form) ? <Button variant="primary" size="sm" disabled={!this.state.touched} onClick={() => this.handleUpdateLowering()}>Update</Button> : null}
                  </span>
                </Col>
              </Row>
            </Modal.Body>
        </Modal>
      );
    } else {
      return (
        <Modal size="lg" show={show} onHide={handleHide}>
          <Modal.Body>
            Loading...
          </Modal.Body>
        </Modal>
      );
    }
  }
}

                    // {this.renderMarker()}

              // <Row style={{paddingTop: "8px"}}>
                // <Col xs={12}>
                  // {this.renderDepthCard()}
                // </Col>
              // </Row>


function mapStateToProps(state) {

  return {
    roles: state.user.profile.roles,
    errorMessage: state.lowering.lowering_error,
    message: state.lowering.lowering_message,
  }

}

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  connectModal({ name: 'setLoweringStats', destroyOnHide: true })
)(SetLoweringStatsModal);
