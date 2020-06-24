import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, Modal } from 'react-bootstrap';
import { connectModal } from 'redux-modal';

class NonSystemEventTemplatesWipeModal extends Component {

  constructor (props) {
    super(props);

    this.handleConfirm = this.handleConfirm.bind(this);
  }

  static propTypes = {
    handleDelete: PropTypes.func,
    handleHide: PropTypes.func.isRequired
  };

  handleConfirm() {
    this.props.handleDelete();
    this.props.handleHide();
  }

  render() {

    const { show, handleHide, handleDelete } = this.props
    if( handleDelete ) {
      return (
        <Modal show={show} onHide={handleHide}>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Wipe</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            { 'Are you sure you want to remove the non-system event templates from the local database?' }
          </Modal.Body>

          <Modal.Footer>
            <Button size="sm" variant="secondary" onClick={handleHide}>Cancel</Button>
            <Button size="sm" variant="danger" onClick={this.handleConfirm}>Yup!</Button>
          </Modal.Footer>
        </Modal>
      );
    }
    else {
      return null;
    }
  }
}

export default connectModal({ name: 'nonSystemEventTemplatesWipe' })(NonSystemEventTemplatesWipeModal)
