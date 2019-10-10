import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, Modal } from 'react-bootstrap';
import { connectModal } from 'redux-modal';

class DeleteExportModal extends Component {

  constructor (props) {
    super(props);

    this.handleConfirm = this.handleConfirm.bind(this);
  }

  static propTypes = {
    id: PropTypes.string.isRequired,
    handleDelete: PropTypes.func.isRequired,
    handleHide: PropTypes.func.isRequired
  };

  handleConfirm() {
    this.props.handleDelete(this.props.id);
    this.props.handleDestroy();
  }

  render() {

    const { show, handleHide } = this.props

    return (
      <Modal size="lg" show={show} onHide={handleHide}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          { 'Are you sure you want to delete this event export?' }
        </Modal.Body>

        <Modal.Footer>
          <Button onClick={handleHide}>Cancel</Button>
          <Button variant="danger" onClick={this.handleConfirm}>Yup!</Button>
        </Modal.Footer>
      </Modal>
    );
  }
}

export default connectModal({ name: 'deleteExport' })(DeleteExportModal)