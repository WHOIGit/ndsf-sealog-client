import PropTypes from 'prop-types';
import React from 'react';
import { Card, Col, Container, Image, Row } from 'react-bootstrap';
import { handleMissingImage, getImageUrl } from '../../utils';
import ImagePreviewModal from '../image_preview_modal';

export default class ImageryDataCard extends React.Component {
  static propTypes = {
    data: PropTypes.object.isRequired,
  };

  static sizeProps = {
    xs: 12,
  };

  constructor(props) {
    super(props);

    this.state = {
      clickedImage: null,
    };

    this.modal = React.createRef();
  }

  handleExpandPreview = (url) => {
    this.setState({ clickedImage: url });
    this.modal.current.handleShow();
  };

  renderImage = (source, url) => {
    return (
      <Card className="event-image-data-card" id={`image_${source}`}>
        <Image rounded fluid onError={handleMissingImage} src={url} onClick={() => this.handleExpandPreview(url)} />
        <span>{source}</span>
      </Card>
    );
  };

  render = () => {
    // The data_array is laid out as [source, path, source, path, ...]
    let cameras = [];
    for (let i = 0; i < this.props.data.data_array.length; i += 2) {
      cameras.push({
        source: this.props.data.data_array[i].data_value,
        url: getImageUrl(this.props.data.data_array[i+1].data_value)
      });
    }

    const cols = cameras.map((camera) => {
      return (
        <Col className="px-1 mb-2" key={camera.source} xs={12} sm={6} md={4} lg={3}>
          {this.renderImage(camera.source, camera.url)}
        </Col>
      );
    });

    return (
      <>
        <ImagePreviewModal ref={this.modal} url={this.state.clickedImage} />
        <Card className="event-data-card">
          <Card.Body>
            <Container>
              <Row>
                {cols}
              </Row>
            </Container>
          </Card.Body>
        </Card>
      </>
    );
  };
}
