import PropTypes from 'prop-types';
import React from 'react';
import { Card, Col, Container, Image, Row } from 'react-bootstrap';
import { handleMissingImage, getImageUrl } from '../../utils';
import ImagePreviewModal from '../image_preview_modal';
import { STALE_FRAME_THRESHOLD } from 'client_config';

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

  renderImage = (source, url, frame_age) => {
    const isStale = frame_age > (STALE_FRAME_THRESHOLD || 5);
    
    return (
      <Card className="event-image-data-card" id={`image_${source}`}>
        <div className={isStale ? "stale-image-container" : ""}>
          <Image 
            rounded 
            fluid 
            onError={handleMissingImage} 
            src={url} 
            onClick={() => this.handleExpandPreview(url)} 
          />
          {isStale && (
            <div className="stale-image-indicator">
              Last update {frame_age.toFixed(1)}s prior
            </div>
          )}
        </div>
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
        url: getImageUrl(this.props.data.data_array[i+1].data_value),
        frame_age: this.props.data.data_array[i+1].data_age || 0
      });
    }

    const cols = cameras.map((camera) => {
      return (
        <Col className="px-1 mb-1" style={{ textAlign: "center" }} key={camera.source} xs={12} sm={6} md={4} lg={3}>
          {this.renderImage(camera.source, camera.url, camera.frame_age)}
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
