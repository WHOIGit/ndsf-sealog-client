import React, { Component } from 'react';
import path from 'path';
import { connect } from 'react-redux';
import axios from 'axios';
import Cookies from 'universal-cookie';
import { Row, Col, Tabs, Tab } from 'react-bootstrap';
import EventShowDetailsModal from './event_show_details_modal';
import LoweringGalleryTab from './lowering_gallery_tab';
import LoweringDropdown from './lowering_dropdown';
import LoweringModeDropdown from './lowering_mode_dropdown';
import * as mapDispatchToProps from '../actions';
import { API_ROOT_URL, IMAGE_PATH } from '../client_config';

const cookies = new Cookies();

class LoweringGallery extends Component {

  constructor (props) {
    super(props);

    this.state = {
      fetching: false,
      aux_data: []
    };

    this.handleLoweringSelect = this.handleLoweringSelect.bind(this);
    this.handleLoweringModeSelect = this.handleLoweringModeSelect.bind(this);

  }

  componentDidMount() {
    this.initLoweringImages(this.props.match.params.id);

    if(!this.props.lowering.id || this.props.lowering.id !== this.props.match.params.id || this.props.event.events.length === 0) {
      this.props.initLowering(this.props.match.params.id);
    }

    if(!this.props.cruise.id || this.props.lowering.id !== this.props.match.params.id){
      this.props.initCruiseFromLowering(this.props.match.params.id);
    }
  }

  componentDidUpdate() {
  }

  componentWillUnmount(){
  }

  async initLoweringImages(id, auxDatasourceFilter = 'vehicleRealtimeFramegrabberData') {
    this.setState({ fetching: true});

    const image_data = await axios.get(`${API_ROOT_URL}/api/v1/event_aux_data/bylowering/${id}?datasource=${auxDatasourceFilter}`,
      {
        headers: {
          authorization: cookies.get('token')
        }
      }).then((response) => {

      let image_data = {};
      response.data.forEach((data) => {
        for (let i = 0; i < data.data_array.length; i+=2) {
          if(!(data.data_array[i].data_value in image_data)){
            image_data[data.data_array[i].data_value] = { images: [] };
          }

          image_data[data.data_array[i].data_value].images.unshift({ event_id: data.event_id, filepath: API_ROOT_URL + IMAGE_PATH + '/' + path.basename(data.data_array[i+1].data_value) });
        }
      });

      return image_data;
    }).catch((error)=>{
      if(error.response.data.statusCode !== 404) {
        console.error(error);
      }
      return [];
    });

    this.setState({ aux_data: image_data, fetching: false });

  }

  handleLoweringSelect(id) {
    this.props.gotoLoweringGallery(id);
    this.props.initLowering(id, this.state.hideASNAP);
    this.props.initCruiseFromLowering(id);
    this.initLoweringImages(id);

  }

  handleLoweringModeSelect(mode) {
    if(mode === "Review") {
      this.props.gotoLoweringReview(this.props.match.params.id);
    } else if (mode === "Gallery") {
      this.props.gotoLoweringGallery(this.props.match.params.id);
    } else if (mode === "Map") {
      this.props.gotoLoweringMap(this.props.match.params.id);
    } else if (mode === "Replay") {
      this.props.gotoLoweringReplay(this.props.match.params.id);
    }
  }

  renderGalleries() {

    let galleries = [];
    for (const [key, value] of Object.entries(this.state.aux_data)) {
      galleries.push((
        <Tab key={`tab_${key}`} eventKey={`tab_${key}`} title={key}>
          <LoweringGalleryTab imagesSource={key} imagesData={value}/>
        </Tab>

      ));
    }

    return (galleries.length > 0 )?
      (
        <Tabs id="galleries">
          { galleries }
        </Tabs>
      ) :  (<div><hr className="border-secondary"/><span style={{paddingLeft: "8px"}}>No images found</span></div>);
  }

  render(){

    const cruise_id = (this.props.cruise.cruise_id)? this.props.cruise.cruise_id : "loading...";
    const galleries = (this.state.fetching)? <div><hr className="border-secondary"/><span style={{paddingLeft: "8px"}}>Loading...</span></div> : this.renderGalleries();
    return (
      <div>
        <EventShowDetailsModal />
        <Row>
          <Col lg={12}>
            <span style={{paddingLeft: "8px"}}>
              <span onClick={() => this.props.gotoCruiseMenu()} className="text-warning">{cruise_id}</span>
              {' '}/{' '}
              <span><LoweringDropdown onClick={this.handleLoweringSelect} active_cruise={this.props.cruise} active_lowering={this.props.lowering}/></span>
              {' '}/{' '}
              <span><LoweringModeDropdown onClick={this.handleLoweringModeSelect} active_mode={"Gallery"} modes={["Review", "Replay", "Map"]}/></span>
            </span>
          </Col>
          <Col lg={12}>
            {galleries}
          </Col>
        </Row>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    roles: state.user.profile.roles,
    event: state.event,
    cruise: state.cruise.cruise,
    lowering: state.lowering.lowering
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(LoweringGallery);