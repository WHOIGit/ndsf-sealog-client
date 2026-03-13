import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, Modal } from 'react-bootstrap';
import { connectModal } from 'redux-modal';
import { _lowering_ } from '../vocab';

class DeleteLoweringModal extends Component {

  constructor (props) {
    super(props);

    this.state = { };

    this.handleConfirm = this.handleConfirm.bind(this);
  }

  static propTypes = {
    lowering: PropTypes.object,
    handleDelete: PropTypes.func,
    handleHide: PropTypes.func.isRequired
  };

  handleConfirm() {
    this.props.handleDelete(this.props.lowering.id);
    this.props.handleHide();
  }

  render() {
    const { show, handleHide } = this.props

    return (
      <Modal show={show} onHide={handleHide}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          Are you sure you want to delete this {_lowering_}?
        </Modal.Body>

        <Modal.Footer>
          <Button size="sm" variant="secondary" onClick={handleHide}>Cancel</Button>
          <Button size="sm" variant="danger" onClick={this.handleConfirm}>Yup!</Button>
        </Modal.Footer>
      </Modal>
    );
  }
}

export default connectModal({ name: 'deleteLowering' })(DeleteLoweringModal)