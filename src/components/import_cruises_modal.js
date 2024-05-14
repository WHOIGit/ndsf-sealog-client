import React, { Component } from 'react'
import PropTypes from 'prop-types'
import axios from 'axios'
import { Button, Modal, Row, Col } from 'react-bootstrap'
import { connectModal } from 'redux-modal'
import ReactFileReader from 'react-file-reader'
import Cookies from 'universal-cookie'
import { API_ROOT_URL } from '../client_config'
import { _Cruises_ } from '../vocab'

const cookies = new Cookies()

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
    const cruiseExists = await axios
      .get(`${API_ROOT_URL}/api/v1/cruises/${id}`, {
        headers: {
          Authorization: 'Bearer ' + cookies.get('token'),
          'content-type': 'application/json'
        }
      })
      .then(() => {
        this.setState((prevState) => ({
          skipped: prevState.skipped + 1,
          pending: prevState.pending - 1
        }))
        return true
      })
      .catch(() => {
        return false
      })

    if (!cruiseExists) {
      await axios
        .post(
          `${API_ROOT_URL}/api/v1/cruises`,
          {
            id,
            cruise_id,
            start_ts,
            stop_ts,
            cruise_location,
            cruise_tags,
            cruise_hidden,
            cruise_additional_meta
          },
          {
            headers: {
              Authorization: 'Bearer ' + cookies.get('token'),
              'content-type': 'application/json'
            }
          }
        )
        .then(() => {
          this.setState((prevState) => ({
            imported: prevState.imported + 1,
            pending: prevState.pending - 1
          }))
        })
        .catch((error) => {
          if (error.response && error.response.data.statusCode !== 400) {
            console.debug(error)
          } else {
            console.error('Problem connecting to API')
            console.debug(error)
          }

          this.setState((prevState) => ({
            errors: prevState.errors + 1,
            pending: prevState.pending - 1
          }))
        })
    }
  }

  async importCruisesFromFile(e) {
    try {
      let json = JSON.parse(e.target.result)

      if (Array.isArray(json)) {
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
      } else {
        this.setState({
          pending: 1,
          imported: 0,
          errors: 0,
          skipped: 0
        })

        const result = await this.insertCruise(json)
        if (result) {
          this.setState({ pending: 'Complete!' })
        }
      }
    } catch (error) {
      console.error('Error parsing json')
      console.debug(error)
    }
    this.setState({ pending: this.state.quit ? 'Quit Early!' : 'Complete' })
  }

  handleCruiseRecordImport(files) {
    this.setState({
      pending: 'Calculating...'
    })

    let reader = new FileReader()
    reader.onload = this.importCruisesFromFile
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
                <ReactFileReader fileTypes={['.json']} handleFiles={this.handleCruiseRecordImport}>
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

ImportCruisesModal.propTypes = {
  handleHide: PropTypes.func.isRequired,
  handleExit: PropTypes.func,
  show: PropTypes.bool.isRequired
}

export default connectModal({ name: 'importCruises' })(ImportCruisesModal)
