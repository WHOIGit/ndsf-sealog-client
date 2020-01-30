import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { connect } from 'react-redux';
import { Button, ListGroup, Card, Tooltip, OverlayTrigger, Row, Col } from 'react-bootstrap';
import ImagePreviewModal from './image_preview_modal';
import * as mapDispatchToProps from '../actions';
import { Client } from '@hapi/nes/lib/client';
import axios from 'axios';
import Cookies from 'universal-cookie';

import { WS_ROOT_URL, API_ROOT_URL, IMAGE_PATH } from '../client_config';

const cookies = new Cookies();

const excludeAuxDataSources = ['vehicleRealtimeFramegrabberData']

const imageAuxDataSources = ['vehicleRealtimeFramegrabberData']

const eventHistoryRef = "eventHistory";

class EventHistory extends Component {

  constructor (props) {
    super(props);

    this.state = {
      page: 0,
      event: null,
      hideASNAP: true,
      showNewEventDetails: false,
      showEventHistory: true,
      showEventHistoryFullscreen: false
    };

    this.client = new Client(`${WS_ROOT_URL}`);
    this.connectToWS = this.connectToWS.bind(this);
  }

  componentDidMount() {
    this.props.fetchEventHistory();
    if(this.props.authenticated) {
      this.connectToWS();
    }
  }

  componentDidUpdate(prevProps, prevState) {

    if(prevState.page !== this.state.page) {
      this.props.fetchEventHistory(!this.state.hideASNAP, this.state.page);      
    }

    if(prevState.hideASNAP !== this.state.hideASNAP) {
      this.props.fetchEventHistory(!this.state.hideASNAP, this.state.page);      
    }

    if(prevState.showNewEventDetails !== this.state.showNewEventDetails && this.props.history[0] && this.state.showNewEventDetails) {
      this.fetchEventExport(this.props.history[0].id);      
    }

    if(prevProps.history[0] !== this.props.history[0] && this.state.showNewEventDetails && this.props.history[0]) {
      this.fetchEventExport(this.props.history[0].id);
    }
  }

  componentWillUnmount() {
    if(this.props.authenticated) {
      this.client.disconnect();
    }
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

      const updateHandler = (update, flags) => {
        if(!(this.state.hideASNAP && update.event_value === "ASNAP")) {
          this.props.updateEventHistory(update);
        }
      };

      const updateAuxDataHandler = (update, flags) => {
        console.log("updated aux data");
        if(this.state.showNewEventDetails && update.event_id === this.state.event.id) {
          this.fetchEventExport(this.state.event.id);
        }
      };

      const deleteHandler = (update, flags) => {
        this.props.fetchEventHistory(!this.state.hideASNAP, this.state.page);
      };

      this.client.subscribe('/ws/status/newEvents', updateHandler);
      this.client.subscribe('/ws/status/updateEvents', updateHandler);
      this.client.subscribe('/ws/status/deleteEvents', deleteHandler);
      this.client.subscribe('/ws/status/newEventAuxData', updateAuxDataHandler);
      this.client.subscribe('/ws/status/updateEventAuxData', updateAuxDataHandler);

    } catch(error) {
      console.log(error);
      throw(error);
    }
  }


  async fetchEventExport(event_id) {

    let url = `${API_ROOT_URL}/api/v1/event_exports/${event_id}`;
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
    const expandNewestEventTooltip = (<Tooltip id="expandNewestEventTooltip">Expand last Event</Tooltip>);
    const compressTooltip = (<Tooltip id="compressTooltip">Compress event history</Tooltip>);
    const showTooltip = (<Tooltip id="showHistoryTooltip">Show event history</Tooltip>);
    const hideTooltip = (<Tooltip id="hideHistoryTooltip">Hide this card</Tooltip>);

    const ASNAPToggleIcon = (this.state.hideASNAP)? "Show ASNAP" : "Hide ASNAP";
    const ASNAPToggle = (<span style={{ marginRight: "10px" }} variant="secondary" size="sm" onClick={() => this.toggleASNAP()}>{ASNAPToggleIcon} </span>);

    const NewEventToggleIcon = (this.state.showNewEventDetails)? null : "Show Newest Event Details";
    const NewEventToggle = (NewEventToggleIcon) ? <span style={{ marginRight: "10px" }} variant="secondary" size="sm" onClick={() => this.toggleNewEventDetails()}>{NewEventToggleIcon} </span> : null;

    if(this.state.showEventHistory) {

      if(this.state.showEventHistoryFullscreen) {
        return (
          <div>
            { Label }
            <div className="float-right">
              {NewEventToggle}
              {ASNAPToggle}
              <OverlayTrigger placement="top" overlay={compressTooltip}><span style={{ marginRight: "10px" }} variant="secondary" size="sm" onClick={ () => this.handleHideEventHistoryFullscreen() }><FontAwesomeIcon icon='compress' fixedWidth/></span></OverlayTrigger>{' '}
              <OverlayTrigger placement="top" overlay={hideTooltip}><span variant="secondary" size="sm" onClick={ () => this.handleHideEventHistory() }><FontAwesomeIcon icon='eye-slash' fixedWidth/></span></OverlayTrigger>
            </div>
          </div>
        );
      }
      
      return (
        <div>
          { Label }
          <div className="float-right">
            {NewEventToggle}
            {ASNAPToggle}
            <OverlayTrigger placement="top" overlay={expandTooltip}><span style={{ marginRight: "10px" }} variant="secondary" size="sm" onClick={ () => this.handleShowEventHistoryFullscreen() }><FontAwesomeIcon icon='expand' fixedWidth/></span></OverlayTrigger>{' '}
            <OverlayTrigger placement="top" overlay={hideTooltip}><span variant="secondary" size="sm" onClick={ () => this.handleHideEventHistory() }><FontAwesomeIcon icon='eye-slash' fixedWidth/></span></OverlayTrigger>
          </div>
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

  handleShowEventHistoryFullscreen() {
    this.setState({showEventHistoryFullscreen: true});
  }

  toggleASNAP() {
    this.setState( prevState => ({hideASNAP: !prevState.hideASNAP}));
    // this.props.fetchEventHistory(this.state.hideASNAP, this.state.page);
  }

  toggleNewEventDetails() {
    this.setState( prevState => ({showNewEventDetails: !prevState.showNewEventDetails}));
    // this.props.fetchEventHistory(this.state.showNewEventDetails, this.state.page);
  }

  incrementPage() {
    // this.props.fetchEventHistory(!this.state.hideASNAP, this.state.page+1);
    this.setState( prevState => ({page: prevState.page+1}));
  }

  decrementPage() {
    // this.props.fetchEventHistory(!this.state.hideASNAP, this.state.page-1);
    this.setState( prevState => ({page: prevState.page-1}));
  }

  firstPage() {
    // this.props.fetchEventHistory(!this.state.hideASNAP, 0);
    this.setState({page: 0});
  }

  handleMissingImage(ev) {
    ev.target.src = `${ROOT_PATH}images/noimage.jpeg`
  }

  handleImagePreviewModal(source, filepath) {
    this.props.showModal('imagePreview', { name: source, filepath: filepath })
  }

  renderImage(source, filepath) {
    return (
      <Card id={`image_${source}`}>
        <Card.Body className="data-card-body">
          <Image  fluid onError={this.handleMissingImage} src={filepath} onClick={ () => this.handleImagePreviewModal(source, filepath)} />
          <div>{source}</div>
        </Card.Body>
      </Card>
    )
  }

  renderImageryCard() {
    if(this.state.event && this.state.event.aux_data) { 
      let frameGrabberData = this.state.event.aux_data.filter(aux_data => imageAuxDataSources.includes(aux_data.data_source))
      let tmpData = []

      if(frameGrabberData.length > 0) {
        for (let i = 0; i < frameGrabberData[0].data_array.length; i+=2) {
    
          tmpData.push({source: frameGrabberData[0].data_array[i].data_value, filepath: API_ROOT_URL + IMAGE_PATH + '/' + path.basename(frameGrabberData[0].data_array[i+1].data_value)} )
        }

        return (
          <Row>
            {
              tmpData.map((camera) => {
                return (
                  <Col key={camera.source} xs={12} sm={6} md={4} lg={3}>
                    {this.renderImage(camera.source, camera.filepath)}
                  </Col>
                )
              })
            }
          </Row>
        )
      }
    }
  }

  renderEventOptionsCard() {

    // return null;
    let return_event_options = this.state.event.event_options.reduce((filtered, event_option, index) => {
      if(event_option.event_option_name !== 'event_comment') {
        filtered.push(<div key={`event_option_${index}`}><span>{event_option.event_option_name}:</span> <span className="float-right" style={{wordWrap:'break-word'}} >{event_option.event_option_value}</span><br/></div>);
      }
      return filtered
    },[])

    return (return_event_options.length > 0)? (
      <Col xs={12} sm={6} md={4} lg={3}>
        <Card>
          <Card.Header className="data-card-header">Event Options</Card.Header>
          <Card.Body className="data-card-body">
            <div style={{paddingLeft: "10px"}}>
              {return_event_options}
            </div>
          </Card.Body>
        </Card>
      </Col>
    ) : null
  }

  renderAuxDataCard() {

    if(this.state.event && this.state.event.aux_data) {
      let return_aux_data = this.state.event.aux_data.reduce((filtered, aux_data) => {
        if(!excludeAuxDataSources.includes(aux_data.data_source)) {
          let aux_data_points = aux_data.data_array.map((data, index) => {
            return(<div key={`${aux_data.data_source}_data_point_${index}`}><span>{data.data_name}:</span> <span className="float-right" style={{wordWrap:'break-word'}} >{data.data_value} {data.data_uom}</span><br/></div>)
          })

          if(aux_data_points.length > 0) {
            filtered.push(
              <Col key={`${aux_data.data_source}_col`} xs={12} sm={6} md={4} lg={3}>
                <Card key={`${aux_data.data_source}`}>
                  <Card.Header className="data-card-header">{aux_data.data_source}</Card.Header>
                  <Card.Body className="data-card-body">
                    <div style={{paddingLeft: "10px"}}>
                      {aux_data_points}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            )
          }
        }

        return filtered
      },[])

      return return_aux_data
    }

    return null
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
            filtered.push(`${option.event_option_name}: "${option.event_option_value}"`);
          }
          return filtered;
        },[]);
        
        if (event.event_free_text) {
          eventOptionsArray.push(`free_text: "${event.event_free_text}"`);
        } 

        let eventOptions = (eventOptionsArray.length > 0)? '--> ' + eventOptionsArray.join(', '): '';
        let commentIcon = (comment_exists)? <FontAwesomeIcon onClick={() => this.handleEventCommentModal(event)} icon='comment' fixedWidth transform="grow-4"/> : <span onClick={() => this.handleEventCommentModal(event)} className="fa-layers fa-fw"><FontAwesomeIcon icon='comment' fixedWidth transform="grow-4"/><FontAwesomeIcon inverse icon='plus' fixedWidth transform="shrink-4"/></span>;
        let commentTooltip = (comment_exists)? (<OverlayTrigger placement="left" overlay={<Tooltip id={`commentTooltip_${event.id}`}>Edit/View Comment</Tooltip>}>{commentIcon}</OverlayTrigger>) : (<OverlayTrigger placement="left" overlay={<Tooltip id={`commentTooltip_${event.id}`}>Add Comment</Tooltip>}>{commentIcon}</OverlayTrigger>);

        eventArray.push(<ListGroup.Item className="event-list-item" key={event.id} ><span onClick={() => this.handleEventShowDetailsModal(event)}>{event.ts} {`<${event.event_author}>`}: {event.event_value} {eventOptions}</span><span className="float-right">{commentTooltip}</span></ListGroup.Item>);
      }
      return eventArray;
    }

    return (<ListGroup.Item className="event-list-item" key="emptyHistory" >No events found</ListGroup.Item>);
  }

  renderNewestEvent() {

    const hideTooltip = (<Tooltip id="hideHistoryTooltip">Hide this card</Tooltip>);

    // const event_free_text_card = (this.state.event.event_free_text)? (<Card><Card.Body className="data-card-body">Free-form Text: {this.state.event.event_free_text}</Card.Body></Card>) : null;
    const event_comment = (this.state.event.event_options) ? this.state.event.event_options.find((event_option) => (event_option.event_option_name === 'event_comment' && event_option.event_option_value.length > 0)) : null

    const event_comment_card = (event_comment)?(<Card><Card.Body className="data-card-body">Comment: {event_comment.event_option_value}</Card.Body></Card>) : null;

    console.log("show details");
    return (
      <Card>
        <ImagePreviewModal />
        <Card.Header>{this.state.event.ts} {`<${this.state.event.event_author}>`}: {this.state.event.event_value} {(this.state.event.event_free_text) ? ` --> "${this.state.event.event_free_text}"` : null}<OverlayTrigger placement="top" overlay={hideTooltip}><span className="float-right" variant="secondary" size="sm" onClick={ () => this.toggleNewEventDetails() }><FontAwesomeIcon icon='eye-slash' fixedWidth/></span></OverlayTrigger></Card.Header>

        <Card.Body>
          <Row>
            <Col xs={12}>
              {this.renderImageryCard()}
            </Col>
            {this.renderEventOptionsCard()}
            {this.renderAuxDataCard()}
            <Col xs={12}>
              {event_comment_card}
            </Col>
          </Row>
        </Card.Body>
      </Card>
    );
  }

  render() {

    let eventHistoryCard = null;
    let newEventDetailsCard = (this.state.showNewEventDetails && this.state.event) ? this.renderNewestEvent() : null

    console.log(newEventDetailsCard);

    if (!this.props.history) {
      eventHistoryCard = (
        <Card>
          <Card.Header>{ this.renderEventHistoryHeader() }</Card.Header>
          <Card.Body>Loading...</Card.Body>
        </Card>
      );
    }
    else if(this.state.showEventHistory) {

      if (this.state.showEventHistoryFullscreen) {
        eventHistoryCard = (
          <div>
            <Card>
              <Card.Header>{ this.renderEventHistoryHeader() }</Card.Header>
              <ListGroup ref={eventHistoryRef}>
                {this.renderEventHistory()}
              </ListGroup>
              <Card.Footer>
                <Button size={"sm"} variant="outline-primary" onClick={() => this.firstPage()} disabled={(this.state.page === 0)}>Newest Events</Button>
                <Button size={"sm"} variant="outline-primary" onClick={() => this.decrementPage()} disabled={(this.state.page === 0)}>Newer Events</Button>
                <Button size={"sm"} variant="outline-primary" onClick={() => this.incrementPage()} disabled={(this.props.history && this.props.history.length !== 20)}>Older Events</Button>
              </Card.Footer>
            </Card>
          </div>
        );
      }
      else {
        eventHistoryCard = (
          <div>
            <Card>
              <Card.Header>{ this.renderEventHistoryHeader() }</Card.Header>
              <ListGroup className="eventHistory" ref={eventHistoryRef}>
                {this.renderEventHistory()}
              </ListGroup>
              <Card.Footer>
                <Button size={"sm"} variant="outline-primary" onClick={() => this.firstPage()} disabled={(this.state.page === 0)}>Newest Events</Button>
                <Button size={"sm"} variant="outline-primary" onClick={() => this.decrementPage()} disabled={(this.state.page === 0)}>Newer Events</Button>
                <Button size={"sm"} variant="outline-primary" onClick={() => this.incrementPage()} disabled={(this.props.history && this.props.history.length !== 20)}>Older Events</Button>
              </Card.Footer>
            </Card>
          </div>
        );
      }
    }
    else {
      eventHistoryCard = (
        <Card>
          <Card.Header>{ this.renderEventHistoryHeader() }</Card.Header>
        </Card>
      );
    }



    return (
      <div>
        <Col>
          {newEventDetailsCard}
        </Col><Col>
          {eventHistoryCard}
        </Col>
      </div>
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
