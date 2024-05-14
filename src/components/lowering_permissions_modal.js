import React, { Component } from 'react'
import { compose } from 'redux'
import { connectModal } from 'redux-modal'
import PropTypes from 'prop-types'
import { Form, ListGroup, Modal } from 'react-bootstrap'
import { get_lowerings, get_users, update_lowering_permissions } from '../api'
import { _Lowering_ } from '../vocab'

const updateType = {
  ADD: true,
  REMOVE: false
}

class LoweringPermissionsModal extends Component {
  constructor(props) {
    super(props)

    this.state = {
      users: null,
      lowering: null,
      Permissions: {}
    }

    this.fetchLowering = this.fetchLowering.bind(this)
    this.fetchUsers = this.fetchUsers.bind(this)
    this.handleHide = this.handleHide.bind(this)
    this.updateLoweringPermissions = this.updateLoweringPermissions.bind(this)
  }

  componentDidMount() {
    this.fetchUsers()
    this.fetchLowering()
  }

  handleHide() {
    this.props.onClose()
    this.props.handleHide()
  }

  async updateLoweringPermissions(user_id, type) {
    const payload = {}
    if (type === updateType.ADD) {
      payload.add = [user_id]
    } else if (type === updateType.REMOVE) {
      payload.remove = [user_id]
    }

    await update_lowering_permissions(payload, this.props.lowering_id, async () => await this.fetchLowering())
  }

  async fetchLowering() {
    const lowering = await get_lowerings({}, this.props.lowering_id)
    this.setState({ lowering })
  }

  async fetchUsers() {
    const users = await get_users()
    this.setState({ users })
  }

  render() {
    const { show, handleHide } = this.props

    const body =
      this.state.lowering && this.state.users
        ? this.state.users.map((user) => {
            return (
              <ListGroup.Item key={`user_${user.id}`}>
                <Form.Check
                  type='switch'
                  id={`user_${user.id}`}
                  label={`${user.fullname}`}
                  checked={this.state.lowering.lowering_access_list && this.state.lowering.lowering_access_list.includes(user.id)}
                  onChange={(e) => {
                    this.updateLoweringPermissions(user.id, e.target.checked)
                  }}
                />
              </ListGroup.Item>
            )
          })
        : null

    if (body) {
      return (
        <Modal show={show} onHide={handleHide}>
          <form>
            <Modal.Header closeButton>
              <Modal.Title>{_Lowering_} Permissions</Modal.Title>
            </Modal.Header>
            <ListGroup>{body}</ListGroup>
          </form>
        </Modal>
      )
    } else {
      return null
    }
  }
}

LoweringPermissionsModal.propTypes = {
  lowering_id: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  handleHide: PropTypes.func.isRequired,
  show: PropTypes.bool.isRequired
}

export default compose(connectModal({ name: 'loweringPermissions' }))(LoweringPermissionsModal)
