import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Button, Modal, Row, Col } from 'react-bootstrap'
import { connectModal } from 'redux-modal'
import ReactFileReader from 'react-file-reader'
import { create_cruise, get_cruises } from '../api'
import { _Cruises_ } from '../vocab'

class ImportCruisesModal extends Component {
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
    this.handleCruiseImport = this.handleCruiseImport.bind(this)
  }

  quitImport() {
    this.setState({ quit: true })
    this.props.handleExit()
    this.props.handleHide()
  }

  async insertCruise({
    id,
    cruise_id,
    start_ts,
    stop_ts,
    cruise_location = '',
    cruise_tags = [],
    cruise_hidden = false,
    cruise_additional_meta = {}
  }) {
    const cruise = await get_cruises({}, id)

    if (cruise) {
      this.setState((prevState) => ({
        skipped: prevState.skipped + 1,
        pending: prevState.pending - 1
      }))
      return
    }

    const response = await create_cruise({
      id,
      cruise_id,
      start_ts,
      stop_ts,
      cruise_location,
      cruise_tags,
      cruise_hidden,
      cruise_additional_meta
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

  handleCruiseImport(files) {
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

        let currentCruise

        for (let i = 0; i < json.length; i++) {
          if (this.state.quit) {
            break
          }
          currentCruise = json[i]
          await this.insertCruise(currentCruise)
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
            <Modal.Title>Import {_Cruises_}</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <Row>
              <Col xs={6}>
                <ReactFileReader fileTypes={['.json']} handleFiles={this.handleCruiseImport}>
                  <Button size='sm'>Select File</Button>
                </ReactFileReader>
              </Col>
              <Col sm={6} xs={4}>
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

ImportCruisesModal.propTypes = {
  handleHide: PropTypes.func.isRequired,
  handleExit: PropTypes.func,
  show: PropTypes.bool.isRequired
}

export default connectModal({ name: 'importCruises' })(ImportCruisesModal)
