import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { connect } from 'react-redux';
import Cookies from 'universal-cookie';
import { Row, Col, Card, ListGroup, Tooltip, OverlayTrigger } from 'react-bootstrap';
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
    let offset = `&offset=${(activePage-1)*maxEventsPerPage}`;
    let limit = `&limit=${maxEventsPerPage}`;


    await axios.get(`${API_ROOT_URL}/api/v1/events?${startTS}${stopTS}${value}${author}${freetext}${datasource}${offset}${limit}`,
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
    const ASNAPToggleIcon = (this.state.hideASNAP)? "Show ASNAP" : "Hide ASNAP";
    const ASNAPToggle = (<span disabled={this.props.event.fetching} style={{ marginRight: "10px" }} onClick={() => this.toggleASNAP()}>{ASNAPToggleIcon}</span>);

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

      let eventList = this.state.events.map((event) => {
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

        let eventOptions = (eventOptionsArray.length > 0)? '--> ' + eventOptionsArray.join(', '): '';
        let commentIcon = (comment_exists)? <FontAwesomeIcon onClick={() => this.handleEventCommentModal(event)} icon='comment' fixedWidth transform="grow-4"/> : <span onClick={() => this.handleEventCommentModal(event)} className="fa-layers fa-fw"><FontAwesomeIcon icon='comment' fixedWidth transform="grow-4"/><FontAwesomeIcon className={ "text-secondary" } icon='plus' fixedWidth inverse transform="shrink-4"/></span>;
        let commentTooltip = (comment_exists)? (<OverlayTrigger placement="top" overlay={<Tooltip id={`commentTooltip_${event.id}`}>Edit/View Comment</Tooltip>}>{commentIcon}</OverlayTrigger>) : (<OverlayTrigger placement="top" overlay={<Tooltip id={`commentTooltip_${event.id}`}>Add Comment</Tooltip>}>{commentIcon}</OverlayTrigger>);

        let deleteIcon = <FontAwesomeIcon className={"text-danger"} onClick={() => this.handleEventDeleteModal(event)} icon='trash' fixedWidth/>;
        let deleteTooltip = (this.props.roles && this.props.roles.includes("admin"))? (<OverlayTrigger placement="top" overlay={<Tooltip id={`deleteTooltip_${event.id}`}>Delete this event</Tooltip>}>{deleteIcon}</OverlayTrigger>): null;

        return (<ListGroup.Item className="event-list-item" key={event.id}><span onClick={() => this.handleEventShowDetailsModal(event)}>{event.ts} {`<${event.event_author}>`}: {event.event_value} {eventOptions}</span><span className="float-right">{deleteTooltip} {commentTooltip}</span></ListGroup.Item>);
      });

      return eventList;
    }

    return (<ListGroup.Item key="emptyHistory" >No events found</ListGroup.Item>);
  }

  renderEventCard() {

    if (!this.state.events) {
      return (
        <Card>
          <Card.Header>{ this.renderEventListHeader() }</Card.Header>
          <Card.Body>Loading...</Card.Body>
        </Card>
      );
    }

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
    return (
      <div>
        <EventCommentModal />
        <DeleteEventModal />
        <EventShowDetailsModal />
        <Row>
          <Col sm={12} md={8} lg={8}>
            {this.renderEventCard()}
            <CustomPagination style={{marginTop: "8px"}} page={this.state.activePage} count={this.state.eventCount} pageSelectFunc={this.handlePageSelect} maxPerPage={maxEventsPerPage}/>
          </Col>
          <Col sm={12} md={4} lg={4}>
            <EventFilterForm disabled={this.state.fetching} hideASNAP={this.state.hideASNAP} handlePostSubmit={ this.updateEventFilter } lowering_id={null}/>
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
