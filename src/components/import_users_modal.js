import React, { Component } from 'react'
import PropTypes from 'prop-types'
import axios from 'axios'
import { Button, Modal, Row, Col } from 'react-bootstrap'
import { connectModal } from 'redux-modal'
import ReactFileReader from 'react-file-reader'
import Cookies from 'universal-cookie'
import { API_ROOT_URL } from '../client_config'

const cookies = new Cookies()

class ImportUsersModal extends Component {
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

  async insertUser({ id, username, fullname, email, password = '', roles, system_user = false }) {
    const userExists = await axios
      .get(`${API_ROOT_URL}/api/v1/users/${id}`, {
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

    if (!userExists) {
      await axios
        .post(
          `${API_ROOT_URL}/api/v1/users`,
          { id, username, fullname, email, password, roles, system_user },
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

  async importUsersFromFile(e) {
    try {
      let json = JSON.parse(e.target.result)
      this.setState({
        pending: json.length,
        imported: 0,
        errors: 0,
        skipped: 0
      })

      let currentUser

      for (let i = 0; i < json.length; i++) {
        if (this.state.quit) {
          break
        }
        currentUser = json[i]
        await this.insertUser(currentUser)
      }
    } catch (error) {
      console.error('Error when trying to parse json = ' + error)
    }
    this.setState({ pending: this.state.quit ? 'Quit Early!' : 'Complete' })
  }

  handleUserRecordImport(files) {
    let reader = new FileReader()
    reader.onload = this.importUsersFromFile
    reader.readAsText(files[0])
  }

  render() {
    const { show, handleExit } = this.props

    if (handleExit) {
      return (
        <Modal show={show} onExit={handleExit} onHide={this.quitImport}>
          <Modal.Header className='bg-light' closeButton>
            <Modal.Title>Import Users</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <Row>
              <Col xs={6}>
                <ReactFileReader fileTypes={['.json']} handleFiles={this.handleUserRecordImport}>
                  <Button size='sm'>Select File</Button>
                </ReactFileReader>
              </Col>
              <Col xs={3}>
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

ImportUsersModal.propTypes = {
  handleHide: PropTypes.func.isRequired,
  handleExit: PropTypes.func,
  show: PropTypes.bool.isRequired
}

export default connectModal({ name: 'importUsers' })(ImportUsersModal)
