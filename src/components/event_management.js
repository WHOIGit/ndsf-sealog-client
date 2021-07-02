import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { connect } from 'react-redux';
import Cookies from 'universal-cookie';
import { Row, Col, Card, ListGroup, Tooltip, OverlayTrigger, Form } from 'react-bootstrap';
import axios from 'axios';
import EventFilterForm from './event_filter_form';
import EventCommentModal from './event_comment_modal';
import DeleteEventModal from './delete_event_modal';
import EventShowDetailsModal from './event_show_details_modal';
import CustomPagination from './custom_pagination';
import ExportDropdown from './export_dropdown';
import * as mapDispatchToProps from '../actions';
import { API_ROOT_URL } from '../client_config';

const maxEventsPerPage = 15;

class EventManagement extends Component {

  constructor (props) {
    super(props);

    this.state = {
      hideASNAP: true,
      activePage: 1,
      fetching: false,
      events: null,
      eventCount: 0,
      eventFilter: {},
    };

    this.handleEventUpdate = this.handleEventUpdate.bind(this);
    this.handleEventDelete = this.handleEventDelete.bind(this);
    this.handlePageSelect = this.handlePageSelect.bind(this);
    this.updateEventFilter = this.updateEventFilter.bind(this);
  }

  componentDidMount(){
    if(!this.state.events){
      this.fetchEventsForDisplay();
      this.fetchEventCount();
    }
  }

  handlePageSelect(eventKey) {
    this.setState({activePage: eventKey});
    this.fetchEventsForDisplay(this.state.eventFilter, eventKey);
  }

  handleEventCommentModal(event) {
    this.props.showModal('eventComment', { event: event, handleUpdateEvent: this.handleEventUpdate });
  }

  updateEventFilter(filter = {}) {
    this.setState({ activePage: 1, eventFilter: filter });
    this.fetchEventsForDisplay(filter, 1);
    this.fetchEventCount(filter);
  }

  async handleEventUpdate(event_id, event_value, event_free_text, event_options, event_ts) {
    const response = await this.props.updateEvent(event_id, event_value, event_free_text, event_options, event_ts);
    if(response.response.status === 204) {
      this.setState(prevState => ({events: prevState.events.map((event) => {
        if(event.id === event_id) {
          event.event_options = event_options;
        }
        return event;
      })
      }));
    }
  }

  handleEventDeleteModal(event) {
    this.props.showModal('deleteEvent', { id: event.id, handleDelete: this.handleEventDelete });
  }

  async handleEventDelete(id) {
    const response = await this.props.deleteEvent(id);
    if(response.response.status === 204) {
      this.setState({events: this.state.events.filter(event => event.id !== id)});
      if((this.state.events.length % maxEventsPerPage) === 0 && (this.state.events.length / maxEventsPerPage) === (this.state.activePage-1) ) {
        this.handlePageSelect(this.state.activePage-1);
      }
    }
  }

  handleEventShowDetailsModal(event) {
    this.props.showModal('eventShowDetails', { event: event, handleUpdateEvent: this.handleEventUpdate });
  }

  async fetchEventsForDisplay(eventFilter = this.state.eventFilter, activePage = this.state.activePage) {

    this.setState({fetching: true});

    const cookies = new Cookies();
    let startTS = (eventFilter.startTS)? `&startTS=${eventFilter.startTS}` : '';
    let stopTS = (eventFilter.stopTS)? `&stopTS=${eventFilter.stopTS}` : '';
    let value = (eventFilter.value)? `&value=${eventFilter.value.split(',').join("&value=")}` : '';
    value = (this.state.hideASNAP)? `&value=!ASNAP${value}` : value;
    let author = (eventFilter.author)? `&author=${eventFilter.author.split(',').join("&author=")}` : '';
    let freetext = (eventFilter.freetext)? `&freetext=${eventFilter.freetext}` : '';
    let datasource = (eventFilter.datasource)? `&datasource=${eventFilter.datasource}` : '';
    let sort = `&sort=newest`;
    let offset = `&offset=${(activePage-1)*maxEventsPerPage}`;
    let limit = `&limit=${maxEventsPerPage}`;

    await axios.get(`${API_ROOT_URL}/api/v1/events?${startTS}${stopTS}${value}${author}${freetext}${datasource}${sort}${offset}${limit}`,
      {
        headers: {
          authorization: cookies.get('token')
        }
      }).then((response) => {
      this.setState({fetching: false});
      this.setState({events: response.data});
    }).catch((error)=>{
      if(error.response.data.statusCode === 404){
        this.setState({fetching: false});
        this.setState({events: []});
      } else {
        console.log(error.response);
        this.setState({fetching: false});
        this.setState({events: []});
      }
    }
    );
  }

  async fetchEventCount(eventFilter = this.state.eventFilter) {

    const cookies = new Cookies();
    let startTS = (eventFilter.startTS)? `&startTS=${eventFilter.startTS}` : '';
    let stopTS = (eventFilter.stopTS)? `&stopTS=${eventFilter.stopTS}` : '';
    let value = (eventFilter.value)? `&value=${eventFilter.value.split(',').join("&value=")}` : '';
    value = (this.state.hideASNAP)? `&value=!ASNAP${value}` : value;
    let author = (eventFilter.author)? `&author=${eventFilter.author.split(',').join("&author=")}` : '';
    let freetext = (eventFilter.freetext)? `&freetext=${eventFilter.freetext}` : '';
    let datasource = (eventFilter.datasource)? `&datasource=${eventFilter.datasource}` : '';

    await axios.get(`${API_ROOT_URL}/api/v1/events/count?${startTS}${stopTS}${value}${author}${freetext}${datasource}`,
      {
        headers: {
          authorization: cookies.get('token')
        }
      }).then((response) => {
      this.setState({eventCount: response.data.events});
    }).catch((error)=>{
      if(error.response.data.statusCode === 404){
        this.setState({eventCount: 0});
      } else {
        console.log(error.response);
        this.setState({eventCount: 0});
      }
    }
    );
  }

  async toggleASNAP() {
    await this.setState( prevState => ({hideASNAP: !prevState.hideASNAP, activePage: 1}));
    this.fetchEventsForDisplay();
    this.fetchEventCount();
  }

  renderEventListHeader() {

    const Label = "Filtered Events";
    const ASNAPToggle = (<Form.Check id="ASNAP" type='switch' inline checked={!this.state.hideASNAP} onChange={() => this.toggleASNAP()} disabled={this.props.event.fetching} label='ASNAP'/>);

    return (
      <div>
        { Label }
        <span className="float-right">
          {ASNAPToggle}
          <ExportDropdown id="dropdown-download" disabled={this.props.event.fetching} hideASNAP={this.state.hideASNAP} eventFilter={this.state.eventFilter} />
        </span>
      </div>
    );
  }

  renderEvents() {

    if(this.state.events && this.state.events.length > 0){

      let eventList = this.state.events.map((event, index) => {
        if(index >= (this.state.activePage-1) * maxEventsPerPage && index < (this.state.activePage * maxEventsPerPage)) {
          
          let comment_exists = (event.event_options.find((option) => option.event_option_name === 'event_comment' && option.event_option_value != "" )) ? true : false;

          let seatube_permalink_idx = event.event_options.findIndex((option) => option.event_option_name === 'seatube_permalink' && option.event_option_value != "" );

          let youtube_material = (event.event_options.find((option) => option.event_option_name === 'youtube_material' && option.event_option_value === "Yes" ))
            ?
              <OverlayTrigger placement="top" overlay={<Tooltip id={`youtubeTooltip_${event.id}`}>This is YouTube material</Tooltip>}><FontAwesomeIcon className="mr-1"  icon={['fab', 'youtube']} fixedWidth/></OverlayTrigger>
            :
              null;

          let eventOptionsArray = []
          
          if (event.event_free_text) {
            eventOptionsArray.push(`free_text: "${event.event_free_text}"`);
          } 

          let active = (this.props.event.selected_event.id === event.id)? true : false;

          let eventOptions = (eventOptionsArray.length > 0)? '--> ' + eventOptionsArray.join(', '): '';
          
          let commentIcon = (comment_exists)? <FontAwesomeIcon onClick={() => this.handleEventCommentModal(index)} icon='comment' fixedWidth transform="grow-4"/> : <span onClick={() => this.handleEventCommentModal(index)} className="fa-layers fa-fw"><FontAwesomeIcon icon='comment' fixedWidth transform="grow-4"/><FontAwesomeIcon className={(active)? "text-primary" : "text-secondary" } icon='plus' fixedWidth transform="shrink-4"/></span>;
          let commentTooltip = (comment_exists)? (<OverlayTrigger placement="left" overlay={<Tooltip id={`commentTooltip_${event.id}`}>Edit/View Comment</Tooltip>}>{commentIcon}</OverlayTrigger>) : (<OverlayTrigger placement="top" overlay={<Tooltip id={`commentTooltip_${event.id}`}>Add Comment</Tooltip>}>{commentIcon}</OverlayTrigger>);
          let eventComment = (this.props.roles.includes("event_logger") || this.props.roles.includes("admin"))? commentTooltip : null;

          let eventDelete = (this.props.roles && this.props.roles.includes("admin"))
            ?
              <OverlayTrigger placement="top" overlay={<Tooltip id={`deleteTooltip_${event.id}`}>Delete this event</Tooltip>}><FontAwesomeIcon className={"text-danger mr-1"} onClick={() => this.handleEventDeleteModal(event)} icon='trash' fixedWidth/></OverlayTrigger>
            :
              null;

          let eventDetails = <OverlayTrigger placement="left" overlay={<Tooltip id={`commentTooltip_${event.id}`}>View Details</Tooltip>}><FontAwesomeIcon className="mr-1" onClick={() => this.handleEventShowDetailsModal(event)} icon='window-maximize' fixedWidth/></OverlayTrigger>;

          let seatube_permalink = (seatube_permalink_idx >= 0)
            ?
              <OverlayTrigger placement="top" overlay={<Tooltip id={`permalinkTooltip_${event.id}`}>Open Seatube Permalink</Tooltip>}><a className="mr-1" href={event.event_options[seatube_permalink_idx].event_option_value} target="_blank"><FontAwesomeIcon icon='link' className={(!active)? "text-primary" : "text-secondary" } fixedWidth/></a></OverlayTrigger>
            :
              null;


          return (<ListGroup.Item className="event-list-item py-1" key={event.id} active={active} ><span>{`${event.ts} <${event.event_author}>: ${event.event_value} ${eventOptions}`}</span><span className="float-right">{youtube_material}{seatube_permalink}{eventDelete}{eventDetails}{eventComment}</span></ListGroup.Item>);

        }
      });

      return eventList;
    }

    return (this.props.event.fetching)? (<ListGroup.Item className="event-list-item py-1">Loading...</ListGroup.Item>) : (<ListGroup.Item className="event-list-item py-1">No events found</ListGroup.Item>);
  }

  renderEventCard() {

    if (!this.state.events) {
      return (
        <Card className="border-secondary">
          <Card.Header>{ this.renderEventListHeader() }</Card.Header>
          <Card.Body>Loading...</Card.Body>
        </Card>
      );
    }

    return (
      <Card className="border-secondary">
        <Card.Header>{ this.renderEventListHeader() }</Card.Header>
        <ListGroup className="eventList">
          {this.renderEvents()}
        </ListGroup>
      </Card>
    );
  }

  render(){
    return (
      <div>
        <EventCommentModal />
        <DeleteEventModal />
        <EventShowDetailsModal />
        <Row>
          <Col className="px-1 pb-2" sm={12} md={9} lg={9}>
            {this.renderEventCard()}
            <CustomPagination className="mt-2" page={this.state.activePage} count={this.state.eventCount} pageSelectFunc={this.handlePageSelect} maxPerPage={maxEventsPerPage}/>
          </Col>
          <Col className="px-1 pb-2" sm={12} md={3} lg={3}>
            <EventFilterForm disabled={this.state.fetching} hideASNAP={this.state.hideASNAP} handlePostSubmit={ this.updateEventFilter } lowering_id={null} sort="newest"/>
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

export default connect(mapStateToProps, mapDispatchToProps)(EventManagement);
