import React, { Component } from 'react'
import { compose } from 'redux'
import { connect } from 'react-redux'
import { connectModal } from 'redux-modal'
import PropTypes from 'prop-types'
import { Row, Col, Card, Modal } from 'react-bootstrap'
import ImagePreviewModal from './image_preview_modal'
import AuxDataCards from './aux_data_cards'
import EventOptionsCard from './event_options_card'
import ImageryCards from './imagery_cards'
import { EXCLUDE_AUX_DATA_SOURCES, IMAGES_AUX_DATA_SOURCES, AUX_DATA_SORT_ORDER } from '../client_config'
import { get_event_exports, handle_image_file_download } from '../api'
import * as mapDispatchToProps from '../actions'

const excludeAuxDataSources = Array.from(new Set([...EXCLUDE_AUX_DATA_SOURCES, ...IMAGES_AUX_DATA_SOURCES]))

class EventShowDetailsModal extends Component {
  constructor(props) {
    super(props)

    this.state = { event: {} }
    this.handleImagePreviewModal = this.handleImagePreviewModal.bind(this)
  }

  componentDidMount() {
    this.initEvent()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.event !== this.props.event) {
      if (this.props.event && this.props.event.id) {
        this.initEvent()
      } else {
        this.setState({ event: {} })
      }
    }
  }

  async initEvent() {
    const event = await get_event_exports({}, this.props.event.id)
    this.setState({ event })
  }

  handleImagePreviewModal(source, filepath) {
    this.props.showModal('imagePreview', { name: source, filepath: filepath })
  }

  render() {
    const { show, event } = this.props
    const event_free_text_card = this.state.event.event_free_text ? (
      <Col className='px-1 pb-2' xs={12}>
        <Card className='event-data-card'>
          <Card.Body>Free-form Text: {this.state.event.event_free_text}</Card.Body>
        </Card>
      </Col>
    ) : null
    const event_comment = this.state.event.event_options
      ? this.state.event.event_options.find(
          (event_option) => event_option.event_option_name === 'event_comment' && event_option.event_option_value.length > 0
        )
      : null
    const event_comment_card = event_comment ? (
      <Col className='px-1' xs={12}>
        <Card className='event-data-card'>
          <Card.Body>Comment: {event_comment.event_option_value}</Card.Body>
        </Card>
      </Col>
    ) : null
    const framegrab_data_sources = this.state.event.aux_data
      ? this.state.event.aux_data.filter((aux_data) => IMAGES_AUX_DATA_SOURCES.includes(aux_data.data_source))
      : []
    const aux_data = this.state.event.aux_data
      ? this.state.event.aux_data.filter((data) => !excludeAuxDataSources.includes(data.data_source))
      : []
    aux_data.sort((a, b) => {
      return AUX_DATA_SORT_ORDER.indexOf(a.data_source) < AUX_DATA_SORT_ORDER.indexOf(b.data_source) ? -1 : 1
    })

    if (event) {
      if (this.state.event.event_options) {
        return (
          <Modal size='lg' show={show} onHide={this.props.handleHide}>
            <ImagePreviewModal handleDownload={handle_image_file_download} />
            <Modal.Header className='bg-light' closeButton>
              <Modal.Title as='h5'>Event Details: {this.state.event.event_value}</Modal.Title>
            </Modal.Header>

            <Modal.Body className='px-4'>
              <Row>
                <Col className='event-data-col' xs={12}>
                  <Card className='event-data-card'>
                    <Card.Body>
                      <span>User: {this.state.event.event_author}</span>
                      <span className='float-right'>Date: {this.state.event.ts}</span>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              <Row>
                <ImageryCards framegrab_data_sources={framegrab_data_sources} onClick={this.handleImagePreviewModal} lg={4} />
                <AuxDataCards aux_data={aux_data} lg={4} />
                <EventOptionsCard event_options={this.state.event.event_options} lg={4} />
              </Row>
              <Row>
                {event_free_text_card}
                {event_comment_card}
              </Row>
            </Modal.Body>
          </Modal>
        )
      } else {
        return (
          <Modal size='lg' show={show} onHide={this.props.handleHide}>
            <Modal.Header className='bg-light' closeButton>
              <Modal.Title as='h5'>Event Details: {this.state.event.event_value}</Modal.Title>
            </Modal.Header>
            <Modal.Body>Loading...</Modal.Body>
          </Modal>
        )
      }
    } else {
      return null
    }
  }
}

EventShowDetailsModal.propTypes = {
  event: PropTypes.object,
  handleHide: PropTypes.func.isRequired,
  show: PropTypes.bool.isRequired,
  showModal: PropTypes.func.isRequired
}

const mapStateToProps = (state) => {
  return {
    cruise: state.cruise.cruise,
    roles: state.user.profile.roles
  }
}

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  connectModal({ name: 'eventShowDetails', destroyOnHide: true })
)(EventShowDetailsModal)
