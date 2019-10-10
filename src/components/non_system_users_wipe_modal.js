import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, Modal } from 'react-bootstrap';
import { connectModal } from 'redux-modal';

class NonSystemUsersWipeModal extends Component {

  constructor (props) {
    super(props);

    this.handleConfirm = this.handleConfirm.bind(this);
  }

  static propTypes = {
    handleDelete: PropTypes.func.isRequired,
    handleHide: PropTypes.func.isRequired
  };

  handleConfirm() {
    this.props.handleDelete();
    this.props.handleDestroy();
  }

  render() {

    const { show, handleHide } = this.props

    return (
      <Modal show={show} onHide={handleHide}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Wipe</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          { 'Are you sure you want to wipe the non-system users from the local database?' }
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={handleHide}>Cancel</Button>
          <Button variant="danger" onClick={this.handleConfirm}>Yup!</Button>
        </Modal.Footer>
      </Modal>
    );
  }
}

export default connectModal({ name: 'nonSystemUsersWipe' })(NonSystemUsersWipeModal)
