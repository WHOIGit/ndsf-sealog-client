import React, { Component } from 'react';
import { compose } from 'redux';
import { connectModal } from 'redux-modal';
import PropTypes from 'prop-types';
import axios from 'axios';
import moment from 'moment';
import Cookies from 'universal-cookie';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Collapse, Form, ListGroup, Modal } from 'react-bootstrap';
import { API_ROOT_URL } from '../client_config';

const updateType = {
    ADD: true,
    REMOVE: false
}

const cookies = new Cookies();

class RenderTableRow extends Component {

  constructor (props) {
    super(props);

    this.state = {
      open: false
    }

    this.toggleRowCollapse = this.toggleRowCollapse.bind(this);
  }

  toggleRowCollapse() {
    this.setState((prevState) => {
      return {open: !prevState.open};
    })
  }

  render () {
    const { cruise, lowerings } = this.props

    return (
      <ListGroup.Item>
        <div className="clearfix">
          {cruise}
          <FontAwesomeIcon className="text-primary float-right" icon={(this.state.open) ? 'chevron-up' : 'chevron-down'} fixedWidth onClick={this.toggleRowCollapse}/>
        </div>
        <Collapse in={this.state.open}>
          {lowerings}
        </Collapse>
      </ListGroup.Item> 
    );
  }
}

class UserPermissionsModal extends Component {

  constructor (props) {
    super(props);

    this.state = {
      cruises: null,
      lowerings: null,
      Permissions: {}
    }

    this.fetchCruises = this.fetchCruises.bind(this);
    this.fetchLowerings = this.fetchLowerings.bind(this);
  }

  static propTypes = {
    user_id: PropTypes.string,
    handleHide: PropTypes.func.isRequired
  };

  componentDidMount() {
    this.fetchCruises();
    this.fetchLowerings();
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.user_id && this.state.cruises && this.state.lowerings && (prevState.cruises !== this.state.cruises || prevState.lowerings !== this.state.lowerings)) {
      let permissions = { cruises: [], lowerings: [] };

      permissions = this.state.cruises.reduce((cruise_permissions, cruise) => {
        if(cruise.cruise_access_list && cruise.cruise_access_list.includes(this.props.user_id)) {
          cruise_permissions.cruises.push(cruise.id);
        }

        return cruise_permissions;

      }, permissions);

      permissions = this.state.lowerings.reduce((lowering_permissions, lowering) => {
        if(lowering.lowering_access_list && lowering.lowering_access_list.includes(this.props.user_id)) {
          lowering_permissions.lowerings.push(lowering.id);
        }

        return lowering_permissions;

      }, permissions);

      this.setState({ permissions })
    }
  }

  componentWillUnmount() {
  }

  async updateCruisePermissions(cruise_id, user_id, type) {
    try {

      const payload = {};
      if (type === updateType.ADD) {
        payload.add = [user_id];
      }
      else if (type === updateType.REMOVE) {
        payload.remove = [user_id];
      }

      await axios.patch(`${API_ROOT_URL}/api/v1/cruises/${cruise_id}/permissions`,
      payload,
      {
        headers: {
          Authorization: 'Bearer ' + cookies.get('token'),
          'content-type': 'application/json'
        }
      }).then(async (response) => {
        await this.fetchCruises();
        await this.fetchLowerings();
        return response.data;
      }).catch((err) => {
        console.error(err);
        return null;
      });

    } catch(error) {
      console.log(error);
    }
  }

  async updateLoweringPermissions(lowering_id, user_id, type) {
    try {

      const payload = {};
      if (type === updateType.ADD) {
        payload.add = [user_id];
      }
      else if (type === updateType.REMOVE) {
        payload.remove = [user_id];
      }

      await axios.patch(`${API_ROOT_URL}/api/v1/lowerings/${lowering_id}/permissions`,
      payload,
      {
        headers: {
          Authorization: 'Bearer ' + cookies.get('token'),
          'content-type': 'application/json'
        }
      }).then(async (response) => {
        await this.fetchLowerings();
        return response.data;
      }).catch((err) => {
        console.error(err);
        return null;
      });

    } catch(error) {
      console.log(error);
    }
  }

  async fetchCruises() {
    try {

      const cruises = await axios.get(`${API_ROOT_URL}/api/v1/cruises`,
      {
        headers: {
          Authorization: 'Bearer ' + cookies.get('token'),
          'content-type': 'application/json'
        }
      }).then((response) => {
        return response.data;
      }).catch((err) => {
        console.error(err);
        return [];
      });

      this.setState({ cruises })

    } catch(error) {
      console.log(error);
    }
  }

  async fetchLowerings() {
    try {

      const lowerings = await axios.get(`${API_ROOT_URL}/api/v1/lowerings`,
      {
        headers: {
          Authorization: 'Bearer ' + cookies.get('token'),
          'content-type': 'application/json'
        }
      }).then((response) => {
        return response.data;
      }).catch((err) => {
        console.error(err);
        return [];
      });

      this.setState({ lowerings: lowerings.reverse() });

    } catch(error) {
      console.log(error);
    }
  }

  render() {

    const { show, user_id, handleHide } = this.props

    const body = ( this.props.user_id && this.state.cruises && this.state.lowerings) ?
      this.state.cruises.map((cruise) => {

        const cruiseCheckbox = <Form.Check 
          type="switch"
          id={`cruise_${cruise.id}`}
          label={`${cruise.cruise_id}${(cruise.cruise_additional_meta.cruise_name) ? ': ' + cruise.cruise_additional_meta.cruise_name : ''}`}
          checked={(cruise.cruise_access_list && cruise.cruise_access_list.includes(user_id))}
          onChange={ (e) => { this.updateCruisePermissions(cruise.id, user_id, e.target.checked) }}
        />

        let startOfCruise = new Date(cruise.start_ts);
        let endOfCruise = new Date(cruise.stop_ts);

        const cruiseLoweringsTemp = this.state.lowerings.filter(lowering => moment.utc(lowering.start_ts).isBetween(moment.utc(startOfCruise), moment.utc(endOfCruise)));
        const loweringCheckboxes = <ul> {
          cruiseLoweringsTemp.map((lowering) => { 
            return (<Form.Check
              type="switch"
              key={`lowering_${lowering.id}`}
              id={`lowering_${lowering.id}`}
              label={`${lowering.lowering_id}: ${(lowering.lowering_location) ? lowering.lowering_location + ' ' : ''}`}
              checked={(lowering.lowering_access_list && lowering.lowering_access_list.includes(user_id))}
              disabled={!(cruise.cruise_access_list && cruise.cruise_access_list.includes(user_id))}
              onChange={ (e) => { this.updateLoweringPermissions(lowering.id, user_id, e.target.checked) }}
            />);
          })
        } </ul>

        return <RenderTableRow key={cruise.id} cruise={cruiseCheckbox} lowerings={loweringCheckboxes}/>;
      }) :
      null;
      
    if (body) {
      return (
        <Modal show={show} onHide={handleHide}>
          <form>
            <Modal.Header closeButton>
              <Modal.Title>User Permissions</Modal.Title>
            </Modal.Header>
            { body }
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
  connectModal({ name: 'userPermissions' }),
)(UserPermissionsModal)
