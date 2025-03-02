import React, { Component } from 'react';
import axios from 'axios';
import Cookies from 'universal-cookie';
import { Map, TileLayer, WMSTileLayer, Marker, Polyline, LayersControl, ScaleControl } from 'react-leaflet';
import L from 'leaflet';
import { API_ROOT_URL } from 'client_config';
import { TILE_LAYERS, DEFAULT_LOCATION } from 'map_tilelayers';

const { BaseLayer } = LayersControl;
const cookies = new Cookies();

class LoweringMapDisplay extends Component {
  constructor(props) {
    super(props);

    this.state = {
      fetching: false,
      tracklines: {},
      posDataSource: null,
      zoom: 13,
      center: DEFAULT_LOCATION,
      position: DEFAULT_LOCATION,
      height: props.height || "300px"
    };

    this.auxDatasourceFilters = ['vehicleRealtimeNavData', 'vehicleRealtimeUSBLData'];
    
    this.handleMoveEnd = this.handleMoveEnd.bind(this);
    this.handleZoomEnd = this.handleZoomEnd.bind(this);
    this.initMapView = this.initMapView.bind(this);
  }

  componentDidMount() {
    if (this.props.loweringID) {
      this.initLoweringTrackline(this.props.loweringID);
    }
  }

  componentDidUpdate(prevProps) {
    if (this.map) {
      this.map.leafletElement.invalidateSize();
    }

    if (prevProps.loweringID !== this.props.loweringID && this.props.loweringID) {
      this.initLoweringTrackline(this.props.loweringID);
    }

    if (prevProps.selectedEvent !== this.props.selectedEvent) {
      // Force map to recenter on new marker position
      this.initMapView();
    }
  }

  async initLoweringTrackline(id) {
    this.setState({ fetching: true });

    let tracklines = {};

    for (let index = 0; index < this.auxDatasourceFilters.length; index++) {
      let trackline = {
        eventIDs: [],
        polyline: L.polyline([]),
      };

      let url = `${API_ROOT_URL}/api/v1/event_aux_data/bylowering/${id}?datasource=${this.auxDatasourceFilters[index]}`;
      await axios.get(url, {
        headers: {
          authorization: cookies.get('token')
        }
      }).then((response) => {
        response.data.forEach((r_data) => {
          const latLng = [
            parseFloat(r_data['data_array'].find(data => data['data_name'] === 'latitude')['data_value']), 
            parseFloat(r_data['data_array'].find(data => data['data_name'] === 'longitude')['data_value'])
          ];
          if (latLng[0] !== 0 && latLng[1] !== 0) {
            trackline.polyline.addLatLng(latLng);
            trackline.eventIDs.push(r_data['event_id']);
          }
        });
      }).catch((error) => {
        if (error.response && error.response.data.statusCode === 404) {
          console.warn("No", this.auxDatasourceFilters[index], "data found");
        }
      });

      if (trackline.eventIDs.length > 0) {
        tracklines[this.auxDatasourceFilters[index]] = trackline;
      }
    }

    for (let index = 0; index < this.auxDatasourceFilters.length; index++) {
      if (tracklines[this.auxDatasourceFilters[index]]) {
        this.setState({ 
          tracklines: tracklines, 
          fetching: false, 
          posDataSource: this.auxDatasourceFilters[index] 
        });
        break;
      }
    }

    this.initMapView();
  }

  initMapView() {
    if (this.state.tracklines[this.state.posDataSource] && 
        !this.state.tracklines[this.state.posDataSource].polyline.isEmpty()) {
      this.map.leafletElement.panTo(this.state.tracklines[this.state.posDataSource].polyline.getBounds().getCenter());
      this.map.leafletElement.fitBounds(this.state.tracklines[this.state.posDataSource].polyline.getBounds());
    }
  }

  handleZoomEnd() {
    if (this.map) {
      this.setState({ zoom: this.map.leafletElement.getZoom() });
    }
  }

  handleMoveEnd() {
    if (this.map) {
      this.setState({ center: this.map.leafletElement.getCenter() });
    }
  }

  renderMarker() {
    if (this.props.selectedEvent && 
        this.props.selectedEvent.aux_data && 
        typeof this.props.selectedEvent.aux_data.find((data) => data['data_source'] === this.state.posDataSource) !== 'undefined') {

      const posData = this.props.selectedEvent.aux_data.find((data) => data['data_source'] === this.state.posDataSource);
      try {
        const latLng = [
          parseFloat(posData['data_array'].find(data => data['data_name'] === 'latitude')['data_value']), 
          parseFloat(posData['data_array'].find(data => data['data_name'] === 'longitude')['data_value'])
        ];
        return (
          <Marker position={latLng}>
            {this.props.renderPopup ? this.props.renderPopup() : null}
          </Marker>
        );
      } catch (err) {
        return null;
      }
    }
    return null;
  }

  render() {
    const baseLayers = TILE_LAYERS.map((layer, index) => {
      if (layer.wms) {
        return (
          <BaseLayer checked={layer.default} key={`baseLayer_${index}`} name={layer.name}>
            <WMSTileLayer
              attribution={layer.attribution}
              url={layer.url}
              layers={layer.layers}
              transparent={layer.transparent}
            />
          </BaseLayer>
        );
      } else {
        return (
          <BaseLayer checked={layer.default} key={`baseLayer_${index}`} name={layer.name}>
            <TileLayer
              attribution={layer.attribution}
              url={layer.url}
              maxNativeZoom={layer.maxNativeZoom}
            />
          </BaseLayer>
        );
      }
    });

    let trackLine = null;
    for (let index = 0; index < this.auxDatasourceFilters.length; index++) {
      if (this.state.tracklines[this.auxDatasourceFilters[index]] && 
          !this.state.tracklines[this.auxDatasourceFilters[index]].polyline.isEmpty()) {
        trackLine = <Polyline color="lime" positions={this.state.tracklines[this.auxDatasourceFilters[index]].polyline.getLatLngs()} />;
        break;
      }
    }

    return (
      <Map
        style={{ height: this.state.height }}
        center={this.state.center}
        zoom={this.state.zoom}
        onMoveEnd={this.handleMoveEnd}
        onZoomEnd={this.handleZoomEnd}
        ref={(map) => this.map = map}
      >
        <ScaleControl position="bottomleft" />
        <LayersControl position="topright">
          {baseLayers}
        </LayersControl>
        {trackLine}
        {this.renderMarker()}
      </Map>
    );
  }
}

export default LoweringMapDisplay; 