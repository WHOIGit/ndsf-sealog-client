import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Button, Modal, Row, Col } from 'react-bootstrap'
import { connectModal } from 'redux-modal'
import ReactFileReader from 'react-file-reader'
import { create_lowering, get_lowerings } from '../api'
import { _Lowerings_ } from '../vocab'

class ImportLoweringsModal extends Component {
  constructor(props) {
    super(props)

    this.state = {
      pending: 0,
      imported: 0,
      errors: 0,
      skipped: 0,
      quit: false
    }

    this.quitImport = this.quitImport.bind(this)
    this.handleLoweringImport = this.handleLoweringImport.bind(this)
  }

  quitImport() {
    this.setState({ quit: true })
    this.props.handleExit()
    this.props.handleHide()
  }

  async insertLowering({
    id,
    lowering_id,
    start_ts,
    stop_ts,
    lowering_location = '',
    lowering_tags = [],
    lowering_hidden = false,
    lowering_additional_meta = {}
  }) {
    const lowering = await get_lowerings({}, id)

    if (lowering) {
      this.setState((prevState) => ({
        skipped: prevState.skipped + 1,
        pending: prevState.pending - 1
      }))
      return
    }

    const response = await create_lowering({
      id,
      lowering_id,
      start_ts,
      stop_ts,
      lowering_location,
      lowering_tags,
      lowering_hidden,
      lowering_additional_meta
    })

    if (response.success) {
      this.setState((prevState) => ({
        imported: prevState.imported + 1,
        pending: prevState.pending - 1
      }))
      return
    }

    this.setState((prevState) => ({
      errors: prevState.errors + 1,
      pending: prevState.pending - 1
    }))
  }

  handleLoweringImport(files) {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        let json = JSON.parse(e.target.result)
        this.setState({
          pending: json.length,
          imported: 0,
          errors: 0,
          skipped: 0
        })

        let currentLowering

        for (let i = 0; i < json.length; i++) {
          if (this.state.quit) {
            break
          }
          currentLowering = json[i]
          await this.insertLowering(currentLowering)
        }
      } catch (error) {
        console.error('Error when trying to parse json = ' + error)
      }
      this.setState({ pending: this.state.quit ? 'Quit Early!' : 'Complete' })
    }
    reader.readAsText(files[0])
  }

  render() {
    const { show, handleExit } = this.props

    if (handleExit) {
      return (
        <Modal show={show} onExit={handleExit} onHide={this.quitImport}>
          <Modal.Header className='bg-light' closeButton>
            <Modal.Title>Import {_Lowerings_}</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <Row>
              <Col xs={6}>
                <ReactFileReader fileTypes={['.json']} handleFiles={this.handleLoweringImport}>
                  <Button size='sm'>Select File</Button>
                </ReactFileReader>
              </Col>
              <Col xs={4}>
                Pending: {this.state.pending}
                <hr />
                Imported: {this.state.imported}
                <br />
                Skipped: {this.state.skipped}
                <br />
                Errors: {this.state.errors}
                <br />
              </Col>
            </Row>
          </Modal.Body>

          <Modal.Footer>
            <Button size='sm' variant='secondary' onClick={this.quitImport}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      )
    } else {
      return null
    }
  }
}

ImportLoweringsModal.propTypes = {
  handleHide: PropTypes.func.isRequired,
  handleExit: PropTypes.func,
  show: PropTypes.bool.isRequired
}

export default connectModal({ name: 'importLowerings' })(ImportLoweringsModal)
