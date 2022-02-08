import React, { Component } from 'react';
import { connect } from 'react-redux';
import axios from 'axios';
import Cookies from 'universal-cookie';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ButtonToolbar, Row, Col, Tabs, Tab, Form, FormControl } from 'react-bootstrap';
import EventShowDetailsModal from './event_show_details_modal';
import LoweringGalleryTab from './lowering_gallery_tab';
import LoweringDropdown from './lowering_dropdown';
import LoweringModeDropdown from './lowering_mode_dropdown';
import * as mapDispatchToProps from '../actions';
import { API_ROOT_URL } from 'client_config';
import { getImageUrl } from '../utils';
import { getCruiseByLowering, getLowering } from '../api';

const cookies = new Cookies();

class LoweringGallery extends Component {

  constructor (props) {
    super(props);

    this.state = {
      fetching: false,
      aux_data: [],
      maxImagesPerPage: 16,
      filterTimer: null,
      filter: '',
      cruise: props.cruise,
      lowering: props.lowering,
    };

    this.handleSearchChange = this.handleSearchChange.bind(this);
    this.handleLoweringSelect = this.handleLoweringSelect.bind(this);
    this.handleImageCountChange = this.handleImageCountChange.bind(this);
    this.handleLoweringModeSelect = this.handleLoweringModeSelect.bind(this);

  }

  componentDidMount() {
    this.initLoweringImages(this.props.match.params.id, this.props.event.hideASNAP);

    if(!this.state.lowering) {
      getLowering(this.props.match.params.id)
        .then((lowering) => this.setState({ lowering }));
    }

    if(!this.state.cruise) {
      getCruiseByLowering(this.props.match.params.id)
        .then((cruise) => this.setState({ cruise }));
    }
  }

  componentDidUpdate(prevProps, prevState) {

    if(prevProps.event.hideASNAP !== this.props.event.hideASNAP) {
      this.initLoweringImages(this.props.match.params.id, this.props.event.hideASNAP);
    }

    if(prevState.filter !== this.state.filter) {
      this.initLoweringImages(this.props.match.params.id, this.props.event.hideASNAP, this.state.filter);
    }
  }

  toggleASNAP() {
    this.props.eventUpdateLoweringReplay(this.props.match.params.id, this.props.event.hideASNAP);

    if(this.props.event.hideASNAP) {
      this.props.showASNAP();
    }
    else {
      this.props.hideASNAP();
    }
  }

  componentWillUnmount(){
  }

  async initLoweringImages(id, hideASNAP=false, event_filter='', auxDatasourceFilter='vehicleRealtimeFramegrabberData') {
    this.setState({ fetching: true});

    let url = `${API_ROOT_URL}/api/v1/event_aux_data/bylowering/${id}?datasource=${auxDatasourceFilter}`

    if(hideASNAP) {
      url += '&value=!ASNAP'
    }

    if(event_filter !== '') {
      event_filter.split(',').forEach((filter_item) => {
        filter_item.trim();
        url += '&value='+filter_item;
      })    
    }

    const image_data = await axios.get(url,
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

          image_data[data.data_array[i].data_value].images.push({ event_id: data.event_id, filepath: getImageUrl(data.data_array[i+1].data_value) });
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

  handleKeyDown(event) {

    if (event.key === 'Enter' && event.shiftKey === false) {
      event.preventDefault();
    }
  }

  handleSearchChange(event) {

    if(this.state.filterTimer) {
      clearTimeout(this.state.filterTimer);
    }

    let fieldVal = event.target.value;
    this.setState({ filterTimer: setTimeout(() => this.setState({filter: fieldVal}), 1500) })
  }

  handleImageCountChange(event) {
    this.setState({ maxImagesPerPage: parseInt(event.target.value)});
  }

  handleLoweringSelect(id) {
    this.props.gotoLoweringGallery(id);
    this.props.initLowering(id, this.props.event.hideASNAP);
    this.props.initCruiseFromLowering(id);
    this.initLoweringImages(id, this.props.event.hideASNAP);
  }

  handleLoweringModeSelect(mode) {
    if (mode === "Gallery") {
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
          <LoweringGalleryTab imagesSource={key} imagesData={value} maxImagesPerPage={this.state.maxImagesPerPage} />
        </Tab>
      ));
    }

    return (galleries.length > 0 )?
      (
        <Tabs className="category-tab" variant="pills" id="galleries" mountOnEnter={true} unmountOnExit={true}>
          { galleries }
        </Tabs>
      ) :  (<div><hr className="border-secondary"/><span className="pl-2">No images found</span></div>);
  }

  render(){
    // Wait for lowering object before rendering
    if (!this.state.lowering)
      return null;

    const cruise_id = (this.state.cruise)? this.state.cruise.cruise_id : "loading...";
    const galleries = (this.state.fetching)? <div><hr className="border-secondary"/><span className="pl-2">Loading...</span></div> : this.renderGalleries();

    const ASNAPToggle = (<Form.Check id="ASNAP" type='switch' inline checked={!this.props.event.hideASNAP} onChange={() => this.toggleASNAP()} disabled={this.props.event.fetching} label='ASNAP'/>);

    return (
      <div>
        <EventShowDetailsModal />
        <Row className="d-flex align-items-center justify-content-between">
          <ButtonToolbar className="mb-2 ml-1 align-items-center">
            <span onClick={() => this.props.gotoCruiseMenu()} className="text-warning">{cruise_id}</span>
            <FontAwesomeIcon icon="chevron-right" fixedWidth/>
            <LoweringDropdown onClick={this.handleLoweringSelect} active_cruise={this.state.cruise} active_lowering={this.state.lowering}/>
            <FontAwesomeIcon icon="chevron-right" fixedWidth/>
            <LoweringModeDropdown onClick={this.handleLoweringModeSelect} active_mode="Gallery" modes={["Replay", "Map"]}/>
          </ButtonToolbar>
          <span className="float-right">
            <Form style={{marginTop: '-4px'}} className='float-right' inline>
              <FormControl size="sm" type="text" placeholder="Filter" className="mr-sm-2" onKeyPress={this.handleKeyDown} onChange={this.handleSearchChange}/>
              <Form.Group controlId="selectMaxImagesPerPage" >
                <Form.Control size="sm" as="select" onChange={this.handleImageCountChange}>
                  <option>16</option>
                  <option>32</option>
                  <option>48</option>
                  <option>64</option>
                  <option>80</option>
                </Form.Control>
                <Form.Label>&nbsp;&nbsp;Images/Page&nbsp;&nbsp;</Form.Label>
              </Form.Group>
            </Form>
            {ASNAPToggle}
          </span>
        </Row>
        <Row>
          <Col>
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
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(LoweringGallery);
