import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Button, Modal } from 'react-bootstrap'
import { connectModal } from 'redux-modal'
import { get_user_token } from '../api'

class DisplayUserTokenModal extends Component {
  constructor(props) {
    super(props)

    this.state = {
      token: null
    }

    this.handleConfirm = this.handleConfirm.bind(this)
  }

  componentDidMount() {
    this.getUserJWT()
  }

  async getUserJWT() {
    const token = await get_user_token(this.props.id)
    this.setState({ token })
  }

  handleConfirm() {
    this.props.handleHide()
  }

  render() {
    const { show, handleHide, id } = this.props

    if (id) {
      return (
        <Modal show={show} onHide={handleHide}>
          <Modal.Header className='bg-light' closeButton>
            <Modal.Title>User&#39;s Java Web Token</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <h6>Token:</h6>
            <div style={{ wordWrap: 'break-word' }}>{this.state.token}</div>
          </Modal.Body>

          <Modal.Footer>
            <Button variant='secondary' onClick={handleHide}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      )
    } else {
      return null
    }
  }
}

DisplayUserTokenModal.propTypes = {
  id: PropTypes.string,
  handleHide: PropTypes.func.isRequired,
  show: PropTypes.bool.isRequired
}

export default connectModal({ name: 'displayUserToken' })(DisplayUserTokenModal)
