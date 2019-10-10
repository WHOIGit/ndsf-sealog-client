import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Modal, Image } from 'react-bootstrap';
import { connectModal } from 'redux-modal';

class ImagePreviewModal extends Component {

  constructor (props) {
    super(props);

    this.handleClose = this.handleClose.bind(this);
  }

  handleMissingImage(ev) {
    ev.target.src = `/images/noimage.jpeg`
  }

  static propTypes = {
    name: PropTypes.string.isRequired,
    filepath: PropTypes.string.isRequired,
    handleHide: PropTypes.func.isRequired,
  };

  handleClose() {
    this.props.handleDestroy();
  }

  render() {

    const { show, handleHide } = this.props

    return (
      <Modal size="lg" show={show} onHide={handleHide}>
        <Modal.Header closeButton>
          <Modal.Title as="h5">Image Preview - {this.props.name}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className="text-center">
            <Image fluid src={this.props.filepath} onError={this.handleMissingImage} />
          </div>
        </Modal.Body>
      </Modal>
    );
  }
}

export default connectModal({ name: 'imagePreview' })(ImagePreviewModal)
