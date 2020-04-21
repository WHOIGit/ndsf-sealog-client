import React, { Component } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { Button, Modal, Row, Col } from 'react-bootstrap';
import { connectModal } from 'redux-modal';
import ReactFileReader from 'react-file-reader';
import Cookies from 'universal-cookie';
import { API_ROOT_URL } from '../client_config';

const cookies = new Cookies();

class ImportUsersModal extends Component {

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

  async insertUser({id, username, fullname, email, password = '', roles, system_user = false}) {

    try {
      const result = await axios.get(`${API_ROOT_URL}/api/v1/users/${id}`,
      {
        headers: {
          authorization: cookies.get('token'),
          'content-type': 'application/json'
        }
      })

      if(result) {
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
          const result = await axios.post(`${API_ROOT_URL}/api/v1/users`,
          {id, username, fullname, email, password, roles, system_user},
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

  importUsersFromFile = async (e) => {
    try {

      // console.log("processing file")
      let json = JSON.parse(e.target.result);
      this.setState({
        pending: json.length,
        imported: 0,
        errors: 0,
        skipped: 0
      })

      // console.log("done")
      let currentUser;

      for(let i = 0; i < json.length; i++) {
        if(this.state.quit) {
          // console.log("quiting")
          break;
        }
        currentUser = json[i];
        // console.log("adding user")
        await this.insertUser(currentUser);
      }

    } catch (err) {
      console.log('error when trying to parse json = ' + err);
    }
    this.setState({pending: (this.state.quit)?"Quit Early!":"Complete"})
  }

  handleUserRecordImport = files => {

    let reader = new FileReader();
    reader.onload = this.importUsersFromFile
    reader.readAsText(files[0]);
  }

  render() {
    const { show, handleExit } = this.props

    if(handleExit) {
      return (
        <Modal show={show} onExit={handleExit} onHide={this.quitImport}>
          <Modal.Header closeButton>
            <Modal.Title>Import Users</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <Row>
              <Col xs={6}>
                <ReactFileReader fileTypes={[".json"]} handleFiles={this.handleUserRecordImport}>
                    <Button size="sm">Select File</Button>
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
            <Button size="sm" variant="secondary" size="sm" onClick={this.quitImport}>Close</Button>
          </Modal.Footer>
        </Modal>
      );
    }
    else {
      return null;
    }
  }
}

export default connectModal({ name: 'importUsers' })(ImportUsersModal)