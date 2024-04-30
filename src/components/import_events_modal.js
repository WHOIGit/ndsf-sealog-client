import React, { Component } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { Button, Modal, Row, Col } from 'react-bootstrap';
import { connectModal } from 'redux-modal';
import ReactFileReader from 'react-file-reader';
import Cookies from 'universal-cookie';
import { API_ROOT_URL } from '../client_config';

const cookies = new Cookies();

class ImportEventsModal extends Component {

  constructor (props) {
    super(props);

    this.state = {
      pending: 0,
      imported: 0,
      errors: 0,
      skipped: 0,
      quit: false,
    }

    this.handleHideCustom = this.handleHideCustom.bind(this);
  }

  static propTypes = {
    handleHide: PropTypes.func.isRequired
  };

  handleHideCustom() {
    this.setState({quit: true})
    this.props.handleHide()
  }

  // importEventsFromFile = async (e) => {
  // async insertEvent({id, ts, event_author, event_value, event_free_text = '', event_options = []}) {

  async insertEvent({id, ts, event_author, event_value, event_free_text = '', event_options = []}) {

    const eventExists = await axios.get(`${API_ROOT_URL}/api/v1/events/${id}`,
    {
      headers: {
        Authorization: 'Bearer ' + cookies.get('token'),
        'content-type': 'application/json'
      }
    }).then(() => {
      this.setState( prevState => (
        {
          skipped: prevState.skipped + 1,
          pending: prevState.pending - 1
        }
      ))
      return true
    }).catch((error) => {
      return false
    })

    if(!eventExists) {
      await axios.post(`${API_ROOT_URL}/api/v1/events`,
        { id, ts, event_author, event_value, event_free_text, event_options },
        {
          headers: {
            Authorization: 'Bearer ' + cookies.get('token'),
            'content-type': 'application/json'
          }
        }).then((response) => {
          this.setState( prevState => (
            {
              imported: prevState.imported + 1,
              pending: prevState.pending - 1
            }
          ))
        }).catch((error) => {
          if(error.response.data.statusCode !== 400) {
            console.error('Problem connecting to API');
            console.debug(error);
          }
          this.setState( prevState => (
            {
              errors: prevState.errors + 1,
              pending: prevState.pending - 1
            }
          ))
        });
    }
  }

  importEventsFromFile = async (e) => {
    try {

      let json = JSON.parse(e.target.result);
      this.setState({
        pending: json.length,
        imported: 0,
        errors: 0,
        skipped: 0
      })

      let currentEvent;

      for(let i = 0; i < json.length; i++) {
        if(this.state.quit) {
          this.setState({pending: "Quitting"})
          break;
        }
        currentEvent = json[i];
        await this.insertEvent(currentEvent);
      }

    } catch (error) {
      console.error('Error when trying to parse json = ' + error);
    }
    this.setState({pending: (this.state.quit)?"Quit Early!":"Complete!"})
  }

  handleEventRecordImport = files => {

    let reader = new FileReader();
    reader.onload = this.importEventsFromFile
    reader.readAsText(files[0]);
  }

  render() {

    const { show } = this.props

    return (
      <Modal show={show} onHide={this.handleHideCustom}>
        <Modal.Header closeButton>
          <Modal.Title>Import Events</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Row>
            <Col xs={6}>
              <ReactFileReader fileTypes={[".json"]} handleFiles={this.handleEventRecordImport}>
                <Button size="sm" >Select File</Button>
              </ReactFileReader>
            </Col>
            <Col xs={3}>
              Pending: {this.state.pending}
              <hr/>
              Imported: {this.state.imported}<br/>
              Skipped: {this.state.skipped}<br/>
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

export default connectModal({ name: 'importEvents' })(ImportEventsModal)