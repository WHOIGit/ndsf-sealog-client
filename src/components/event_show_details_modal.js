import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { connectModal } from 'redux-modal';
import PropTypes from 'prop-types';
import axios from 'axios';
import Cookies from 'universal-cookie';
import { Row, Col, Image, Card, Modal } from 'react-bootstrap';
import ImagePreviewModal from './image_preview_modal';
import { DataCardGrid } from './data_cards';

import * as mapDispatchToProps from '../actions';

import { API_ROOT_URL } from '../client_config';

const cookies = new Cookies();


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

  handleImagePreviewModal(source, filepath) {
    this.props.showModal('imagePreview', { name: source, filepath: filepath })
  }

  render() {
    const { show, event } = this.props

    const event_free_text_card = (this.state.event.event_free_text)? (<Col className="px-1 pb-2" xs={12}><Card className="event-data-card"><Card.Body>Free-form Text: {this.state.event.event_free_text}</Card.Body></Card></Col>) : null;
    const event_comment = (this.state.event.event_options) ? this.state.event.event_options.find((event_option) => (event_option.event_option_name === 'event_comment' && event_option.event_option_value.length > 0)) : null

    const event_comment_card = (event_comment)?(<Col className="px-1" xs={12}><Card className="event-data-card"><Card.Body>Comment: {event_comment.event_option_value}</Card.Body></Card></Col>) : null;
    
    if (event ) {
      if(this.state.event.event_options) {
        return (
          <Modal size="lg" show={show} onHide={this.props.handleHide}>
              <ImagePreviewModal />
              <Modal.Header closeButton>
                <Modal.Title as="h5">Event Details: {this.state.event.event_value}</Modal.Title>
              </Modal.Header>

              <Modal.Body className="px-4">
                <Row>
                  <Col className="px-1 pb-2" xs={12}>
                    <Card className="event-data-card">
                      <Card.Body>
                        <span>User: {this.state.event.event_author}</span>
                        <span className="float-right">Date: {this.state.event.ts}</span>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
                <Row>
                  <DataCardGrid
                    event={this.state.event}
                    onImageClick={this.handleImagePreviewModal}
                  />
                </Row>
                <Row>
                  {event_free_text_card}
                  {event_comment_card}
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
    roles: state.user.profile.roles,
  }
}

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  connectModal({ name: 'eventShowDetails', destroyOnHide: true })
)(EventShowDetailsModal)
