import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import path from 'path';
import moment from 'moment';
import { connect } from 'react-redux';
import { Row, Col, Card, ListGroup, Image, OverlayTrigger, Tooltip, Form } from 'react-bootstrap';
import 'rc-slider/assets/index.css';
import Slider from 'rc-slider';
import EventFilterForm from './event_filter_form';
import ImagePreviewModal from './image_preview_modal';
import EventCommentModal from './event_comment_modal';
import LoweringDropdown from './lowering_dropdown';
import LoweringModeDropdown from './lowering_mode_dropdown';
import CustomPagination from './custom_pagination';
import ExportDropdown from './export_dropdown';
import * as mapDispatchToProps from '../actions';
import { ROOT_PATH, API_ROOT_URL, IMAGE_PATH } from '../client_config';

const playTimer = 3000;
const ffwdTimer = 1000;

const PLAY = 0;
const PAUSE = 1;
const FFWD = 2;
const FREV = 3;

const maxEventsPerPage = 10;

const excludeAuxDataSources = ['vehicleRealtimeFramegrabberData'];

const imageAuxDataSources = ['vehicleRealtimeFramegrabberData'];

const sortAuxDataSourceReference = ['vehicleRealtimeNavData','vehicleRealtimeCTDData'];

const SliderWithTooltip = Slider.createSliderWithTooltip(Slider);

class LoweringReplay extends Component {

  constructor (props) {
    super(props);

    this.divFocus = null;

    this.state = {
      replayTimer: null,
      replayState: PAUSE,
      replayEventIndex: 0,
      activePage: 1,
    };

    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.sliderTooltipFormatter = this.sliderTooltipFormatter.bind(this);
    this.handleSliderChange = this.handleSliderChange.bind(this);
    this.handleEventClick = this.handleEventClick.bind(this);
    this.handlePageSelect = this.handlePageSelect.bind(this);
    this.replayAdvance = this.replayAdvance.bind(this);
    this.handleLoweringReplayPause = this.handleLoweringReplayPause.bind(this);
    this.replayReverse = this.replayReverse.bind(this);
    this.updateEventFilter = this.updateEventFilter.bind(this);
    this.handleLoweringSelect = this.handleLoweringSelect.bind(this);
    this.handleLoweringModeSelect = this.handleLoweringModeSelect.bind(this);

  }

  componentDidMount() {

    if(!this.props.lowering.id || this.props.lowering.id !== this.props.match.params.id || this.props.event.events.length === 0) {
      this.props.initLoweringReplay(this.props.match.params.id, this.props.event.hideASNAP);
    }
    else {
      const eventIndex = this.props.event.events.findIndex((event) => event.id === this.props.event.selected_event.id);
      this.setState(
        {
          replayEventIndex: eventIndex,
          activePage: Math.ceil((eventIndex+1)/maxEventsPerPage)
        }
      );
    }

    this.props.initCruiseFromLowering(this.props.match.params.id);
    this.divFocus.focus();
  }

  componentDidUpdate() {
  }

  componentWillUnmount(){
    if(this.state.replayTimer) {
      clearInterval(this.state.replayTimer);
    }
  }

  updateEventFilter(filter = {}) {
    this.setState({ activePage: 1, replayEventIndex: 0 });
    this.handleLoweringReplayPause();
    this.props.updateEventFilterForm(filter);
    this.props.eventUpdateLoweringReplay(this.props.match.params.id, this.props.event.hideASNAP);
  }

  toggleASNAP() {
    this.props.eventUpdateLoweringReplay(this.props.lowering.id, !this.props.event.hideASNAP);
    this.handleLoweringReplayPause();
    if(this.props.event.hideASNAP) {
      this.props.showASNAP();
      this.handleEventClick(0);
    }
    else {
      this.props.hideASNAP();
      this.handleEventClick(0);
    }
  }

  sliderTooltipFormatter(v) {
    if(this.props.event.events && this.props.event.events[v]) {
      let loweringStartTime = moment(this.props.lowering.start_ts);
      let loweringNow = moment(this.props.event.events[v].ts);
      let loweringElapse = loweringNow.diff(loweringStartTime);
      return moment.duration(loweringElapse).format("d [days] hh:mm:ss");
    }

    return '';
  }

  handleSliderChange(index) {
    if(this.props.event.events && this.props.event.events[index]) {
      this.handleLoweringReplayPause();
      this.setState({replayEventIndex: index});
      this.props.advanceLoweringReplayTo(this.props.event.events[index].id);
      this.setState({activePage: Math.ceil((index+1)/maxEventsPerPage)});
    }
  }

  handleEventClick(index) {
    this.handleLoweringReplayPause();
    this.setState({replayEventIndex: index});
    if(this.props.event.events && this.props.event.events.length > index) {
      this.props.advanceLoweringReplayTo(this.props.event.events[index].id);
      this.setState({activePage: Math.ceil((index+1)/maxEventsPerPage)});
    }
  }

  handleImageClick(source, filepath) {
    this.handleLoweringReplayPause();
    this.props.showModal('imagePreview', { name: source, filepath: filepath });
  }

  handleEventCommentModal(index) {
    this.handleLoweringReplayPause();
    this.setState({replayEventIndex: index});
    this.props.advanceLoweringReplayTo(this.props.event.events[index].id);
    this.props.showModal('eventComment', { event: this.props.event.events[index], handleUpdateEvent: this.props.updateEvent });
  }

  handlePageSelect(eventKey, updateReplay=true) {
    this.handleLoweringReplayPause();
    this.setState({activePage: eventKey, replayEventIndex: (eventKey-1)*maxEventsPerPage });
    if(updateReplay) {
      this.props.advanceLoweringReplayTo(this.props.event.events[(eventKey-1)*maxEventsPerPage].id);
    }
    this.divFocus.focus();
  }

  handleKeyPress(event) {
    if(event.key === "ArrowRight" && this.state.activePage < Math.ceil(this.props.event.events.length / maxEventsPerPage)) {
      this.handlePageSelect(this.state.activePage + 1)
    }
    else if(event.key === "ArrowLeft" && this.state.activePage > 1) {
      this.handlePageSelect(this.state.activePage - 1)
    }
    else if(event.key === "ArrowDown") {
      const eventIndex = this.props.event.events.findIndex((event) => event.id === this.props.event.selected_event.id);
      if(eventIndex < (this.props.event.events.length - 1)) {
        if(Math.ceil((eventIndex + 2) / maxEventsPerPage) !== this.state.activePage) {
          this.handlePageSelect(Math.ceil((eventIndex + 2) / maxEventsPerPage))
        }
        else {
          this.props.advanceLoweringReplayTo(this.props.event.events[eventIndex + 1].id)  
        } 
      }
    }
    else if(event.key === "ArrowUp") {
      const eventIndex = this.props.event.events.findIndex((event) => event.id === this.props.event.selected_event.id);
      if(eventIndex > 0) {
        if(Math.ceil((eventIndex) / maxEventsPerPage) !== this.state.activePage) {
          this.handlePageSelect(Math.ceil((eventIndex) / maxEventsPerPage), false)
          this.props.advanceLoweringReplayTo(this.props.event.events[eventIndex - 1].id)
        }
        else {
          this.props.advanceLoweringReplayTo(this.props.event.events[eventIndex - 1].id)
        }
      }
    }
  }

  handleLoweringSelect(id) {
    this.props.gotoLoweringReplay(id);
    this.props.initLoweringReplay(id, this.props.event.hideASNAP);
    this.props.initCruiseFromLowering(id);
    this.setState({replayEventIndex: 0, activePage: 1});
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

  renderImage(source, filepath) {
    return (
      <Card id={`image_${source}`}>
        <Card.Body className="data-card-body">
          <Image  fluid onError={this.handleMissingImage} src={filepath} onClick={ () => this.handleImageClick(source, filepath)} />
          <div style={{marginTop: "5px"}}>{source}</div>
        </Card.Body>
      </Card>
    );
  }

  handleMissingImage(ev) {
    ev.target.src = `${ROOT_PATH}images/noimage.jpeg`;
  }

  handleLoweringReplayStart() {
    this.handleLoweringReplayPause();
    this.setState({replayEventIndex: 0});
    this.props.advanceLoweringReplayTo(this.props.event.events[this.state.replayEventIndex].id);
    this.setState({activePage: Math.ceil((this.state.replayEventIndex+1)/maxEventsPerPage)});
  }

  handleLoweringReplayEnd() {
    this.handleLoweringReplayPause();
    this.setState({replayEventIndex: this.props.event.events.length-1});
    this.props.advanceLoweringReplayTo(this.props.event.events[this.state.replayEventIndex].id);
    this.setState({activePage: Math.ceil((this.state.replayEventIndex+1)/maxEventsPerPage)});
  }

  handleLoweringReplayFRev() {
    this.setState({replayState: FREV});    
    if(this.state.replayTimer !== null) {
      clearInterval(this.state.replayTimer);
    }
    this.setState({replayTimer: setInterval(this.replayReverse, ffwdTimer)});
  }

  handleLoweringReplayPlay() {
    this.setState({replayState: PLAY});
    if(this.state.replayTimer !== null) {
      clearInterval(this.state.replayTimer);
    }
    this.setState({replayTimer: setInterval(this.replayAdvance, playTimer)});
  }

  handleLoweringReplayPause() {
    this.setState({replayState: PAUSE});
    if(this.state.replayTimer !== null) {
      clearInterval(this.state.replayTimer);
    }
    this.setState({replayTimer: null});
  }

  handleLoweringReplayFFwd() {
    this.setState({replayState: FFWD});
    if(this.state.replayTimer !== null) {
      clearInterval(this.state.replayTimer);
    }
    this.setState({replayTimer: setInterval(this.replayAdvance, ffwdTimer)});

  }

  replayAdvance() {
    if(this.state.replayEventIndex < (this.props.event.events.length - 1)) {
      this.setState({replayEventIndex: this.state.replayEventIndex + 1});
      this.props.advanceLoweringReplayTo(this.props.event.events[this.state.replayEventIndex].id);
      this.setState({activePage: Math.ceil((this.state.replayEventIndex+1)/maxEventsPerPage)});
    } else {
      this.setState({replayState: PAUSE});
    }
  }

  replayReverse() {
    if(this.state.replayEventIndex > 0) {
      this.setState({replayEventIndex: this.state.replayEventIndex - 1});
      this.props.advanceLoweringReplayTo(this.props.event.events[this.state.replayEventIndex].id);
      this.setState({activePage: Math.ceil((this.state.replayEventIndex+1)/maxEventsPerPage)});
    } else {
      this.setState({replayState: PAUSE});
    }
  }

  renderImageryCard() {
    if(this.props.event && this.props.event.selected_event.aux_data) { 
      let frameGrabberData = this.props.event.selected_event.aux_data.filter(aux_data => imageAuxDataSources.includes(aux_data.data_source));
      let tmpData = [];

      if(frameGrabberData.length > 0) {
        for (let i = 0; i < frameGrabberData[0].data_array.length; i+=2) {
    
          tmpData.push({source: frameGrabberData[0].data_array[i].data_value, filepath: API_ROOT_URL + IMAGE_PATH + '/' + path.basename(frameGrabberData[0].data_array[i+1].data_value)} );
        }

        return (
          tmpData.map((camera) => {
            return (
              <Col key={camera.source} xs={12} sm={6} md={4} lg={3}>
                {this.renderImage(camera.source, camera.filepath)}
              </Col>
            );
          })
        )
      }
    }
  }

  renderEventOptionsCard() {

    if(this.props.event.selected_event && this.props.event.selected_event.event_options && this.props.event.selected_event.event_options.length > 0) {

      let return_event_options = this.props.event.selected_event.event_options.reduce((filtered, event_option, index) => {
        if(event_option.event_option_name !== 'event_comment') {
          filtered.push(<div key={`event_option_${index}`}><span>{event_option.event_option_name}:</span> <span className="float-right" style={{wordWrap:'break-word'}} >{event_option.event_option_value}</span><br/></div>);
        }

        return filtered;
      },[]);

      return (return_event_options.length > 0)? (
        <Col xs={12} sm={6} md={4} lg={3} style={{paddingBottom: "8px"}}>
          <Card>
            <Card.Header className="data-card-header">Event Options</Card.Header>
            <Card.Body className="data-card-body">
              <div style={{paddingLeft: "10px"}}>
                {return_event_options}
              </div>
            </Card.Body>
          </Card>
        </Col>
      ) : null;
    }
  }

  renderAuxDataCard() {

    if(this.props.event.selected_event && this.props.event.selected_event.aux_data) {

      // console.log(this.props.event.selected_event.aux_data)

      const aux_data = this.props.event.selected_event.aux_data.filter((data) => !excludeAuxDataSources.includes(data.data_source))

      aux_data.sort((a, b) => {
        return (sortAuxDataSourceReference.indexOf(a.data_source) < sortAuxDataSourceReference.indexOf(b.data_source)) ? -1 : 1;
      });

      let return_aux_data = aux_data.map((aux_data, index) => {
        const aux_data_points = aux_data.data_array.map((data, index) => {
          return(<div key={`${aux_data.data_source}_data_point_${index}`}><span>{data.data_name}:</span> <span className="float-right" style={{wordWrap:'break-word'}} >{data.data_value} {data.data_uom}</span><br/></div>);
        });

        return (
          <Col key={`${aux_data.data_source}_col`} sm={6} md={4} lg={3} style={{paddingBottom: "8px"}}>
            <Card key={`${aux_data.data_source}`}>
              <Card.Header className="data-card-header">{aux_data.data_source}</Card.Header>
              <Card.Body className="data-card-body">
                <div style={{paddingLeft: "10px"}}>
                  {aux_data_points}
                </div>
              </Card.Body>
            </Card>
          </Col>
        );
      });

      return return_aux_data;
    }

    return null;
  }

  renderControlsCard() {

    if(this.props.lowering) {
      const loweringStartTime = moment(this.props.lowering.start_ts);
      const loweringEndTime = moment(this.props.lowering.stop_ts);
      const loweringDuration = loweringEndTime.diff(loweringStartTime);
      
      const playPause = (this.state.replayState !== 1)? <FontAwesomeIcon className="text-primary" key={`pause_${this.props.lowering.id}`} onClick={ () => this.handleLoweringReplayPause() } icon="pause"/> : <FontAwesomeIcon className="text-primary" key={`play_${this.props.lowering.id}`} onClick={ () => this.handleLoweringReplayPlay() } icon="play"/>;

      const buttons = (this.props.event.selected_event.ts && !this.props.event.fetching)? (
        <div className="text-center">
          <FontAwesomeIcon className="text-primary" key={`start_${this.props.lowering.id}`} onClick={ () => this.handleLoweringReplayStart() } icon="step-backward"/>{' '}
          <FontAwesomeIcon className="text-primary" key={`frev_${this.props.lowering.id}`} onClick={ () => this.handleLoweringReplayFRev() } icon="backward"/>{' '}
          {playPause}{' '}
          <FontAwesomeIcon className="text-primary" key={`ffwd_${this.props.lowering.id}`} onClick={ () => this.handleLoweringReplayFFwd() } icon="forward"/>{' '}
          <FontAwesomeIcon className="text-primary" key={`end_${this.props.lowering.id}`} onClick={ () => this.handleLoweringReplayEnd() } icon="step-forward"/>
        </div>
      ):(
        <div className="text-center">
          <FontAwesomeIcon icon="step-backward"/>{' '}
          <FontAwesomeIcon icon="backward"/>{' '}
          <FontAwesomeIcon icon="play"/>{' '}
          <FontAwesomeIcon icon="forward"/>{' '}
          <FontAwesomeIcon icon="step-forward"/>
        </div>
      );

      return (
        <Card style={{marginBottom: "8px"}}>
          <Card.Body>
            <Row>
              <Col xs={4}>
                <span className="text-primary">00:00:00</span>
              </Col>
              <Col xs={4}>
                {buttons}
              </Col>
              <Col xs={4}>
                <div className="float-right">
                  <span className="text-primary">{moment.duration(loweringDuration).format("d [days] hh:mm:ss")}</span>
                </div>
              </Col>
            </Row>
            <SliderWithTooltip
              value={this.state.replayEventIndex}
              tipFormatter={this.sliderTooltipFormatter}
              trackStyle={{ opacity: 0.5 }}
              railStyle={{ opacity: 0.5 }}
              onBeforeChange={this.handleLoweringReplayPause}
              onChange={this.handleSliderChange}
              max={this.props.event.events.length-1}
            />
          </Card.Body>
        </Card>
      );
    }
  }

  renderEventListHeader() {

    const Label = "Filtered Events";
    const ASNAPToggle = (<Form.Check id="ASNAP" type='switch' inline checked={!this.props.event.hideASNAP} onChange={() => this.toggleASNAP()} disabled={this.props.event.fetching} label='ASNAP'/>);

    return (
      <div>
        { Label }
        <span className="float-right">
          {ASNAPToggle}
          <ExportDropdown id="dropdown-download" disabled={this.props.event.fetching} hideASNAP={this.props.event.hideASNAP} eventFilter={this.props.event.eventFilter} loweringID={this.props.lowering.id} prefix={this.props.lowering.lowering_id}/>
        </span>
      </div>
    );
  }

  renderEvents() {

    if(this.props.event.events && this.props.event.events.length > 0){

      let eventList = this.props.event.events.map((event, index) => {
        if(index >= (this.state.activePage-1) * maxEventsPerPage && index < (this.state.activePage * maxEventsPerPage)) {
          
          let comment_exists = false;

          let eventOptionsArray = event.event_options.reduce((filtered, option) => {
            if(option.event_option_name === 'event_comment') {
              comment_exists = (option.event_option_value !== '')? true : false;
            } else {
              filtered.push(`${option.event_option_name}: "${option.event_option_value}"`);
            }
            return filtered;
          },[]);
          
          if (event.event_free_text) {
            eventOptionsArray.push(`free_text: "${event.event_free_text}"`);
          } 

          let active = (this.props.event.selected_event.id === event.id)? true : false;

          let eventOptions = (eventOptionsArray.length > 0)? '--> ' + eventOptionsArray.join(', '): '';
          
          let commentIcon = (comment_exists)? <FontAwesomeIcon onClick={() => this.handleEventCommentModal(index)} icon='comment' fixedWidth transform="grow-4"/> : <span onClick={() => this.handleEventCommentModal(index)} className="fa-layers fa-fw"><FontAwesomeIcon icon='comment' fixedWidth transform="grow-4"/><FontAwesomeIcon className={(active)? "text-primary" : "text-secondary" } icon='plus' fixedWidth transform="shrink-4"/></span>;
          let commentTooltip = (comment_exists)? (<OverlayTrigger placement="left" overlay={<Tooltip id={`commentTooltip_${event.id}`}>Edit/View Comment</Tooltip>}>{commentIcon}</OverlayTrigger>) : (<OverlayTrigger placement="top" overlay={<Tooltip id={`commentTooltip_${event.id}`}>Add Comment</Tooltip>}>{commentIcon}</OverlayTrigger>);
          let eventComment = (this.props.roles.includes("event_logger") || this.props.roles.includes("admin"))? commentTooltip : null;

          return (<ListGroup.Item className="event-list-item" key={event.id} active={active} ><span onClick={() => this.handleEventClick(index)} >{`${event.ts} <${event.event_author}>: ${event.event_value} ${eventOptions}`}</span><span className="float-right">{eventComment}</span></ListGroup.Item>);

        }
      });

      return eventList;
    }

    return (this.props.event.fetching)? (<ListGroup.Item className="event-list-item">Loading...</ListGroup.Item>) : (<ListGroup.Item>No events found</ListGroup.Item>);
  }

  renderEventCard() {
    return (
      <Card>
        <Card.Header>{ this.renderEventListHeader() }</Card.Header>
        <ListGroup>
          {this.renderEvents()}
        </ListGroup>
      </Card>
    );
  }

  render(){

    const cruise_id = (this.props.cruise.cruise_id)? this.props.cruise.cruise_id : "Loading...";
    // console.log("cruise:", this.props.cruise);

    return (
      <div tabIndex="-1" onKeyDown={this.handleKeyPress} ref={(div) => { this.divFocus = div }}>
        <ImagePreviewModal />
        <EventCommentModal />
        <Row>
          <Col lg={12}>
            <span style={{paddingLeft: "8px"}}>
              <span onClick={() => this.props.gotoCruiseMenu()} className="text-warning">{cruise_id}</span>
              {' '}/{' '}
              <span><LoweringDropdown onClick={this.handleLoweringSelect} active_cruise={this.props.cruise} active_lowering={this.props.lowering}/></span>
              {' '}/{' '}
              <span><LoweringModeDropdown onClick={this.handleLoweringModeSelect} active_mode={"Replay"} modes={["Review", "Map", "Gallery"]}/></span>
            </span>
          </Col>
        </Row>
        <Row>
          {this.renderImageryCard()}
          {this.renderAuxDataCard()}
          {this.renderEventOptionsCard()}
        </Row>
        <Row>
          <Col sm={12}>
            <Row>
              <Col md={9} lg={9}>
                {this.renderControlsCard()}
                {this.renderEventCard()}
                <CustomPagination style={{marginTop: "8px"}} page={this.state.activePage} count={this.props.event.events.length} pageSelectFunc={this.handlePageSelect} maxPerPage={maxEventsPerPage}/>
              </Col>          
              <Col md={3} lg={3}>
                <EventFilterForm disabled={this.props.event.fetching} hideASNAP={this.props.event.hideASNAP} handlePostSubmit={ this.updateEventFilter } minDate={this.props.lowering.start_ts} maxDate={this.props.lowering.stop_ts} initialValues={this.props.event.eventFilter}/>
              </Col>          
            </Row>
          </Col>
        </Row>
      </div>
    );
  }
}

function mapStateToProps(state) {

  return {
    cruise: state.cruise.cruise,
    lowering: state.lowering.lowering,  
    roles: state.user.profile.roles,
    event: state.event
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(LoweringReplay);
