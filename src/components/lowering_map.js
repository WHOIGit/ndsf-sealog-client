import React, { Component } from 'react';
import { connect } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import moment from 'moment';
import { Popup } from 'react-leaflet';
import { ButtonToolbar, Row, Col, Card, Tooltip, OverlayTrigger, ListGroup, Form } from 'react-bootstrap';
import Slider, { createSliderWithTooltip } from 'rc-slider';
import EventShowDetailsModal from './event_show_details_modal';
import EventFilterForm from './event_filter_form';
import EventCommentModal from './event_comment_modal';
import LoweringDropdown from './lowering_dropdown';
import LoweringModeDropdown from './lowering_mode_dropdown';
import CustomPagination from './custom_pagination';
import ExportDropdown from './export_dropdown';
import * as mapDispatchToProps from '../actions';
import { getCruiseByLowering, getLowering } from '../api';
import LoweringMapDisplay from './lowering_map_display';


const SliderWithTooltip = createSliderWithTooltip(Slider);

const maxEventsPerPage = 10;

class LoweringMap extends Component {

  constructor (props) {
    super(props);

    this.divFocus = null;

    this.state = {
      fetching: false,
      cruise: props.cruise,
      lowering: props.lowering,

      replayEventIndex: 0,
      activePage: 1,
      
      height: "480px"
    };

    this.sliderTooltipFormatter = this.sliderTooltipFormatter.bind(this);
    this.handleSliderChange = this.handleSliderChange.bind(this);
    this.handleEventClick = this.handleEventClick.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.handlePageSelect = this.handlePageSelect.bind(this);
    this.updateEventFilter = this.updateEventFilter.bind(this);

    this.handleLoweringSelect = this.handleLoweringSelect.bind(this);
    this.handleLoweringModeSelect = this.handleLoweringModeSelect.bind(this);
    
    this.toggleASNAP = this.toggleASNAP.bind(this);
  }

  componentDidMount() {
    if(this.props.event.events.length === 0) {
      this.props.initLoweringReplay(this.props.match.params.id, this.props.event.hideASNAP);
    } else {
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
  }

  componentDidUpdate(prevProps, prevState) {
    if(this.state.lowering !== prevState.lowering) {
      this.divFocus.focus();
    }
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
          this.setState({replayEventIndex: eventIndex + 1});
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
          this.setState({replayEventIndex: eventIndex - 1});
          this.props.advanceLoweringReplayTo(this.props.event.events[eventIndex - 1].id)
        }
      }
    }
    else if(event.key === "Enter") {
      this.handleEventShowDetailsModal(this.state.replayEventIndex)
    }
  }

  updateEventFilter(filter = {}) {
    this.setState({ activePage: 1, replayEventIndex: 0 });
    this.props.updateEventFilterForm(filter);
    this.props.eventUpdateLoweringReplay(this.props.match.params.id, this.props.event.hideASNAP);
  }

  toggleASNAP() {
    this.props.eventUpdateLoweringReplay(this.props.match.params.id, !this.props.event.hideASNAP);
    if(this.props.event.hideASNAP) {
      this.props.showASNAP();
      this.handleEventClick(0);
    }
    else {
      this.props.hideASNAP();
      this.setState({replayEventIndex: 0});
      this.handleEventClick(0);
    }
  }

  sliderTooltipFormatter(v) {
    if(this.props.event.events && this.props.event.events[v]) {
      let loweringStartTime = moment(this.state.lowering.start_ts);
      let loweringNow = moment(this.props.event.events[v].ts);
      let loweringElapse = loweringNow.diff(loweringStartTime);
      return moment.duration(loweringElapse).format("d [days] hh:mm:ss");
    }

    return '';
  }

  handleSliderChange(index) {
    if(this.props.event.events && this.props.event.events[index]) {
      this.setState({replayEventIndex: index});
      this.props.advanceLoweringReplayTo(this.props.event.events[index].id);
      this.setState({activePage: Math.ceil((index+1)/maxEventsPerPage)});
    }
  }

  handleEventClick(index) {
    this.setState({replayEventIndex: index});
    if(this.props.event.events && this.props.event.events.length > index) {
      this.props.advanceLoweringReplayTo(this.props.event.events[index].id);
      this.setState({activePage: Math.ceil((index+1)/maxEventsPerPage)});
    }
  }

  handleEventCommentModal(index) {
    this.setState({replayEventIndex: index});
    this.props.advanceLoweringReplayTo(this.props.event.events[index].id);
    this.props.showModal('eventComment', { event: this.props.event.events[index], handleUpdateEvent: this.props.updateEvent });
  }

  handlePageSelect(eventKey, updateReplay=true) {
    this.setState({activePage: eventKey, replayEventIndex: (eventKey-1)*maxEventsPerPage });
    if(updateReplay) {
      this.props.advanceLoweringReplayTo(this.props.event.events[(eventKey-1)*maxEventsPerPage].id);
    }
    this.divFocus.focus();
  }


  handleEventShowDetailsModal(index) {
    this.props.showModal('eventShowDetails', { event: this.props.event.events[index], handleUpdateEvent: this.props.updateEvent });
  }

  handleLoweringSelect(lowering) {
    this.props.gotoLoweringMap(lowering.id);
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

  renderControlsCard() {

    if(this.state.lowering) {
      const loweringStartTime = moment(this.state.lowering.start_ts);
      const loweringEndTime = moment(this.state.lowering.stop_ts);
      const loweringDuration = loweringEndTime.diff(loweringStartTime);
      
      return (
        <Card className="border-secondary p-1">
          <div className="d-flex align-items-center justify-content-between">
              <span className="text-primary">00:00:00</span>
              <span className="text-primary">{moment.duration(loweringDuration).format("d [days] hh:mm:ss")}</span>
          </div>
          <div className="d-flex align-items-center justify-content-between">
            <SliderWithTooltip
              className="mx-2"
              value={this.state.replayEventIndex}
              tipFormatter={this.sliderTooltipFormatter}
              trackStyle={{ opacity: 0.5 }}
              railStyle={{ opacity: 0.5 }}
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

  renderEventCard() {

    return (
      <Card className="mt-2 border-secondary">
        <Card.Header>{ this.renderEventListHeader() }</Card.Header>
        <ListGroup className="eventList" tabIndex="-1" onKeyDown={this.handleKeyPress} ref={(div) => { this.divFocus = div }}>
          {this.renderEvents()}
        </ListGroup>
      </Card>
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

          let eventDetails = <OverlayTrigger placement="left" overlay={<Tooltip id={`commentTooltip_${event.id}`}>View Details</Tooltip>}><FontAwesomeIcon onClick={() => this.handleEventShowDetailsModal(index)} icon='window-maximize' fixedWidth/></OverlayTrigger>;

          let title = '';

          if(event.event_value !== 'FREE_FORM') {

            // no need to show free_text as event_value
            title += event.event_value;

          }

          return (<ListGroup.Item className="py-1 event-list-item" key={event.id} active={active} ><span onClick={() => this.handleEventClick(index)} >{`${event.ts} <${event.event_author}>: ${ title } ${eventOptions}`}</span><span className="float-right">{eventDetails} {eventComment}</span></ListGroup.Item>);

        }
        return null;
      });

      return eventList;
    }

    return (this.props.event.fetching)? (<ListGroup.Item className="event-list-item">Loading...</ListGroup.Item>) : (<ListGroup.Item>No events found</ListGroup.Item>);
  }

  render() {
    if (!this.state.lowering)
      return null;

    const cruise_id = (this.state.cruise)? this.state.cruise.cruise_id : "Loading...";
    
    return (
      <div>
        <EventCommentModal />
        <EventShowDetailsModal />
        <Row>
          <ButtonToolbar className="mb-2 ml-1 align-items-center">
            <span onClick={() => this.props.gotoCruiseMenu()} className="text-warning">{cruise_id}</span>
            <FontAwesomeIcon icon="chevron-right" fixedWidth/>
            <LoweringDropdown onClick={this.handleLoweringSelect} active_cruise={this.state.cruise} active_lowering={this.state.lowering} onLoweringClick={this.handleLoweringSelect} />
            <FontAwesomeIcon icon="chevron-right" fixedWidth/>
            <LoweringModeDropdown onClick={this.handleLoweringModeSelect} active_mode="Map" modes={["Replay", "Gallery"]}/>
          </ButtonToolbar>
        </Row>
        <Row>
          <Col className="px-1" sm={12}>
            <Card className="border-secondary">
              <LoweringMapDisplay 
                loweringID={this.props.match.params.id}
                selectedEvent={this.props.event.selected_event}
                height={this.state.height}
                renderPopup={() => (
                  <Popup>
                    You are here! :-)
                  </Popup>
                )}
              />
            </Card>
          </Col>
        </Row>
        <Row className="mt-2">
          <Col className="px-1 mb-1" md={9} lg={9}>
            {this.renderControlsCard()}
            {this.renderEventCard()}
            <CustomPagination className="mt-2" page={this.state.activePage} count={this.props.event.events.length} pageSelectFunc={this.handlePageSelect} maxPerPage={maxEventsPerPage}/>
          </Col>          
          <Col className="px-1 mb-1" md={3} lg={3}>
            <EventFilterForm disabled={this.props.event.fetching} hideASNAP={this.props.event.hideASNAP} handlePostSubmit={ this.updateEventFilter } minDate={this.state.lowering.start_ts} maxDate={this.state.lowering.stop_ts} initialValues={this.props.event.eventFilter}/>
          </Col>          
        </Row>
      </div>
    );
  }
}

function mapStateToProps(state) {

  return {
    roles: state.user.profile.roles,
    event: state.event
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(LoweringMap);
