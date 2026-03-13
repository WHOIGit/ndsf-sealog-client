import PropTypes from 'prop-types';
import React from 'react';
import { Col } from 'react-bootstrap';
import ImageryDataCard from './imagery_card';
import NavDataCard from './nav_card';
import TabularDataCard from './tabular_card';


// Returns the component class that renders the given aux_data object given the
// the data_source.
function componentForDataSource(data_source) {
  const data_source_map = {
    "vehicleRealtimeFramegrabberData":  ImageryDataCard,
    "navData":  NavDataCard,
    "originalNavData":  TabularDataCard,
  }

  return data_source_map[data_source] || TabularDataCard;
}


// Generic component for rendering an aux_data object in a card. Most of the
// rendering is handled by a specialized component depending on the data_source.
export default class DataCard extends React.Component {
  static propTypes = {
    event: PropTypes.object,
    data: PropTypes.object.isRequired,
  };

  render = () => {
    const Comp = componentForDataSource(this.props.data.data_source);

    // Components are able to customize their display size by declaring a
    // *static* property of column sizes.
    const sizeProps = Comp.hasOwnProperty("sizeProps") ? Comp.sizeProps : {};

    return (
      <Col {...sizeProps} className="px-1 mb-2">
        {/*
          The use of px-1 above cancels out mx-n2 in event_preview.js, which
          sets the correct inter-column (gutter) spacing. The spacing is very
          sensitive, be careful.
        */}
        <Comp {...this.props} />
      </Col>
    );
  };
}
