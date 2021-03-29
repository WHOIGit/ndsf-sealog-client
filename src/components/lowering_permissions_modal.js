import React, { Component } from 'react';
import { compose } from 'redux';
import { connectModal } from 'redux-modal';
import PropTypes from 'prop-types';
import axios from 'axios';
import Cookies from 'universal-cookie';
import { Form, ListGroup, Modal } from 'react-bootstrap';
import { API_ROOT_URL, CUSTOM_LOWERING_NAME } from '../client_config';

const updateType = {
    ADD: true,
    REMOVE: false
}

const cookies = new Cookies();

class LoweringPermissionsModal extends Component {

  constructor (props) {
    super(props);

    this.state = {
      users: null,
      lowering: null,
      Permissions: {},
      lowering_name: (CUSTOM_LOWERING_NAME)? CUSTOM_LOWERING_NAME[1].charAt(0).toUpperCase() + CUSTOM_LOWERING_NAME[1].slice(1) : "Lowering"
    }

    this.fetchUsers = this.fetchUsers.bind(this);
  }

  static propTypes = {
    lowering_id: PropTypes.string,
    handleHide: PropTypes.func.isRequired
  };

  componentDidMount() {
    this.fetchUsers();
    this.fetchLowering();
  }

  componentWillUnmount() {
  }

  async updateLoweringPermissions(user_id, type) {
    try {

      const payload = {};
      if (type === updateType.ADD) {
        payload.add = [user_id];
      }
      else if (type === updateType.REMOVE) {
        payload.remove = [user_id];
      }

      await axios.patch(`${API_ROOT_URL}/api/v1/lowerings/${this.props.lowering_id}/permissions`,
      payload,
      {
        headers: {
          authorization: cookies.get('token'),
          'content-type': 'application/json'
        }
      }).then(async (response) => {
        await this.fetchLowering();
        return response.data;
      }).catch((err) => {
        console.error(err);
        return null;
      });

    } catch(error) {
      console.error(error);
    }
  }

  async fetchLowering() {
    try {

      const lowering = await axios.get(`${API_ROOT_URL}/api/v1/lowerings/${this.props.lowering_id}`,
      {
        headers: {
          authorization: cookies.get('token'),
          'content-type': 'application/json'
        }
      }).then((response) => {
        return response.data;
      }).catch((err) => {
        console.error(err);
        return null;
      });

      this.setState({ lowering })

    } catch(error) {
      console.error(error);
    }
  }

  async fetchUsers() {
    try {

      const users = await axios.get(`${API_ROOT_URL}/api/v1/users`,
      {
        headers: {
          authorization: cookies.get('token'),
          'content-type': 'application/json'
        }
      }).then((response) => {
        return response.data;
      }).catch((err) => {
        console.error(err);
        return [];
      });

      this.setState({ users })

    } catch(error) {
      console.error(error);
    }
  }

  render() {

    const { show, handleHide } = this.props

    const body = ( this.state.lowering && this.state.users) ?
      this.state.users.map((user) => {

        return (
          <ListGroup.Item key={`user_${user.id}`} >
            <Form.Check 
              type="switch"
              id={`user_${user.id}`}
              label={`${user.fullname}`}
              checked={(this.state.lowering.lowering_access_list && this.state.lowering.lowering_access_list.includes(user.id))}
              onChange={ (e) => { this.updateLoweringPermissions(user.id, e.target.checked) }}
            />
          </ListGroup.Item>
        )
      }) :
      null;
      
    if (body) {
      return (
        <Modal show={show} onHide={handleHide}>
          <form>
            <Modal.Header closeButton>
              <Modal.Title>{this.state.lowering_name} Permissions</Modal.Title>
            </Modal.Header>
              <ListGroup>
                { body }
              </ListGroup>
          </form>
        </Modal>
      );
    }
    else {
      return null;
    }
  }
}

export default compose(
  connectModal({ name: 'loweringPermissions' }),
)(LoweringPermissionsModal)
