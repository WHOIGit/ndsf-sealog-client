import React, { Component } from 'react';
import { compose } from 'redux';
import { connectModal } from 'redux-modal';
import PropTypes from 'prop-types';
import axios from 'axios';
import Cookies from 'universal-cookie';
import { Form, ListGroup, Modal } from 'react-bootstrap';
import { API_ROOT_URL, CUSTOM_CRUISE_NAME } from '../client_config';

const updateType = {
    ADD: true,
    REMOVE: false
}

const cookies = new Cookies();

class CruisePermissionsModal extends Component {

  constructor (props) {
    super(props);

    this.state = {
      users: null,
      cruise: null,
      Permissions: {},
      cruise_name: (CUSTOM_CRUISE_NAME)? CUSTOM_CRUISE_NAME[0].charAt(0).toUpperCase() + CUSTOM_CRUISE_NAME[0].slice(1) : "Cruise"
    }

    this.fetchUsers = this.fetchUsers.bind(this);
  }

  static propTypes = {
    cruise_id: PropTypes.string,
    handleHide: PropTypes.func.isRequired
  };

  componentDidMount() {
    this.fetchUsers();
    this.fetchCruise();
  }

  componentWillUnmount() {
  }

  async updateCruisePermissions(user_id, type) {
    try {

      const payload = {};
      if (type === updateType.ADD) {
        payload.add = [user_id];
      }
      else if (type === updateType.REMOVE) {
        payload.remove = [user_id];
      }

      await axios.patch(`${API_ROOT_URL}/api/v1/cruises/${this.props.cruise_id}/permissions`,
      payload,
      {
        headers: {
          authorization: cookies.get('token'),
          'content-type': 'application/json'
        }
      }).then(async (response) => {
        await this.fetchCruise();
        return response.data;
      }).catch((err) => {
        console.error(err);
        return null;
      });

    } catch(error) {
      console.error(error);
    }
  }

  async fetchCruise() {
    try {

      const cruise = await axios.get(`${API_ROOT_URL}/api/v1/cruises/${this.props.cruise_id}`,
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

      this.setState({ cruise })

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

    const body = ( this.state.cruise && this.state.users) ?
      this.state.users.map((user) => {

        return (
          <ListGroup.Item key={`user_${user.id}`} >
            <Form.Check 
              type="switch"
              id={`user_${user.id}`}
              label={`${user.fullname}`}
              checked={(this.state.cruise.cruise_access_list && this.state.cruise.cruise_access_list.includes(user.id))}
              onChange={ (e) => { this.updateCruisePermissions(user.id, e.target.checked) }}
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
              <Modal.Title>{this.state.cruise_name} Permissions</Modal.Title>
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
  connectModal({ name: 'cruisePermissions' }),
)(CruisePermissionsModal)
