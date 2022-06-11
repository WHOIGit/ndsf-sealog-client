import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { connect } from 'react-redux';
import { Button, ListGroup, Image, Card, Tooltip, OverlayTrigger, Row, Col, Form, FormControl } from 'react-bootstrap';
import ImagePreviewModal from './image_preview_modal';
import * as mapDispatchToProps from '../actions';
import { Client } from '@hapi/nes/lib/client';
import axios from 'axios';
import moment from 'moment';
import Cookies from 'universal-cookie';

import { WS_ROOT_URL, API_ROOT_URL } from '../client_config';
import { getImageUrl, handleMissingImage } from '../utils';

const cookies = new Cookies();

const excludeAuxDataSources = ['vehicleRealtimeFramegrabberData'];

const imageAuxDataSources = ['vehicleRealtimeFramegrabberData'];

const sortAuxDataSourceReference = ['vehicleRealtimeNavData','vesselRealtimeNavData'];

const eventHistoryRef = "eventHistory";

class EventHistory extends Component {

  constructor (props) {
    super(props);

    this.state = {
      page: 0,
      event: null,
      showASNAP: false,
      showNewEventDetails: true,
      showEventHistory: true,
      showEventHistoryFullscreen: false,
      filterTimer: null,
      filter: '',
      current_time: moment.utc(0),
      elapse_time: moment.utc(0),
      threshold_time: moment.utc(0).set('minute', 15),
      current_lowering: null,
      showPrevDiveEvents: false

    };

    this.client = new Client(`${WS_ROOT_URL}`);
    this.connectToWS = this.connectToWS.bind(this);
    this.handleSearchChange = this.handleSearchChange.bind(this);
    this.updateLowering = this.updateLowering.bind(this);
    this.updateTimes = this.updateTimes.bind(this);

  }

  componentDidMount() {
    this.props.fetchEventHistory();
    this.updateLowering()
    if(this.props.authenticated) {
      this.connectToWS();
    }

    setInterval(this.updateTimes, 1000);
  }

  componentDidUpdate(prevProps, prevState) {

    if(prevState.page !== this.state.page) {
      this.props.fetchEventHistory(this.state.showASNAP, this.state.filter, this.state.page, (this.state.current_lowering && !this.state.showPrevDiveEvents) ? this.state.current_lowering.id : null);      
    }

    if(prevState.filter !== this.state.filter) {
      this.props.fetchEventHistory(this.state.showASNAP, this.state.filter, 0, (this.state.current_lowering && !this.state.showPrevDiveEvents) ? this.state.current_lowering.id : null);
      this.setState({page: 0});
    }

    if(prevState.current_lowering !== this.state.current_lowering) {
      this.props.fetchEventHistory(this.state.showASNAP, this.state.filter, 0, (this.state.current_lowering && !this.state.showPrevDiveEvents) ? this.state.current_lowering.id : null);
      this.setState({page: 0});
    }

    if(prevState.showASNAP !== this.state.showASNAP) {
      this.props.fetchEventHistory(this.state.showASNAP, this.state.filter, 0, (this.state.current_lowering && !this.state.showPrevDiveEvents) ? this.state.current_lowering.id : null);
      this.setState({page: 0});
    }

    if(prevState.showPrevDiveEvents !== this.state.showPrevDiveEvents && this.state.current_lowering) {
      this.props.fetchEventHistory(this.state.showASNAP, this.state.filter, 0, (this.state.current_lowering && !this.state.showPrevDiveEvents) ? this.state.current_lowering.id : null);
      this.fetchEventExport();
      this.setState({page: 0});
    }

    if(prevState.showNewEventDetails !== this.state.showNewEventDetails && this.state.showNewEventDetails && this.props.history[0]) {
      this.fetchEventExport(this.props.history[0].id);      
    }

    if(prevProps.history[0] !== this.props.history[0] && this.props.history[0] && !this.state.event && this.state.showNewEventDetails) {
      // this.fetchEventExport(this.props.history[0].id);
      this.fetchEventExport();
    }
  }

  componentWillUnmount() {
    if(this.props.authenticated) {
      this.client.disconnect();
    }
  }

  updateTimes() {
    const now = moment.utc()
    let elapse_time = moment.utc(0)
    if(this.state.event) {
      const last_event = moment.utc(this.state.event.ts)
      elapse_time = moment.utc(moment().diff(last_event, now))
    }

    this.setState({current_time: now, elapse_time: elapse_time})
  }


  async connectToWS() {

    try {
      await this.client.connect();
      // {
      //   auth: {
      //     headers: {
      //       authorization: cookies.get('token')
      //     }
      //   }
      // })

      const filteredEvent = (event_value) => {
        return (this.state.filter == '') ? true : this.state.filter.split(',').reduce((answer, filter_item) => {
          const regex = RegExp(filter_item, 'i');
          if(event_value.match(regex)) {
            return true;
          }
        }, false)
      }

      const updateHandler = (update) => {
        if(!(!this.state.showASNAP && update.event_value === "ASNAP") && filteredEvent(update.event_value)) {
          if(this.state.page == 0) {
            this.props.updateEventHistory(update);            
          }
          this.fetchEventExport(update.id);
        }
      };

      const updateAuxDataHandler = (update) => {
        if(this.state.event && this.state.showNewEventDetails && update.event_id === this.state.event.id) {
          this.fetchEventExport(this.state.event.id);
        }
      };

      const deleteHandler = (update) => {
        if(update.id === this.state.event.id) {
          if(this.props.history[0] && this.state.page == 0) {
            this.fetchEventExport(this.props.history[0].id);
          }
          else {
            this.fetchEventExport();
          }
        }

        this.props.fetchEventHistory(this.state.showASNAP, this.state.filter, this.state.page, (this.state.current_lowering && !this.state.showPrevDiveEvents) ? this.state.current_lowering.id : null);
      };

      const newLoweringHandler = () => {
        this.updateLowering();
        this.setState({event: null});
      };

      const updateLoweringHandler = () => {
        this.updateLowering();
      };

      this.client.subscribe('/ws/status/newEvents', updateHandler);
      this.client.subscribe('/ws/status/updateEvents', updateHandler);
      this.client.subscribe('/ws/status/deleteEvents', deleteHandler);
      this.client.subscribe('/ws/status/newEventAuxData', updateAuxDataHandler);
      this.client.subscribe('/ws/status/updateEventAuxData', updateAuxDataHandler);

      this.client.subscribe('/ws/status/newLowerings', updateLoweringHandler);
      this.client.subscribe('/ws/status/updateLowerings', updateLoweringHandler);

    } catch(error) {
      console.log(error);
      throw(error);
    }
  }


  async updateLowering() {

    const now_str = moment.utc().toISOString()

    try {
      const response = await axios.get(`${API_ROOT_URL}/api/v1/lowerings?startTS=${now_str}&stopTS=${now_str}`,
        {
          headers: {
          authorization: cookies.get('token')
          }
        }      
      )
      if(response.data[0]) {
        this.setState({current_lowering: response.data[0]});
      }
      else {
        this.setState({current_lowering: null});
      }
    }
    catch(error) {
      if(error.response && error.response.data.statusCode === 404) {
        this.setState({current_lowering: null});
      }

      if(error.response && error.response.data.statusCode !== 404) {
        console.log(error);
      }
    }    
  }


  async fetchEventExport(event_id=null) {

    if(!event_id) {
      let url = (this.state.current_lowering && !this.state.showPrevDiveEvents)? `${API_ROOT_URL}/api/v1/events/bylowering/${this.state.current_lowering.id}?sort=newest&limit=1` : `${API_ROOT_URL}/api/v1/events?sort=newest&limit=1`
      const event = await axios.get(url, {
        headers: {
          authorization: cookies.get('token')
        }
      }).then((response) => {
        return response.data;

      }).catch((error)=>{
        if(error.response && error.response.data.statusCode !== 404) {
          console.log(error);
        }
        return null;
      });

      if(!event) {
        this.setState({event: null});
        return null;
      }
      event_id = event[0].id;
    }

    let url = `${API_ROOT_URL}/api/v1/event_exports/${event_id}`
    const event_export = await axios.get(url, {
      headers: {
        authorization: cookies.get('token')
      }
    }).then((response) => {
      return response.data;

    }).catch((error)=>{
      if(error.response && error.response.data.statusCode !== 404) {
        console.log(error);
      }
      return null;
    });

    this.setState({event: event_export});
  }

  handleEventShowDetailsModal(event) {
    this.props.showModal('eventShowDetails', { event: event });
  }

  handleEventCommentModal(event) {
    this.props.showModal('eventComment', { event: event, handleUpdateEvent: this.props.updateEvent });
  }

  renderEventHistoryHeader() {

    const Label = "Event History";
    const expandTooltip = (<Tooltip id="expandHistoryTooltip">Expand event history</Tooltip>);
    const compressTooltip = (<Tooltip id="compressTooltip">Compress event history</Tooltip>);
    const showTooltip = (<Tooltip id="showHistoryTooltip">Show event history</Tooltip>);
    const hideTooltip = (<Tooltip id="hideHistoryTooltip">Hide this card</Tooltip>);
    const NewEventToggleIcon = (this.state.showNewEventDetails)? null : "Show Newest Event Details";
    const NewEventToggle = (NewEventToggleIcon) ? <span className="mr-2" variant="secondary" size="sm" onClick={() => this.toggleNewEventDetails()}>{NewEventToggleIcon} </span> : null;

    if(this.state.showEventHistory) {

      if(this.state.showEventHistoryFullscreen) {
        return (
          <div>
            { Label }
            <Form inline className="float-right">
              {NewEventToggle}
              <FormControl size="sm" type="text" placeholder="Filter" className="mr-sm-2" onKeyPress={this.handleKeyDown} onChange={this.handleSearchChange}/>
              <OverlayTrigger placement="top" overlay={compressTooltip}><span className="mr-2" variant="secondary" size="sm" onClick={ () => this.handleHideEventHistoryFullscreen() }><FontAwesomeIcon icon='compress' fixedWidth/></span></OverlayTrigger>{' '}
              <OverlayTrigger placement="top" overlay={hideTooltip}><span variant="secondary" size="sm" onClick={ () => this.handleHideEventHistory() }><FontAwesomeIcon icon='eye-slash' fixedWidth/></span></OverlayTrigger>
            </Form>
          </div>
        );
      }
      
      return (
        <div>
          { Label }
          <Form inline className="float-right">
            {NewEventToggle}
            <FormControl size="sm" type="text" placeholder="Filter" className="mr-sm-2" onKeyPress={this.handleKeyDown} onChange={this.handleSearchChange}/>
            <OverlayTrigger placement="top" overlay={expandTooltip}><span className="mr-2" variant="secondary" size="sm" onClick={ () => this.handleShowEventHistoryFullscreen() }><FontAwesomeIcon icon='compress' fixedWidth/></span></OverlayTrigger>{' '}
            <OverlayTrigger placement="top" overlay={hideTooltip}><span variant="secondary" size="sm" onClick={ () => this.handleHideEventHistory() }><FontAwesomeIcon icon='eye-slash' fixedWidth/></span></OverlayTrigger>
          </Form>
        </div>
      );
    }

    return (
      <div>
        { Label }
        <div className="float-right">
          {NewEventToggle}
          <OverlayTrigger placement="top" overlay={showTooltip}><span variant="secondary" size="sm" onClick={ () => this.handleShowEventHistory() }><FontAwesomeIcon icon='eye' fixedWidth/></span></OverlayTrigger>
        </div>
      </div>
    );
  }


  handleHideEventHistory() {
    this.setState({showEventHistory: false});
  }

  handleShowEventHistory() {
    this.setState({showEventHistory: true});
  }

  handleHideEventHistoryFullscreen() {
    this.setState({showEventHistoryFullscreen: false});
  }

  handleSearchChange(event) {

    if(this.state.filterTimer) {
      clearTimeout(this.state.filterTimer);
    }

    let fieldVal = event.target.value;
    this.setState({ filterTimer: setTimeout(() => this.setState({filter: fieldVal}), 1500) })
  }

  handleKeyDown(event) {

    if (event.key === 'Enter' && event.shiftKey === false) {
      event.preventDefault();
    }
  }

  handleShowEventHistoryFullscreen() {
    this.setState({showEventHistoryFullscreen: true});
  }

  toggleASNAP() {
    this.setState( prevState => ({showASNAP: !prevState.showASNAP}));
  }

  toggleNewEventDetails() {
    this.setState( prevState => ({showNewEventDetails: !prevState.showNewEventDetails}));
  }

  togglePrevDiveEvents() {
    this.setState( prevState => ({showPrevDiveEvents: !prevState.showPrevDiveEvents}));
  }

  incrementPage() {
    this.setState( prevState => ({page: prevState.page+1}));
  }

  decrementPage() {
    this.setState( prevState => ({page: prevState.page-1}));
  }

  firstPage() {
    this.setState({page: 0});
  }

  handleImagePreviewModal(source, filepath) {
    this.props.showModal('imagePreview', { name: source, filepath: filepath })
  }

  renderImage(source, filepath) {
    return (
      <Card className="event-image-data-card" id={`image_${source}`}>
          <Image fluid onError={handleMissingImage} src={filepath} onClick={ () => this.handleImagePreviewModal(source, filepath)} />
          <span>{source}</span>
      </Card>
    )
  }

  renderImageryCard() {
    if(this.state.event && this.state.event.aux_data) { 
      let frameGrabberData = this.state.event.aux_data.filter(aux_data => imageAuxDataSources.includes(aux_data.data_source))
      let tmpData = []

      if(frameGrabberData.length > 0) {
        for (let i = 0; i < frameGrabberData[0].data_array.length; i+=2) {
    
          tmpData.push({
            source: frameGrabberData[0].data_array[i].data_value,
            filepath: getImageUrl(frameGrabberData[0].data_array[i+1].data_value)
          })
        }

        return (
          tmpData.map((camera) => {
            return (
              <Col className="px-1 mb-2" key={camera.source} xs={12} sm={6} md={4} lg={3}>
                {this.renderImage(camera.source, camera.filepath)}
              </Col>
            )
          })
        )
      }
    }
  }

  renderEventOptionsCard() {

    // return null;
    let return_event_options = this.state.event.event_options.reduce((filtered, event_option, index) => {
      if(event_option.event_option_name !== 'event_comment') {
        filtered.push(<div className="pl-1" key={`event_option_${index}`}><span className="data-name">{event_option.event_option_name.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}:</span> <span className="float-right" style={{wordWrap:'break-word'}} >{event_option.event_option_value}</span><br/></div>);
      }
      return filtered
    },[])

    return (return_event_options.length > 0)? (
      <Col className="px-1 mb-2" xs={12} sm={6} md={4} lg={3}>
        <Card className="event-data-card">
          <Card.Header>Event Options</Card.Header>
          <Card.Body>
            {return_event_options}
          </Card.Body>
        </Card>
      </Col>
    ) : null
  }

  renderAuxDataCard() {

    if(this.state.event && this.state.event.aux_data) {

      const aux_data = this.state.event.aux_data.filter((data) => !excludeAuxDataSources.includes(data.data_source))

      aux_data.sort((a, b) => {
        return (sortAuxDataSourceReference.indexOf(a.data_source) < sortAuxDataSourceReference.indexOf(b.data_source)) ? -1 : 1;
      });

      let return_aux_data = aux_data.map((aux_data) => {
        const aux_data_points = aux_data.data_array.map((data, index) => {
          return(<div key={`${aux_data.data_source}_data_point_${index}`}><span className="data-name">{data.data_name.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}:</span> <span className="float-right" style={{wordWrap:'break-word'}} >{data.data_value} {data.data_uom}</span><br/></div>);
        });

        return (
          <Col className="px-1 pb-2" key={`${aux_data.data_source}_col`} sm={6} md={4} lg={3}>
            <Card className="event-data-card" key={`${aux_data.data_source}`}>
              <Card.Header>{aux_data.data_source.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}</Card.Header>
              <Card.Body>
                {aux_data_points}
              </Card.Body>
            </Card>
          </Col>
        );
      });

      return return_aux_data;
    }

    return null;
  }

  renderLiveDataCard() {

    return (
      <Col className="px-1 pb-2 ml-auto" key="static_status_col" sm={6} md={4} lg={3}>
        <Card className="live-data-card" key="static_status">
          <Card.Body>
            <div>Dive: <span className="float-right">{(this.state.current_lowering) ? this.state.current_lowering.lowering_id : ""}</span></div>
            <div>UTC: <span className="float-right">{this.state.current_time.format("HH:mm:ss")}</span></div>
            <div>Elapse: <span className={`float-right ${(this.state.elapse_time.diff(this.state.threshold_time) > 0) ? "text-warning" : ""}`}>{(this.state.current_lowering) ? this.state.elapse_time.format("HH:mm:ss") : "00:00:00"}</span></div>
          </Card.Body>
        </Card>
      </Col>
    )
  }

  renderEventHistory() {

    if(this.props.history && this.props.history.length > 0){

      let eventArray = [];

      for (let i = 0; i < this.props.history.length; i++) {

        let event = this.props.history[i];
        let comment_exists = false;

        let eventOptionsArray = event.event_options.reduce((filtered, option) => {
          if (option.event_option_name === 'event_comment') {
            if( option.event_option_value.length > 0) {
              comment_exists = true;
            }
          } else {
            filtered.push(`${option.event_option_name.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}: "${option.event_option_value}"`);
          }
          return filtered;
        },[]);
        
        if (event.event_free_text) {
          eventOptionsArray.push(`free_text: "${event.event_free_text}"`);
        } 

        let eventOptions = (eventOptionsArray.length > 0)? '--> ' + eventOptionsArray.join(', '): '';
        let commentIcon = (comment_exists)? <FontAwesomeIcon onClick={() => this.handleEventCommentModal(event)} icon='comment' fixedWidth transform="grow-4"/> : <span onClick={() => this.handleEventCommentModal(event)} className="fa-layers fa-fw"><FontAwesomeIcon icon='comment' fixedWidth transform="grow-4"/><FontAwesomeIcon inverse icon='plus' fixedWidth transform="shrink-4"/></span>;
        let commentTooltip = (comment_exists)? (<OverlayTrigger placement="left" overlay={<Tooltip id={`commentTooltip_${event.id}`}>Edit/View Comment</Tooltip>}>{commentIcon}</OverlayTrigger>) : (<OverlayTrigger placement="left" overlay={<Tooltip id={`commentTooltip_${event.id}`}>Add Comment</Tooltip>}>{commentIcon}</OverlayTrigger>);

        eventArray.push(<ListGroup.Item className="event-list-item py-1" key={event.id} ><span onClick={() => this.handleEventShowDetailsModal(event)}>{event.ts} {`<${event.event_author}>`}: {event.event_value} {eventOptions}</span><span className="float-right">{commentTooltip}</span></ListGroup.Item>);
      }
      return eventArray;
    }

    return (<ListGroup.Item className="event-list-item" key="emptyHistory" >No events found</ListGroup.Item>);
  }

  renderNewestEvent() {

    if(this.state.event) {

      // const hideTooltip = (<Tooltip id="hideHistoryTooltip">Hide this card</Tooltip>);
      const event_comment = (this.state.event.event_options) ? this.state.event.event_options.find((event_option) => (event_option.event_option_name === 'event_comment' && event_option.event_option_value.length > 0)) : null
      const event_comment_card = (event_comment)?(<Card><Card.Body className="data-card-body">Comment: {event_comment.event_option_value}</Card.Body></Card>) : null;

      return (
        <Card className={this.props.className}>
          <ImagePreviewModal />
          <Card.Header>{this.state.event.ts} {`<${this.state.event.event_author}>`}: {this.state.event.event_value} {(this.state.event.event_free_text) ? ` --> "${this.state.event.event_free_text}"` : null}</Card.Header>

          <Card.Body className="pt-2 pb-1">
            <Row>
              {this.renderImageryCard()}
              {this.renderAuxDataCard()}
              {this.renderEventOptionsCard()}
              {this.renderLiveDataCard()}
            </Row>
            <Row>
              <Col xs={12}>
                {event_comment_card}
              </Col>
            </Row>
          </Card.Body>
        </Card>
      );
    }

    return (
      <Card className={this.props.className}>
        <Card.Header></Card.Header>
        <Card.Body className="pt-2 pb-1">
          <Row>
            {this.renderLiveDataCard()}
          </Row>
        </Card.Body>
      </Card>
    );
  }

  render() {

    let eventHistoryCard = null;
    // let newEventDetailsCard = (this.state.showNewEventDetails && this.state.event) ? this.renderNewestEvent() : null
    let newEventDetailsCard = this.renderNewestEvent()

    const ASNAPToggle = (<Form.Check id="ASNAP" type='switch' checked={this.state.showASNAP} disabled={this.state.filter} onChange={() => this.toggleASNAP()} label="ASNAP"/>);
    const PrevDiveEventsToggle = (<Form.Check className="pr-4" id="PrevDiveEvents" type='switch' checked={this.state.showPrevDiveEvents} disabled={!this.state.current_lowering} onChange={() => this.togglePrevDiveEvents()} label="Previous Dive Events"/>);
    
    if (!this.props.history) {
      eventHistoryCard = (
        <Card className={this.props.className}>
          <Card.Header>{ this.renderEventHistoryHeader() }</Card.Header>
          <Card.Body>Loading...</Card.Body>
        </Card>
      );
    }
    else if(this.state.showEventHistory) {

      eventHistoryCard = (
        <Card className={`${this.props.className}`}>
          <Card.Header>{ this.renderEventHistoryHeader() }</Card.Header>
          <ListGroup className={`eventList ${(!this.state.showEventHistoryFullscreen) ? 'collapsed' : ''}`} ref={eventHistoryRef}>
            {this.renderEventHistory()}
          </ListGroup>
          <Card.Footer>
            <Button className="mr-1" size={"sm"} variant="outline-primary" onClick={() => this.firstPage()} disabled={(this.state.page === 0)}>Newest Events</Button>
            <Button className="mr-1" size={"sm"} variant="outline-primary" onClick={() => this.decrementPage()} disabled={(this.state.page === 0)}>Newer Events</Button>
            <Button size={"sm"} variant="outline-primary" onClick={() => this.incrementPage()} disabled={(this.props.history && this.props.history.length !== 20)}>Older Events</Button>
            <Form className="float-right" inline>
              {PrevDiveEventsToggle}
              {ASNAPToggle}
            </Form>
          </Card.Footer>
        </Card>
      );
    }
    else {
      eventHistoryCard = (
        <Card className={this.props.className}>
          <Card.Header>{ this.renderEventHistoryHeader() }</Card.Header>
        </Card>
      );
    }

    return (
      <React.Fragment>
        {newEventDetailsCard}
        {eventHistoryCard}
      </React.Fragment>
    );
  }
}

function mapStateToProps(state) {

  return {
    authenticated: state.auth.authenticated,
    history: state.event_history.history
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(EventHistory);
