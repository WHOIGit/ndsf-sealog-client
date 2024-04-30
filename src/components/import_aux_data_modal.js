import React, { Component } from 'react';
import { connectModal } from 'redux-modal';
import PropTypes from 'prop-types';
import axios from 'axios';
import Cookies from 'universal-cookie';
import ReactFileReader from 'react-file-reader';
import { Button, Modal, Row, Col } from 'react-bootstrap';
import { API_ROOT_URL } from '../client_config';

const cookies = new Cookies();

class ImportAuxDataModal extends Component {

  constructor (props) {
    super(props);

    this.state = {
      pending: 0,
      imported: 0,
      errors: 0,
      updated: 0,
      quit: false,
    }

    this.handleHideCustom = this.handleHideCustom.bind(this);
  }

  static propTypes = {
    handleHide: PropTypes.func.isRequired
    // handleExit: PropTypes.func
  };

  handleHideCustom() {
    this.setState({quit: true})
    this.props.handleHide()
  }

  async insertAuxData({id, event_id, data_source, data_array}) {

    await axios.post(`${API_ROOT_URL}/api/v1/event_aux_data`,
      {id, event_id, data_source, data_array},
      {
        headers: {
          Authorization: 'Bearer ' + cookies.get('token'),
          'content-type': 'application/json'
        }
      }).then((response) => {
        if(response.status === 201) {
          this.setState( prevState => (
            {
              imported: prevState.imported + 1,
              pending: prevState.pending - 1
            }
          ))
        } else {
          this.setState( prevState => (
            {
              updated: prevState.updated + 1,
              pending: prevState.pending - 1
            }
          ))
        }
      }).catch((error) => {
        console.error('Problem connecting to API');
        console.debug(error);
        this.setState( prevState => ({
            errors: prevState.errors + 1,
            pending: prevState.pending - 1
          })
        )
      })
  }

  importAuxDataFromFile = async (e) => {
    try {

      let json = JSON.parse(e.target.result);
      this.setState({
        pending: json.length,
        imported: 0,
        errors: 0,
        updated: 0
      })

      let currentAuxData;

      for(let i = 0; i < json.length; i++) {
        if (this.state.quit) {
          break;
        }
        currentAuxData = json[i];
        await this.insertAuxData(currentAuxData);
      }

    } catch (error) {
      console.debug('Error when trying to parse json = ' + error);
    }
    this.setState({pending: (this.state.quit)?"Quit Early!":"Complete"})
  }

  handleAuxDataRecordImport = files => {

    let reader = new FileReader();
    reader.onload = this.importAuxDataFromFile
    reader.readAsText(files[0]);
  }

  render() {

    const { show } = this.props

    return (
      <Modal show={show} onHide={this.handleHideCustom}>
        <Modal.Header closeButton>
          <Modal.Title>Import Auxiliary Data</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Row>
            <Col xs={6}>
              <ReactFileReader fileTypes={[".json"]} handleFiles={this.handleAuxDataRecordImport}>
                  <Button size="sm">Select File</Button>
              </ReactFileReader>
            </Col>
            <Col xs={6}>
              Pending: {this.state.pending}
              <hr/>
              Imported: {this.state.imported}<br/>
              Updated: {this.state.updated}<br/>
              Errors: {this.state.errors}<br/>
            </Col>
          </Row>
        </Modal.Body>

        <Modal.Footer>
          <Button size="sm" variant="secondary" onClick={this.handleHideCustom}>Close</Button>
        </Modal.Footer>
      </Modal>
    );
  }
}

export default connectModal({ name: 'importAuxData' })(ImportAuxDataModal)