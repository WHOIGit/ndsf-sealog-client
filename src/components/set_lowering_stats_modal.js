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
import { Button, Row, Col, Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { renderAlert, renderMessage } from './form_elements';
import UpdateLoweringStatsForm from './update_lowering_stats_form';
import { API_ROOT_URL, CUSTOM_LOWERING_NAME } from '../client_config';
import { DEFAULT_LOCATION, TILE_LAYERS } from '../map_tilelayers';
import * as mapDispatchToProps from '../actions';

HighchartsExporting(Highcharts);
HighchartsNoDataToDisplay(Highcharts);

const { BaseLayer } = LayersControl

const cookies = new Cookies();

class SetLoweringStatsModal extends Component {

  constructor (props) {
    super(props);

    this.state = {
      lowering: {},
      lowering_name: (CUSTOM_LOWERING_NAME)? CUSTOM_LOWERING_NAME[0].charAt(0).toUpperCase() + CUSTOM_LOWERING_NAME[0].slice(1) : "Lowering",

      posDataSource: null,

      event: null,

      fetching: false,
      tracklines: {},
      events: [],

      show_edit_form: false,

      zoom: 13,
      center:DEFAULT_LOCATION,
      position:DEFAULT_LOCATION,
      showMarker: false,
      height: "400px",

      milestone_to_edit: null,
      milestones: {
        lowering_start: this.props.lowering.start_ts,
        lowering_in_water: (this.props.lowering.lowering_additional_meta.milestones && this.props.lowering.lowering_additional_meta.milestones.lowering_in_water) ? this.props.lowering.lowering_additional_meta.milestones.lowering_in_water : null,
        lowering_descending: (this.props.lowering.lowering_additional_meta.milestones && this.props.lowering.lowering_additional_meta.milestones.lowering_descending) ? this.props.lowering.lowering_additional_meta.milestones.lowering_descending : null,
        lowering_on_bottom: (this.props.lowering.lowering_additional_meta.milestones && this.props.lowering.lowering_additional_meta.milestones.lowering_on_bottom) ? this.props.lowering.lowering_additional_meta.milestones.lowering_on_bottom : null,
        lowering_off_bottom: (this.props.lowering.lowering_additional_meta.milestones && this.props.lowering.lowering_additional_meta.milestones.lowering_off_bottom) ? this.props.lowering.lowering_additional_meta.milestones.lowering_off_bottom : null,
        lowering_on_surface: (this.props.lowering.lowering_additional_meta.milestones && this.props.lowering.lowering_additional_meta.milestones.lowering_on_surface) ? this.props.lowering.lowering_additional_meta.milestones.lowering_on_surface : null,
        lowering_out_of_water: (this.props.lowering.lowering_additional_meta.milestones && this.props.lowering.lowering_additional_meta.milestones.lowering_out_of_water) ? this.props.lowering.lowering_additional_meta.milestones.lowering_out_of_water : null,
        lowering_stop: this.props.lowering.stop_ts,
        lowering_aborted: (this.props.lowering.lowering_additional_meta.milestones && this.props.lowering.lowering_additional_meta.milestones.lowering_aborted) ? this.props.lowering.lowering_additional_meta.milestones.lowering_aborted : null,
      },
      stats: {
        max_depth: (this.props.lowering.lowering_additional_meta.stats && this.props.lowering.lowering_additional_meta.stats.max_depth) ? this.props.lowering.lowering_additional_meta.stats.max_depth : null,
        bounding_box: (this.props.lowering.lowering_additional_meta.stats && this.props.lowering.lowering_additional_meta.stats.bounding_box) ? this.props.lowering.lowering_additional_meta.stats.bounding_box : []
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
          min: 0,
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

    this.auxDatasourceFilters = ['vehicleRealtimeNavData','vehicleRealtimeHipapData'];

    this.handleMoveEnd = this.handleMoveEnd.bind(this);
    this.handleZoomEnd = this.handleZoomEnd.bind(this);
    this.initMapView = this.initMapView.bind(this);
    this.setEventbyTS = this.setEventbyTS.bind(this);
    this.clearEvent = this.clearEvent.bind(this);
    this.handleTweak = this.handleTweak.bind(this);
    this.handleShowEditForm = this.handleShowEditForm.bind(this);

  }

  static propTypes = {
    lowering: PropTypes.object,
    handleHide: PropTypes.func.isRequired,
    handleUpdateLowering: PropTypes.func,
    message: PropTypes.string,
    errorMessage: PropTypes.string
  };

  componentDidMount() {
    this.initEvents(this.props.lowering.id);
    this.initLoweringTrackline(this.props.lowering.id);
    this.setPlotLines();
  }

  componentDidUpdate(prevProps, prevState) {

    if(this.state.milestones !== prevState.milestones) {
      this.setPlotLines();
    }

    if(this.state.milestone_to_edit !== prevState.milestone_to_edit) {
      this.setPlotLines();
    }

  }

  componentWillUnmount() {
    if (this.props.lowering) {
      this.props.initLowering(this.props.lowering.id)
    }
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
          try {
            const rawLat = aux_data['data_array'].find(data => data['data_name'] == 'latitude');
            const rawLng = aux_data['data_array'].find(data => data['data_name'] == 'longitude');

            if(rawLat && rawLng) {
              const latLng = [ parseFloat(rawLat['data_value']), parseFloat(rawLng['data_value'])]
              if(latLng[0] != 0 && latLng[0] != 0) {
                trackline.polyline.addLatLng(latLng);
              }
            }

            const depth = aux_data['data_array'].find(data => data['data_name'] == 'depth');

            if(depth) {
              trackline.ts.push(moment.utc(event['ts']).valueOf());
              trackline.depth.push([trackline.ts[trackline.ts.length-1], parseFloat(depth['data_value'])]);
            }
          }
          catch(err) {
            console.log("No latLng found, skipping...");
            console.error(err);
          }
        }
      })

      if(trackline.ts.length > 0) {
        tracklines[auxDatasource] = trackline
      }
    })

    for (let index=0;index<this.auxDatasourceFilters.length;index++) {
      if (tracklines[this.auxDatasourceFilters[index]]) {
        this.setState((prevState) => {
          return { events: events, tracklines: tracklines, fetching: false, depthChartOptions: { ...prevState.depthChartOptions, series: [ { data: tracklines[this.auxDatasourceFilters[index]].depth } ] }, posDataSource: this.auxDatasourceFilters[index] }
        });

        break;
      }
    }

    if(this.state.fetching) {
      this.setState({ events: events, tracklines: tracklines, fetching: false }); 
    }

    this.initMapView();
  }

  initMapView() {

    if(this.state.tracklines[this.state.posDataSource] && !this.state.tracklines[this.state.posDataSource].polyline.isEmpty()) {
      this.map.leafletElement.panTo(this.state.tracklines[this.state.posDataSource].polyline.getBounds().getCenter());
      this.map.leafletElement.fitBounds(this.state.tracklines[this.state.posDataSource].polyline.getBounds());
    }
  }

  handleShowEditForm() {
    this.setState((prevState) => { return { show_edit_form: !prevState.show_edit_form}})  
  }

  handleTweak(milestones, stats) {

    this.setState({milestones, stats})

    const start_ts = moment.utc(milestones.lowering_start);
    const stop_ts = moment.utc(milestones.lowering_stop);
    
    const newMilestones = {...milestones}
    delete newMilestones.lowering_start;
    delete newMilestones.lowering_stop;

    const lowering_additional_meta = { ...this.props.lowering.lowering_additional_meta, milestones: newMilestones, stats }

    const newLoweringRecord = { ...this.props.lowering, start_ts, stop_ts, lowering_additional_meta }

    this.props.handleUpdateLowering(newLoweringRecord)
    this.setState({milestones, stats, touched: false, show_edit_form: false})
  }

  handleCalculateBoundingBox() {
    if(this.state.tracklines[this.state.posDataSource] && !this.state.tracklines[this.state.posDataSource].polyline.isEmpty()) {
      let lowering_bounds = this.state.tracklines[this.state.posDataSource].polyline.getBounds()
      this.setState((prevState) => { return { touched: true, stats: { ...prevState.stats, bounding_box: [lowering_bounds.getNorth(),lowering_bounds.getEast(),lowering_bounds.getSouth(),lowering_bounds.getWest()] } } });
    }
  }

  handleCalculateMaxDepth() {
    if(this.state.tracklines[this.state.posDataSource] && this.state.tracklines[this.state.posDataSource].depth.length > 0) {
      let maxDepth = this.state.tracklines[this.state.posDataSource].depth.reduce((current_max_depth, depth) => {
        current_max_depth = (depth[1] > current_max_depth) ? depth[1] : current_max_depth
        return current_max_depth
      }, 0)

      this.setState((prevState) => { return { touched: true, stats: { ...prevState.stats, max_depth: maxDepth } } });
    }
  }

  handleClick() {
    if(this.state.milestone_to_edit) {
      this.setState((prevState) => { return { touched: true, milestones: { ...prevState.milestones, [prevState.milestone_to_edit]: prevState.event.ts } } });
      this.setMilestoneToEdit()
    }
  }

  handleUpdateLowering() {
    const newMilestones = { ...this.state.milestones };
    delete newMilestones.lowering_start;
    delete newMilestones.lowering_stop;

    const newLoweringAdditionalMeta = { ...this.props.lowering.lowering_additional_meta, milestones: newMilestones, stats: this.state.stats }

    const newLoweringRecord = { ...this.props.lowering, start_ts: this.state.milestones.lowering_start, stop_ts: this.state.milestones.lowering_stop, lowering_additional_meta: newLoweringAdditionalMeta }

    this.props.handleUpdateLowering(newLoweringRecord)
    this.setState({touched: false})
  }

  setMilestoneToEdit(milestone = null) {
    if(milestone !== null && milestone !== this.state.milestone_to_edit) {
      this.setState({milestone_to_edit: milestone})
    }
    else {
      this.setState({milestone_to_edit: null}) 
    }
  }

  setPlotLines() {

    let xAxis = this.state.depthChartOptions.xAxis
    xAxis.plotLines = []

    for (const [key, value] of Object.entries(this.state.milestones)) {
      if(value) {
        if(key === this.state.milestone_to_edit) {
          xAxis.plotLines.push({
              color: '#FF0000',
              width: 2,
              value: moment.utc(value).valueOf()
          })
        }
        else {
          xAxis.plotLines.push({
              color: '#CFCFCF',
              width: 2,
              value: moment.utc(value).valueOf()
          })
        }
      }
    }

    this.setState((prevState) => { return { depthChartOptions: { ...prevState.depthChartOptions, xAxis: xAxis } } });
  }

  clearEvent(){
    this.setState({event: null})
  }

  setEventbyTS(e) {
    let tsStr = moment.utc(e.target.x).toISOString();
    this.setState({event: this.state.events.find(event => event.ts === tsStr)});
  }

  tooltipFormatter() {
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
      this.setState({zoom: this.map.leafletElement.getZoom()});
    }
  }

  handleMoveEnd() {
    if(this.map) {
      this.setState({center: this.map.leafletElement.getCenter()});
    }
  }

  renderMarker() {

    if(this.state.event) {

      const posData = this.state.event.aux_data.find((data) => data['data_source'] === this.state.posDataSource);
      const rawLat = posData['data_array'].find(data => data['data_name'] == 'latitude')
      const rawLng = posData['data_array'].find(data => data['data_name'] == 'longitude')
      if( rawLat && rawLng ) {
        return (
          <Marker position={[ parseFloat(rawLat['data_value']), parseFloat(rawLng['data_value'])]}>
            <Popup>
              You are here! :-)
            </Popup>
          </Marker>
        );
      }
    }
  }

  render() {
    const { show, handleHide } = this.props

    const baseLayers = TILE_LAYERS.map((layer, index) => {
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
              tms={layer.tms ?? false}
              zoomOffset={layer.zoomOffset ?? 0}
              maxNativeZoom={layer.maxNativeZoom}
            />
          </BaseLayer>
        )
      }
    })

    const milestones_and_stats = (this.state.show_edit_form) ?
      <Col md={12}>
        <UpdateLoweringStatsForm milestones={this.state.milestones} stats={this.state.stats} handleHide={this.handleShowEditForm} handleFormSubmit={this.handleTweak}/>
      </Col>
    : [<Col key="milestones" md={6}>
        <div>
          <span className={(this.state.milestone_to_edit == 'lowering_start')? "text-warning" : ""} onClick={() => this.setMilestoneToEdit('lowering_start')}>Off Deck: {this.state.milestones.lowering_start}</span><br/>
          <span className={(this.state.milestone_to_edit == 'lowering_in_water')? "text-warning" : ""} onClick={() => this.setMilestoneToEdit('lowering_in_water')}>In Water: {this.state.milestones.lowering_in_water}</span><br/>
          <span className={(this.state.milestone_to_edit == 'lowering_descending')? "text-warning" : ""} onClick={() => this.setMilestoneToEdit('lowering_descending')}>Descending: {this.state.milestones.lowering_descending}</span><br/>
          <span className={(this.state.milestone_to_edit == 'lowering_on_bottom')? "text-warning" : ""} onClick={() => this.setMilestoneToEdit('lowering_on_bottom')}>On Bottom: {this.state.milestones.lowering_on_bottom}</span><br/>
          <span className={(this.state.milestone_to_edit == 'lowering_off_bottom')? "text-warning" : ""} onClick={() => this.setMilestoneToEdit('lowering_off_bottom')}>Off Bottom: {this.state.milestones.lowering_off_bottom}</span><br/>
          <span className={(this.state.milestone_to_edit == 'lowering_on_surface')? "text-warning" : ""} onClick={() => this.setMilestoneToEdit('lowering_on_surface')}>On Surface: {this.state.milestones.lowering_on_surface}</span><br/>
          <span className={(this.state.milestone_to_edit == 'lowering_out_of_water')? "text-warning" : ""} onClick={() => this.setMilestoneToEdit('lowering_out_of_water')}>Out of Water: {this.state.milestones.lowering_out_of_water}</span><br/>
          <span className={(this.state.milestone_to_edit == 'lowering_stop')? "text-warning" : ""} onClick={() => this.setMilestoneToEdit('lowering_stop')}>On Deck: {this.state.milestones.lowering_stop}</span><br/>
          <span className={(this.state.milestone_to_edit == 'lowering_aborted')? "text-warning" : ""} onClick={() => this.setMilestoneToEdit('lowering_aborted')}>Aborted: {this.state.milestones.lowering_aborted}</span>
        </div>
      </Col>,
      <Col key="stats" md={6}>
        <div>
          <span>Max Depth: {this.state.stats.max_depth} <OverlayTrigger placement="top" overlay={<Tooltip id="maxDepthTooltip">Click to calculate max depth from depth data.</Tooltip>}><FontAwesomeIcon className="text-primary" onClick={ () => this.handleCalculateMaxDepth() } icon='calculator' fixedWidth/></OverlayTrigger></span><br/>
          <span>Bounding Box: {(this.state.stats.bounding_box) ? this.state.stats.bounding_box.join(", ") : ""}  <OverlayTrigger placement="top" overlay={<Tooltip id="boundingBoxTooltip">Click to calculate the bounding box from position data.</Tooltip>}><FontAwesomeIcon className="text-primary" onClick={ () => this.handleCalculateBoundingBox() } icon='calculator' fixedWidth/></OverlayTrigger></span><br/>
        </div>
      </Col>]     

    const depth_profile = 
      <HighchartsReact
        highcharts={Highcharts}
        options={this.state.depthChartOptions}
        oneToOne={true}
      />

    const trackLine = (this.state.tracklines[this.state.posDataSource] && !this.state.tracklines[this.state.posDataSource].polyline.isEmpty()) ?
      <Polyline color="lime" positions={this.state.tracklines[this.state.posDataSource].polyline.getLatLngs()} />
    : null;
    
    if(this.props.lowering) {
      if(!this.state.fetching) {
        return (
          <Modal size="lg" show={show} onHide={handleHide}>
            <Modal.Header closeButton>
              <Modal.Title as="h5">{this.props.lowering.lowering_id} - Milestones / Stats</Modal.Title>
            </Modal.Header>

            <Modal.Body>
              <Row className="mt-2">
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
                    {trackLine}
                    {this.renderMarker()}
                  </Map>
                </Col>
              </Row>
              <Row className="mt-2">
                <Col xs={12}>
                  {depth_profile}
                </Col>
              </Row>
              <Row className="mt-2">
                {milestones_and_stats}
              </Row>
              <Row className="mt-2">
                <Col xs={12}>
                  {renderAlert(this.props.errorMessage)}
                  {renderMessage(this.props.message)}
                </Col>
              </Row>
              <Row className="mt-2">
                <Col xs={12}>
                  <span className="float-right">
                    {(!this.state.show_edit_form) ? <Button className="mr-1" variant="warning" size="sm" onClick={() => this.handleShowEditForm()}>Tweak!</Button> : null}
                    {(!this.state.show_edit_form) ? <Button className="mr-1" variant="secondary" size="sm" onClick={handleHide}>Close</Button> : null}
                    {(!this.state.show_edit_form) ? <Button className="mr-1" variant="primary" size="sm" disabled={!this.state.touched} onClick={() => this.handleUpdateLowering()}>Update</Button> : null}
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
    else {
      return null;
    }
  }
}

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
