import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Button, Modal, Row, Col } from 'react-bootstrap'
import { connectModal } from 'redux-modal'
import ReactFileReader from 'react-file-reader'
import cookies from '../cookies'
import { create_event_template, get_event_templates } from '../api'

class ImportEventTemplatesModal extends Component {
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
    this.handleEventTemplateImport = this.handleEventTemplateImport.bind(this)
  }

  quitImport() {
    this.setState({ quit: true })
    this.props.handleExit()
    this.props.handleHide()
  }

  async insertEventTemplate({
    id,
    event_name,
    event_value,
    event_free_text_required = false,
    event_options = [],
    system_template = false,
    template_categories = []
  }) {

    const template = await get_event_templates({}, id)

    if(template) {
      this.setState((prevState) => ({
        skipped: prevState.skipped + 1,
        pending: prevState.pending - 1
      }))
      return
    }

    const response = await create_event_template({
      id,
      event_name,
      event_value,
      event_free_text_required ,
      event_options,
      system_template,
      template_categories
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

  handleEventTemplateImport(files) {
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

        let currentTemplate

        for (let i = 0; i < json.length; i++) {
          if (this.state.quit) {
            break
          }
          currentTemplate = json[i]
          await this.insertEventTemplate(currentTemplate)
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

    return (
      <Modal show={show} onExit={handleExit} onHide={this.quitImport}>
        <Modal.Header className='bg-light' closeButton>
          <Modal.Title>Import Event Templates</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Row>
            <Col xs={6}>
              <ReactFileReader fileTypes={['.json']} handleFiles={this.handleEventTemplateImport}>
                <Button size='sm'>Select File</Button>
              </ReactFileReader>
            </Col>
            <Col xs={6} sm={4}>
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
  }
}

ImportEventTemplatesModal.propTypes = {
  handleHide: PropTypes.func.isRequired,
  handleExit: PropTypes.func,
  show: PropTypes.bool.isRequired
}

export default connectModal({ name: 'importEventTemplates' })(ImportEventTemplatesModal)
