import React, { Component } from 'react';
import { compose } from 'redux';
import { connectModal } from 'redux-modal';
import PropTypes from 'prop-types';
import axios from 'axios';
import Cookies from 'universal-cookie';
import { Form, ListGroup, Modal } from 'react-bootstrap';
import { API_ROOT_URL } from 'client_config';
import { _Cruise_ } from '../vocab';

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
    };

    this.fetchUsers = this.fetchUsers.bind(this);
  }

  static propTypes = {
    cruise: PropTypes.object,
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

      await axios.patch(`${API_ROOT_URL}/api/v1/cruises/${this.props.cruise.id}/permissions`,
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

      const cruise = await axios.get(`${API_ROOT_URL}/api/v1/cruises/${this.props.cruise.id}`,
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

    const body = ( this.props.cruise && this.state.users) ?
      this.state.users.map((user) => {

        return (
          <ListGroup.Item key={`user_${user.id}`} >
            <Form.Check
              type="switch"
              id={`user_${user.id}`}
              label={`${user.fullname}`}
              checked={(this.props.cruise.cruise_access_list && this.props.cruise.cruise_access_list.includes(user.id))}
              onChange={ (e) => { this.updateCruisePermissions(user.id, e.target.checked) }}
            />
          </ListGroup.Item>
        )
      }) :
      null;

    return (
      <Modal show={show} onHide={handleHide}>
        <form>
          <Modal.Header closeButton>
            <Modal.Title>{_Cruise_} Permissions</Modal.Title>
          </Modal.Header>
            <ListGroup>
              { body }
            </ListGroup>
        </form>
      </Modal>
    );
  }
}

export default compose(
  connectModal({ name: 'cruisePermissions' }),
)(CruisePermissionsModal)
