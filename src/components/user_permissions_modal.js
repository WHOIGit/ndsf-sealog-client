import React, { Component } from 'react'
import { compose } from 'redux'
import { connectModal } from 'redux-modal'
import PropTypes from 'prop-types'
import moment from 'moment'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Collapse, Form, ListGroup, Modal } from 'react-bootstrap'
import { get_cruises, get_lowerings, update_cruise_permissions, update_lowering_permissions } from '../api'

const updateType = {
  ADD: true,
  REMOVE: false
}

class RenderTableRow extends Component {
  constructor(props) {
    super(props)

    this.state = {
      open: false
    }

    this.toggleRowCollapse = this.toggleRowCollapse.bind(this)
  }

  toggleRowCollapse() {
    this.setState((prevState) => {
      return { open: !prevState.open }
    })
  }

  render() {
    const { cruise, lowerings } = this.props

    return (
      <ListGroup.Item>
        <div className='clearfix'>
          {cruise}
          <FontAwesomeIcon
            className='text-primary float-right'
            icon={this.state.open ? 'chevron-up' : 'chevron-down'}
            fixedWidth
            onClick={this.toggleRowCollapse}
          />
        </div>
        <Collapse in={this.state.open}>{lowerings}</Collapse>
      </ListGroup.Item>
    )
  }
}

RenderTableRow.propTypes = {
  cruise: PropTypes.object.isRequired,
  lowerings: PropTypes.object.isRequired
}

class UserPermissionsModal extends Component {
  constructor(props) {
    super(props)

    this.state = {
      cruises: [],
      lowerings: [],
      permissions: { cruises: [], lowerings: [] }
    }

    this.updateCruisePermissions = this.updateCruisePermissions.bind(this)
    this.updateLoweringPermissions = this.updateLoweringPermissions.bind(this)
    this.fetchCruises = this.fetchCruises.bind(this)
    this.fetchLowerings = this.fetchLowerings.bind(this)
  }

  componentDidMount() {
    this.fetchCruises()
    this.fetchLowerings()
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.user_id && (prevState.cruises !== this.state.cruises || prevState.lowerings !== this.state.lowerings)) {
      let permissions = { cruises: [], lowerings: [] }

      permissions = this.state.cruises.reduce((cruise_permissions, cruise) => {
        if (cruise.cruise_access_list && cruise.cruise_access_list.includes(this.props.user_id)) {
          cruise_permissions.cruises.push(cruise.id)
        }

        return cruise_permissions
      }, permissions)

      permissions = this.state.lowerings.reduce((lowering_permissions, lowering) => {
        if (lowering.lowering_access_list && lowering.lowering_access_list.includes(this.props.user_id)) {
          lowering_permissions.lowerings.push(lowering.id)
        }

        return lowering_permissions
      }, permissions)

      this.setState({ permissions })
    }
  }

  async updateCruisePermissions(cruise_id, user_id, type) {
    const payload = {}
    if (type === updateType.ADD) {
      payload.add = [user_id]
    } else if (type === updateType.REMOVE) {
      payload.remove = [user_id]
    }

    const callback = async () => {
      await this.fetchCruises()
      await this.fetchLowerings()
    }

    await update_cruise_permissions(payload, cruise_id, async () => await callback())
  }

  async updateLoweringPermissions(lowering_id, user_id, type) {
    const payload = {}
    if (type === updateType.ADD) {
      payload.add = [user_id]
    } else if (type === updateType.REMOVE) {
      payload.remove = [user_id]
    }

    await update_lowering_permissions(payload, lowering_id, async () => await this.fetchLowerings())
  }

  async fetchCruises() {
    const cruises = await get_cruises()
    this.setState({ cruises })
  }

  async fetchLowerings() {
    const lowerings = await get_lowerings()
    this.setState({ lowerings })
  }

  render() {
    const { show, user_id, handleHide } = this.props

    const body =
      this.props.user_id && this.state.cruises && this.state.lowerings
        ? this.state.cruises.map((cruise) => {
            const cruiseCheckbox = (
              <Form.Check
                type='switch'
                id={`cruise_${cruise.id}`}
                label={`${cruise.cruise_id}${cruise.cruise_additional_meta.cruise_name ? ': ' + cruise.cruise_additional_meta.cruise_name : ''}`}
                checked={this.state.permissions.cruises.includes(cruise.id)}
                onChange={(e) => {
                  this.updateCruisePermissions(cruise.id, user_id, e.target.checked)
                }}
              />
            )

            let startOfCruise = new Date(cruise.start_ts)
            let endOfCruise = new Date(cruise.stop_ts)

            const cruiseLoweringsTemp = this.state.lowerings.filter((lowering) =>
              moment.utc(lowering.start_ts).isBetween(moment.utc(startOfCruise), moment.utc(endOfCruise))
            )
            const loweringCheckboxes = (
              <ul>
                {' '}
                {cruiseLoweringsTemp.map((lowering) => {
                  return (
                    <Form.Check
                      type='switch'
                      key={`lowering_${lowering.id}`}
                      id={`lowering_${lowering.id}`}
                      label={`${lowering.lowering_id}: ${lowering.lowering_location ? lowering.lowering_location + ' ' : ''}`}
                      checked={this.state.permissions.lowerings.includes(lowering.id)}
                      disabled={!this.state.permissions.cruises.includes(cruise.id)}
                      onChange={(e) => {
                        this.updateLoweringPermissions(lowering.id, user_id, e.target.checked)
                      }}
                    />
                  )
                })}{' '}
              </ul>
            )

            return <RenderTableRow key={cruise.id} cruise={cruiseCheckbox} lowerings={loweringCheckboxes} />
          })
        : null

    if (body) {
      return (
        <Modal show={show} onHide={handleHide}>
          <form>
            <Modal.Header closeButton>
              <Modal.Title>User Permissions</Modal.Title>
            </Modal.Header>
            {body}
          </form>
        </Modal>
      )
    } else {
      return null
    }
  }
}

UserPermissionsModal.propTypes = {
  handleHide: PropTypes.func.isRequired,
  show: PropTypes.bool.isRequired,
  user_id: PropTypes.string.isRequired
}

export default compose(connectModal({ name: 'userPermissions' }))(UserPermissionsModal)
