import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Button, Modal } from 'react-bootstrap'
import { connectModal } from 'redux-modal'

class DeleteFileModal extends Component {
  constructor(props) {
    super(props)

    this.handleConfirm = this.handleConfirm.bind(this)
  }

  handleConfirm() {
    this.props.handleDelete(this.props.file)
    this.props.handleHide()
  }

  render() {
    const { show, handleHide, file } = this.props

    if (file) {
      return (
        <Modal show={show} onHide={handleHide}>
          <Modal.Header className='bg-light' closeButton>
            <Modal.Title>Confirm Deletion</Modal.Title>
          </Modal.Header>

          <Modal.Body>{'Are you sure you want to delete this file?'}</Modal.Body>

          <Modal.Footer>
            <Button size='sm' variant='secondary' onClick={handleHide}>
              Cancel
            </Button>
            <Button size='sm' variant='danger' onClick={this.handleConfirm}>
              Yup!
            </Button>
          </Modal.Footer>
        </Modal>
      )
    } else {
      return null
    }
  }
}

DeleteFileModal.propTypes = {
  file: PropTypes.string,
  handleDelete: PropTypes.func,
  handleHide: PropTypes.func.isRequired,
  show: PropTypes.bool.isRequired
}

export default connectModal({ name: 'deleteFile' })(DeleteFileModal)
