import PropTypes from 'prop-types';
import React from 'react';
import { Modal, Image } from 'react-bootstrap';
import { handleMissingImage } from '../utils';


export default class ImagePreviewModal extends React.Component {
  static propTypes = {
    url: PropTypes.string,
  };

  constructor (props) {
    super(props);

    this.state = {
      show: false,
    };
  }

  handleClose = () => this.setState({ show: false });
  handleShow = () => this.setState({ show: true });

  render() {
    return (
      <Modal size="lg" show={this.state.show} onHide={this.handleClose}>
        <Modal.Header closeButton>
          <Modal.Title as="h5">
            Image Preview - {this.props.url.split('/').pop()}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className="text-center">
            <Image fluid src={this.props.url} onError={handleMissingImage} />
          </div>
        </Modal.Body>
      </Modal>
    );
  }
}
