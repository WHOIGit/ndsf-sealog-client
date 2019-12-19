import React, { Component } from 'react';
import { compose } from 'redux';
import path from 'path';
import { connect } from 'react-redux';
import { connectModal } from 'redux-modal';
import PropTypes from 'prop-types';
import axios from 'axios';
import Cookies from 'universal-cookie';
import { Row, Col, Image, Card, Modal } from 'react-bootstrap';
import ImagePreviewModal from './image_preview_modal';

import * as mapDispatchToProps from '../actions';

import { API_ROOT_URL, IMAGE_PATH, ROOT_PATH } from '../client_config';

const cookies = new Cookies();

const excludeAuxDataSources = ['vehicleRealtimeFramegrabberData']

const imageAuxDataSources = ['vehicleRealtimeFramegrabberData']

class EventShowDetailsModal extends Component {

  constructor (props) {
    super(props);

    this.state = { event: {} }

    this.handleImagePreviewModal = this.handleImagePreviewModal.bind(this);

  }

  static propTypes = {
    event: PropTypes.object,
    handleHide: PropTypes.func.isRequired
  };

  componentDidMount() {
    this.initEvent()
  }

  componentWillUnmount() {
  }

  async initEvent() {
    try {
      const response = await axios.get(`${API_ROOT_URL}/api/v1/event_exports/${this.props.event.id}`,
        {
          headers: {
          authorization: cookies.get('token')
          }
        }      
      )
      this.setState({event: response.data});
    }
    catch(error) {
      console.log(error);
    }    
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
    if(this.props.event && this.state.event.aux_data) { 
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
                  <Col key={camera.source} xs={12} sm={6} md={6} lg={3}>
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
      <Col xs={12} sm={6} md={6} lg={4}>
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

    if(this.props.event && this.state.event.aux_data) {
      let return_aux_data = this.state.event.aux_data.reduce((filtered, aux_data) => {
        if(!excludeAuxDataSources.includes(aux_data.data_source)) {
          let aux_data_points = aux_data.data_array.map((data, index) => {
            return(<div key={`${aux_data.data_source}_data_point_${index}`}><span>{data.data_name}:</span> <span className="float-right" style={{wordWrap:'break-word'}} >{data.data_value} {data.data_uom}</span><br/></div>)
          })

          if(aux_data_points.length > 0) {
            filtered.push(
              <Col key={`${aux_data.data_source}_col`} xs={12} sm={6} md={6} lg={4}>
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

  render() {
    const { show, event } = this.props

    const event_free_text_card = (this.state.event.event_free_text)? (<Card><Card.Body className="data-card-body">Free-form Text: {this.state.event.event_free_text}</Card.Body></Card>) : null;
    const event_comment = (this.state.event.event_options) ? this.state.event.event_options.find((event_option) => (event_option.event_option_name === 'event_comment' && event_option.event_option_value.length > 0)) : null

    const event_comment_card = (event_comment)?(<Card><Card.Body className="data-card-body">Comment: {event_comment.event_option_value}</Card.Body></Card>) : null;
    
    if (event ) {
      if(this.state.event.event_options) {
        return (
          <Modal size="lg" show={show} onHide={this.props.handleHide}>
              <ImagePreviewModal />
              <Modal.Header closeButton>
                <Modal.Title as="h5">Event Details: {this.state.event.event_value}</Modal.Title>
              </Modal.Header>

              <Modal.Body>
                <span>User: {this.state.event.event_author}</span><br/>
                <span>Date: {this.state.event.ts}</span>
                <Row style={{paddingTop: "8px"}}>
                  <Col xs={12}>
                    {this.renderImageryCard()}
                  </Col>
                </Row>
                <Row style={{paddingTop: "8px"}}>
                  {this.renderEventOptionsCard()}
                  {this.renderAuxDataCard()}
                </Row>
                <Row style={{paddingTop: "8px"}}>
                  <Col xs={12}>
                    {event_free_text_card}
                  </Col>
                </Row>
                <Row style={{paddingTop: "8px"}}>
                  <Col xs={12}>
                    {event_comment_card}
                  </Col>
                </Row>
              </Modal.Body>
          </Modal>
        );
      } else {
        return (
          <Modal size="lg" show={show} onHide={this.props.handleHide}>
            <Modal.Header closeButton>
              <Modal.Title as="h5">Event Details: {this.state.event.event_value}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              Loading...
            </Modal.Body>
          </Modal>
        );
      }
    }
    else {
      return null;
    }
  }
}

function mapStateToProps(state) {

  return {
    lowering: state.lowering.lowering,
    roles: state.user.profile.roles,
  }
}

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  connectModal({ name: 'eventShowDetails', destroyOnHide: true }) 
)(EventShowDetailsModal)

