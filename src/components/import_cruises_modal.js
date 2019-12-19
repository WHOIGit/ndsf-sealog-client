import React, { Component } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { Button, Modal, Row, Col } from 'react-bootstrap';
import { connectModal } from 'redux-modal';
import ReactFileReader from 'react-file-reader';
import Cookies from 'universal-cookie';
import { API_ROOT_URL } from '../client_config';

const cookies = new Cookies();

class ImportCruisesModal extends Component {

  constructor (props) {
    super(props);

    this.state = {
      pending: 0,
      imported: 0,
      errors: 0,
      skipped: 0,
      quit: false,
    }

    this.quitImport = this.quitImport.bind(this);
  }

  static propTypes = {
    handleHide: PropTypes.func.isRequired,
    handleExit: PropTypes.func
  };

  quitImport() {
    this.setState({quit: true})
    this.props.handleExit()
    this.props.handleHide()
  }

  async insertCruise({ id, cruise_id, start_ts, stop_ts, cruise_location = '', cruise_pi, cruise_tags = [], cruise_hidden = false, cruise_vessel = '', cruise_additional_meta = {} }) {

    try {
      const result = await axios.get(`${API_ROOT_URL}/api/v1/cruises/${id}`,
      {
        headers: {
          authorization: cookies.get('token'),
          'content-type': 'application/json'
        }
      })

      if(result) {
        // console.log("Cruise Already Exists");
        this.setState( prevState => (
          {
            skipped: prevState.skipped + 1,
            pending: prevState.pending - 1
          }
        ))
      }
    } catch(error) {
      if(error.response.data.statusCode === 404) {
        // console.log("Attempting to add cruise")

        try {
          const result = await axios.post(`${API_ROOT_URL}/api/v1/cruises`,
          { id, cruise_id, start_ts, stop_ts, cruise_location, cruise_pi, cruise_tags, cruise_hidden, cruise_vessel, cruise_additional_meta},
          {
            headers: {
              authorization: cookies.get('token'),
              'content-type': 'application/json'
            }
          })

          if(result) {
            this.setState( prevState => (
              {
                imported: prevState.imported + 1,
                pending: prevState.pending - 1
              }
            ))
          }
        } catch(error) {
          
          if(error.response.data.statusCode === 400) {
            // console.log("Cruise Data malformed or incomplete");
          } else {
            console.log(error);  
          }
          
          this.setState( prevState => (
            {
              errors: prevState.errors + 1,
              pending: prevState.pending - 1
            }
          ))
        }
      } else {

        if(error.response.data.statusCode !== 400) {
          console.log(error.response);
        }
        this.setState( prevState => (
          {
            errors: prevState.errors + 1,
            pending: prevState.pending - 1
          }
        ))
      }
    }
  }

  importCruisesFromFile = async (e) => {
    try {

      // console.log("processing file")
      let json = JSON.parse(e.target.result);

      if(Array.isArray(json)) {
        this.setState({
          pending: json.length,
          imported: 0,
          errors: 0,
          skipped: 0
        })

        let currentCruise;

        for(let i = 0; i < json.length; i++) {
          if (this.state.quit) {
            console.log("quiting")
            break;
          }
          currentCruise = json[i];
          await this.insertCruise(currentCruise)
        }
      } else {
        this.setState({
          pending: 1,
          imported: 0,
          errors: 0,
          skipped: 0
        })

        const result = await this.insertCruise(json);
        if(result) {
          this.setState({pending: "Complete!"})
        }
      }
    } catch (err) {
      console.log('error when trying to parse json = ' + err);
    }
    this.setState({pending: (this.state.quit)?"Quit Early!":"Complete"})
  }

  handleCruiseRecordImport = files => {

    this.setState(
      {
        pending: "Calculating..."
      }
    )

    let reader = new FileReader();
    reader.onload = this.importCruisesFromFile
    reader.readAsText(files[0]);
  }

  render() {

    const { show, handleExit } = this.props
  
    if (handleExit) {  
      return (
        <Modal show={show} onExit={handleExit} onHide={this.quitImport}>
          <Modal.Header closeButton>
            <Modal.Title>Import Cruises</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <Row>
              <Col xs={6}>
                <ReactFileReader fileTypes={[".json"]} handleFiles={this.handleCruiseRecordImport}>
                    <Button size="sm">Select File</Button>
                </ReactFileReader>
              </Col>
              <Col xs={4}>
                Pending: {this.state.pending}
                <hr/>
                Imported: {this.state.imported}<br/>
                Skipped: {this.state.skipped}<br/>
                Errors: {this.state.errors}<br/>
              </Col>
            </Row>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" size="sm" onClick={this.quitImport}>Close</Button>
          </Modal.Footer>
        </Modal>
      );
    }
    else {
      return null;
    }
  }
}

export default connectModal({ name: 'importCruises' })(ImportCruisesModal)