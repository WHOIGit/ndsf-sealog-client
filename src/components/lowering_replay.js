import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import moment from 'moment';
import { connect } from 'react-redux';
import { ButtonToolbar, Row, Col, Card, ListGroup, OverlayTrigger, Tooltip, Form } from 'react-bootstrap';
import Slider, { createSliderWithTooltip } from 'rc-slider';
import EventFilterForm from './event_filter_form';
import EventCommentModal from './event_comment_modal';
import LoweringDropdown from './lowering_dropdown';
import LoweringModeDropdown from './lowering_mode_dropdown';
import CustomPagination from './custom_pagination';
import ExportDropdown from './export_dropdown';
import EventPreview from './event_preview';
import * as mapDispatchToProps from '../actions';
import { getCruiseByLowering, getLowering } from '../api';
import { Popup } from 'react-leaflet';
import LoweringMapDisplay from './lowering_map_display';


const playTimer = 3000;
const ffwdTimer = 1000;

const PLAY = 0;
const PAUSE = 1;
const FFWD = 2;
const FREV = 3;

const maxEventsPerPage = 10;

const SliderWithTooltip = createSliderWithTooltip(Slider);

class LoweringReplay extends Component {

  constructor (props) {
    super(props);

    this.divFocus = null;
    this.resizeRef = React.createRef(); // Add a ref for the resize handle

    this.state = {
      replayTimer: null,
      replayState: PAUSE,
      replayEventIndex: 0,
      activePage: 1,
      state: null,
      cruise: props.cruise,
      lowering: props.lowering,
      useAbsoluteTimestamp: true,  // TODO: add a toggle in the UI or possibly put this in a user setting
      mapCollapsed: true,
      mapHeight: 300, // Default map height in pixels
      isDragging: false, // Track if we're currently dragging
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
    this.toggleMapCollapse = this.toggleMapCollapse.bind(this);
    this.startResize = this.startResize.bind(this);
    this.stopResize = this.stopResize.bind(this);
    this.resize = this.resize.bind(this);
  }

  componentDidMount() {
    if(this.props.event.events.length === 0) {
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

    if(!this.state.lowering) {
      getLowering(this.props.match.params.id)
        .then((lowering) => this.setState({ lowering }));
    }

    if(!this.state.cruise) {
      getCruiseByLowering(this.props.match.params.id)
        .then((cruise) => this.setState({ cruise }));
    }

    // Add event listeners for dragging
    document.addEventListener('mousemove', this.resize);
    document.addEventListener('mouseup', this.stopResize);
  }

  componentDidUpdate(prevProps, prevState) {
    // Once the lowering data is fetched, focus on the event list
    if(this.state.lowering !== prevState.lowering) {
      this.divFocus.focus();
    }
  }

  componentWillUnmount(){
    if(this.state.replayTimer) {
      clearInterval(this.state.replayTimer);
    }

    // Remove event listeners
    document.removeEventListener('mousemove', this.resize);
    document.removeEventListener('mouseup', this.stopResize);
  }

  updateEventFilter(filter = {}) {
    this.setState({ activePage: 1, replayEventIndex: 0 });
    this.handleLoweringReplayPause();
    this.props.updateEventFilterForm(filter);
    this.props.eventUpdateLoweringReplay(this.props.match.params.id, this.props.event.hideASNAP);
  }

  toggleASNAP() {
    this.props.eventUpdateLoweringReplay(this.state.lowering.id, !this.props.event.hideASNAP);
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
      let loweringStartTime = moment(this.state.lowering.start_ts);
      let loweringNow = moment(this.props.event.events[v].ts);
      let loweringElapse = loweringNow.diff(loweringStartTime);

      if(this.state.useAbsoluteTimestamp) {
        return loweringNow.toISOString(); // formats scrubber tooltip in absolute UTC ISO8601
      }
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

  // FIXME:
  // When the user clicks on an image to pop up an ImagePreviewModal, we should
  // pause the replay. This behavior regressed when the ImagePreviewModal was
  // made the concern of the EventPreview component.

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

  handleLoweringSelect(lowering) {
    this.props.gotoLoweringReplay(lowering.id);
    this.props.initLoweringReplay(lowering.id, this.props.event.hideASNAP);
    this.props.initCruiseFromLowering(lowering.id);
    this.setState({replayEventIndex: 0, activePage: 1});
    this.setState({lowering});
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

  toggleMapCollapse() {
    this.setState(prevState => ({
      mapCollapsed: !prevState.mapCollapsed
    }));
  }

  startResize(e) {
    // Only start resize if left mouse button is clicked
    if (e.button !== 0) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    this.setState({
      isDragging: true,
      initialY: e.clientY,
      initialHeight: this.state.mapHeight
    });
  }

  stopResize() {
    if (this.state.isDragging) {
      this.setState({ isDragging: false });
    }
  }

  resize(e) {
    if (this.state.isDragging) {
      const deltaY = e.clientY - this.state.initialY;
      const newHeight = this.state.initialHeight + deltaY;
      if (newHeight < 25) {
        this.setState({ mapCollapsed: true });
      } else {
        this.setState({ mapHeight: newHeight });
      }
    }
  }

  renderControlsCard() {

    if(this.state.lowering) {
      const loweringStartTime = moment(this.state.lowering.start_ts);
      const loweringEndTime = moment(this.state.lowering.stop_ts);
      const loweringDuration = loweringEndTime.diff(loweringStartTime);
      
      const playPause = (this.state.replayState !== 1)? <FontAwesomeIcon className="text-primary" key={`pause_${this.state.lowering.id}`} onClick={ () => this.handleLoweringReplayPause() } icon="pause"/> : <FontAwesomeIcon className="text-primary" key={`play_${this.state.lowering.id}`} onClick={ () => this.handleLoweringReplayPlay() } icon="play"/>;

      const buttons = (this.props.event.selected_event.ts && !this.props.event.fetching)? (
        <span className="w-100 text-center">
          <FontAwesomeIcon className="text-primary" key={`start_${this.state.lowering.id}`} onClick={ () => this.handleLoweringReplayStart() } icon="step-backward"/>{' '}
          <FontAwesomeIcon className="text-primary" key={`frev_${this.state.lowering.id}`} onClick={ () => this.handleLoweringReplayFRev() } icon="backward"/>{' '}
          {playPause}{' '}
          <FontAwesomeIcon className="text-primary" key={`ffwd_${this.state.lowering.id}`} onClick={ () => this.handleLoweringReplayFFwd() } icon="forward"/>{' '}
          <FontAwesomeIcon className="text-primary" key={`end_${this.state.lowering.id}`} onClick={ () => this.handleLoweringReplayEnd() } icon="step-forward"/>
        </span>
      ):(
        <span className="text-center">
          <FontAwesomeIcon icon="step-backward"/>{' '}
          <FontAwesomeIcon icon="backward"/>{' '}
          <FontAwesomeIcon icon="play"/>{' '}
          <FontAwesomeIcon icon="forward"/>{' '}
          <FontAwesomeIcon icon="step-forward"/>
        </span>
      );

      return (
        <Card className="border-secondary p-1">
          <div className="d-flex align-items-center justify-content-between">
              <span className="text-primary text-nowrap">{(this.state.useAbsoluteTimestamp ? this.state.lowering.start_ts:'00:00:00')}</span>
              {buttons}
              <span className="text-primary text-nowrap">{(this.state.useAbsoluteTimestamp ? this.state.lowering.stop_ts:moment.duration(loweringDuration).format("d [days] hh:mm:ss"))}</span>
          </div>
          <div className="d-flex align-items-center justify-content-between">
            <SliderWithTooltip
              className="mx-2"
              value={this.state.replayEventIndex}
              tipFormatter={this.sliderTooltipFormatter}
              trackStyle={{ opacity: 0.5 }}
              railStyle={{ opacity: 0.5 }}
              onBeforeChange={this.handleLoweringReplayPause}
              onChange={this.handleSliderChange}
              max={this.props.event.events.length-1}
            />
          </div>
        </Card>
      );
    }
  }

  renderEventListHeader() {

    const Label = "Filtered Events";
    const ASNAPToggle = (<Form.Check id="ASNAP" type='switch' inline checked={!this.props.event.hideASNAP} onChange={() => this.toggleASNAP()} disabled={this.props.event.fetching} label='Show ASNAP'/>);

    return (
      <div>
        { Label }
        <span className="float-right">
          {ASNAPToggle}
          <ExportDropdown id="dropdown-download" disabled={this.props.event.fetching} hideASNAP={this.props.event.hideASNAP} eventFilter={this.props.event.eventFilter} loweringID={this.state.lowering.id} prefix={this.state.lowering.lowering_id}/>
        </span>
      </div>
    );
  }

  renderEvents() {

    if(this.props.event.events && this.props.event.events.length > 0){

      let eventList = this.props.event.events.map((event, index) => {
        if(index >= (this.state.activePage-1) * maxEventsPerPage && index < (this.state.activePage * maxEventsPerPage)) {
          
          let comment_exists = false;
          let comment_callout = '';

          let eventOptionsArray = event.event_options.reduce((filtered, option) => {
            if(option.event_option_name === 'event_comment') {
              comment_exists = (option.event_option_value !== '')? true : false;
              comment_callout = 'COMMENT: ' + option.event_option_value;
            } else {
              filtered.push(`${option.event_option_name.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}: "${option.event_option_value}"`);
            }
            return filtered;
          },[]);
          
          if (event.event_free_text) {
            eventOptionsArray.push(`"${event.event_free_text}"`);
          } 

          let active = (this.props.event.selected_event.id === event.id)? true : false;

          let eventOptions = (eventOptionsArray.length > 0)? ' ' + eventOptionsArray.join(', '): '';
          
          let commentIcon = (comment_exists)? <FontAwesomeIcon onClick={() => this.handleEventCommentModal(index)} icon='comment' fixedWidth transform="grow-4"/> : <span onClick={() => this.handleEventCommentModal(index)} className="fa-layers fa-fw"><FontAwesomeIcon icon='comment' fixedWidth transform="grow-4"/><FontAwesomeIcon className={(active)? "text-primary" : "text-secondary" } icon='plus' fixedWidth transform="shrink-4"/></span>;
          let commentTooltip = (comment_exists)? (<OverlayTrigger placement="left" overlay={<Tooltip id={`commentTooltip_${event.id}`}>Edit/View Comment</Tooltip>}>{commentIcon}</OverlayTrigger>) : (<OverlayTrigger placement="top" overlay={<Tooltip id={`commentTooltip_${event.id}`}>Add Comment</Tooltip>}>{commentIcon}</OverlayTrigger>);
          let eventComment = (this.props.roles.includes("event_logger") || this.props.roles.includes("admin"))? commentTooltip : null;

          let title = '';

          if(event.event_value != 'FREE_FORM') {

            // no need to show free_text as event_value
            title += event.event_value;

          }

          return (<ListGroup.Item className="event-list-item py-1" key={event.id} active={active} ><span onClick={() => this.handleEventClick(index)} >{`${event.ts} <${event.event_author}>: ${ title } ${eventOptions}`} {comment_callout}</span><span className="float-right">{eventComment}</span></ListGroup.Item>);

        }
        return null;
      });

      return eventList;
    }

    return (this.props.event.fetching)? (<ListGroup.Item className="event-list-item py-1">Loading...</ListGroup.Item>) : (<ListGroup.Item className="event-list-item py-1">No events found</ListGroup.Item>);
  }

  renderEventCard() {
    return (
      <Card className="border-secondary mt-2">
        <Card.Header>{ this.renderEventListHeader() }</Card.Header>
        <ListGroup className="eventList" tabIndex="-1" onKeyDown={this.handleKeyPress} ref={(div) => { this.divFocus = div }}>
          {this.renderEvents()}
        </ListGroup>
      </Card>
    );
  }

  render(){
    // Wait for lowering object before rendering
    if (!this.state.lowering)
      return null;

    const cruise_id = (this.state.cruise)? this.state.cruise.cruise_id : "Loading...";

    return (
      <React.Fragment>
        <EventCommentModal />
        <Row>
          <ButtonToolbar className="mb-2 ml-1 align-items-center">
            <span onClick={() => this.props.gotoCruiseMenu()} className="text-warning">{cruise_id}</span>
            <FontAwesomeIcon icon="chevron-right" fixedWidth/>
            <LoweringDropdown active_cruise={this.state.cruise} active_lowering={this.state.lowering} onLoweringClick={this.handleLoweringSelect}/>
            <FontAwesomeIcon icon="chevron-right" fixedWidth/>
            <LoweringModeDropdown onClick={this.handleLoweringModeSelect} active_mode="Replay" modes={["Map", "Gallery"]}/>
          </ButtonToolbar>
        </Row>
        <Row>
          <Col className="px-1 mb-2" xs={12}>
            <Card className="border-secondary">
              <Card.Header 
                onClick={this.toggleMapCollapse}
                className="d-flex justify-content-between align-items-center px-2 py-1"
              >
                <span>Map View</span>
                <FontAwesomeIcon 
                  icon={this.state.mapCollapsed ? "chevron-right" : "chevron-down"} 
                  fixedWidth 
                  className="text-primary" 
                  style={{cursor: 'pointer'}} 
                />
              </Card.Header>
              {!this.state.mapCollapsed && (
                <div>
                  <div style={{ height: `${this.state.mapHeight}px`, overflow: 'hidden' }}>
                    <LoweringMapDisplay 
                      loweringID={this.state.lowering.id} 
                      selectedEvent={this.props.event.selected_event}
                      height="100%"
                      renderPopup={() => (
                        <Popup>
                          {this.props.event.selected_event.ts} - {this.props.event.selected_event.event_value}
                        </Popup>
                      )}
                    />
                  </div>
                  <div 
                    ref={this.resizeRef}
                    onMouseDown={this.startResize}
                    style={{
                      height: '6px',
                      cursor: 'ns-resize',
                      textAlign: 'center',
                      userSelect: 'none', // Prevent text selection during drag
                    }}
                  >
                    <div style={{ width: '30px', height: '4px', margin: '3px auto', backgroundColor: '#ccc', borderRadius: '2px' }}></div>
                  </div>
                </div>
              )}
            </Card>
          </Col>
        </Row>
        <Row>
          <Col className="px-1 mb-2" xs={12}>
            <EventPreview event={this.props.event.selected_event} />
          </Col>
        </Row>
        <Row>
          <Col className="px-1 mb-1" md={9} lg={9}>
            {this.renderControlsCard()}
            {this.renderEventCard()}
            <CustomPagination className="mt-2" page={this.state.activePage} count={this.props.event.events.length} pageSelectFunc={this.handlePageSelect} maxPerPage={maxEventsPerPage}/>
          </Col>
          <Col className="px-1 mb-1" md={3} lg={3}>
            <EventFilterForm disabled={this.props.event.fetching} hideASNAP={this.props.event.hideASNAP} handlePostSubmit={ this.updateEventFilter } minDate={this.state.lowering.start_ts} maxDate={this.state.lowering.stop_ts} initialValues={this.props.event.eventFilter}/>
          </Col>          
        </Row>
      </React.Fragment>
    );
  }
}

function mapStateToProps(state) {

  return {
    roles: state.user.profile.roles,
    event: state.event
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(LoweringReplay);
