import React, { Component } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { Button, Modal, Row, Col } from 'react-bootstrap';
import { connectModal } from 'redux-modal';
import ReactFileReader from 'react-file-reader';
import Cookies from 'universal-cookie';
import { API_ROOT_URL } from '../client_config';
import { _Lowerings_ } from '../vocab';

const cookies = new Cookies();

class ImportLoweringsModal extends Component {

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

  async insertLowering({id, lowering_id, start_ts, stop_ts, lowering_location = '', lowering_tags = [], lowering_hidden = false, lowering_additional_meta = {} }) {

    try {
      const result = await axios.get(`${API_ROOT_URL}/api/v1/lowerings/${id}`,
      {
        headers: {
          authorization: cookies.get('token'),
          'content-type': 'application/json'
        }
      })
      if(result) {

        // console.log("User Already Exists");
        this.setState( prevState => (
          {
            skipped: prevState.skipped + 1,
            pending: prevState.pending - 1
          }
        ))
      }
    } catch(error) {

      if(error.response.data.statusCode === 404) {
        // console.log("Attempting to add user")

        try {

          const result = await axios.post(`${API_ROOT_URL}/api/v1/lowerings`,
          {id, lowering_id, start_ts, stop_ts, lowering_location, lowering_tags, lowering_hidden, lowering_additional_meta},
          {
            headers: {
              authorization: cookies.get('token'),
              'content-type': 'application/json'
            }
          })
          if(result) {
            // console.log("User Imported");
            this.setState( prevState => (
              {
                imported: prevState.imported + 1,
                pending: prevState.pending - 1
              }
            ))
          }
        } catch(error) {
          
          if(error.response.data.statusCode === 400) {
            // console.log("User Data malformed or incomplete");
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

  importLoweringsFromFile = async (e) => {
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

        let currentLowering;

        for(let i = 0; i < json.length; i++) {
          if(this.state.quit) {
            this.setState({pending: "Quitting"})
            break;
          }
          currentLowering = json[i];
          await this.insertLowering(currentLowering);
        }
      } else {
        this.setState({
          pending: 1,
          imported: 0,
          errors: 0,
          skipped: 0
        })
        await this.insertLowering(json);
      }
    } catch (err) {
      console.log('error when trying to parse json = ' + err);
    }
    this.setState({pending: (this.state.quit)?"Quit Early!":"Complete"})
  }

  handleLoweringRecordImport = files => {

    this.setState(
      {
        pending: "Calculating..."
      }
    )

    let reader = new FileReader();
    reader.onload = this.importLoweringsFromFile
    reader.readAsText(files[0]);
  }

  render() {

    const { show, handleExit } = this.props

    if (handleExit) {
      return (
        <Modal show={show} onExit={handleExit} onHide={this.quitImport}>
          <Modal.Header closeButton>
            <Modal.Title>Import {_Lowerings_}</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <Row>
              <Col xs={6}>
                <ReactFileReader fileTypes={[".json"]} handleFiles={this.handleLoweringRecordImport}>
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
            <Button size="sm" variant="secondary" onClick={this.quitImport}>Close</Button>
          </Modal.Footer>
        </Modal>
      );
    }
    else {
      return null;
    }  
  }
}

export default connectModal({ name: 'importLowerings' })(ImportLoweringsModal)