import React, { Component } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { Button, Modal } from 'react-bootstrap';
import { connectModal } from 'redux-modal';
import Cookies from 'universal-cookie';
import { API_ROOT_URL } from '../client_config';

const cookies = new Cookies();

class DisplayUserTokenModal extends Component {

  constructor (props) {
    super(props);

    this.state = {
      token: null
    }

    this.handleConfirm = this.handleConfirm.bind(this);
  }

  static propTypes = {
    id: PropTypes.string,
    handleHide: PropTypes.func.isRequired
  };

  componentDidMount() {
    this.getUserJWT()
  }

  async getUserJWT() {
    const token = await axios.get(`${API_ROOT_URL}/api/v1/users/${this.props.id}/token`,
    {
      headers: {
        authorization: cookies.get('token'),
        'content-type': 'application/json'
      }
    })
    .then((response) => {
      return response.data.token;
    })
    .catch(() => {
      return "There was an error retriving the JWT for this user.";
    })

    this.setState( { token } )
  }

  handleConfirm() {
    this.props.handleHide();
  }

  render() {

    const { show, handleHide, id } = this.props

    if (id) {
      return (
        <Modal show={show} onHide={handleHide}>
          <Modal.Header closeButton>
            <Modal.Title>User&#39;s Java Web Token</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <h6>Token:</h6><div style={{wordWrap:'break-word'}}>{this.state.token}</div>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" onClick={handleHide}>Close</Button>
          </Modal.Footer>
        </Modal>
      );
    }
    else {
      return null;
    }
  }
}

export default connectModal({ name: 'displayUserToken' })(DisplayUserTokenModal)