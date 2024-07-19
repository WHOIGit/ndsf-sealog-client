import React, { Component } from 'react'
import { compose } from 'redux'
import { connectModal } from 'redux-modal'
import PropTypes from 'prop-types'
import { Form, ListGroup, Modal } from 'react-bootstrap'
import { get_cruises, get_users, update_cruise_permissions } from '../api'
import { _Cruise_ } from '../vocab'

const updateType = {
  ADD: true,
  REMOVE: false
}

class CruisePermissionsModal extends Component {
  constructor(props) {
    super(props)

    this.state = {
      users: null,
      cruise: null,
      Permissions: {}
    }

    this.fetchCruise = this.fetchCruise.bind(this)
    this.fetchUsers = this.fetchUsers.bind(this)
    this.handleHide = this.handleHide.bind(this)
    this.updateCruisePermissions = this.updateCruisePermissions.bind(this)
  }

  componentDidMount() {
    this.fetchUsers()
    this.fetchCruise()
  }

  async fetchCruise() {
    const cruise = await get_cruises({}, this.props.cruise_id)
    this.setState({ cruise })
  }

  async fetchUsers() {
    const users = await get_users()
    this.setState({ users })
  }

  handleHide() {
    this.props.onClose()
    this.props.handleHide()
  }

  async updateCruisePermissions(user_id, type) {
    const payload = {}
    if (type === updateType.ADD) {
      payload.add = [user_id]
    } else if (type === updateType.REMOVE) {
      payload.remove = [user_id]
    }

    await update_cruise_permissions(payload, this.props.cruise_id, async () => await this.fetchCruise())
  }

  render() {
    const { show } = this.props

    const body =
      this.state.cruise && this.state.users
        ? this.state.users.map((user) => {
            return (
              <ListGroup.Item key={`user_${user.id}`}>
                <Form.Check
                  type='switch'
                  id={`user_${user.id}`}
                  label={`${user.fullname}`}
                  checked={this.state.cruise.cruise_access_list && this.state.cruise.cruise_access_list.includes(user.id)}
                  onChange={(e) => {
                    this.updateCruisePermissions(user.id, e.target.checked)
                  }}
                />
              </ListGroup.Item>
            )
          })
        : null

    return (
      <Modal show={show} onHide={this.handleHide}>
        <form>
          <Modal.Header closeButton>
            <Modal.Title>{_Cruise_} Permissions</Modal.Title>
          </Modal.Header>
          <ListGroup>{body}</ListGroup>
        </form>
      </Modal>
    )
  }
}

CruisePermissionsModal.propTypes = {
  cruise_id: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  handleHide: PropTypes.func.isRequired,
  show: PropTypes.bool.isRequired
}

export default compose(connectModal({ name: 'cruisePermissions' }))(CruisePermissionsModal)
