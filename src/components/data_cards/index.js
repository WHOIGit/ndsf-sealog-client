import PropTypes from 'prop-types';
import React from 'react';
import { Card } from 'react-bootstrap';
import ImageryDataCard from './imagery_card';
import TabularDataCard from './tabular_card';


// Returns the component class that renders the given aux_data object given the
// the data_source.
function componentForDataSource(data_source) {
  if (data_source === "vehicleRealtimeFramegrabberData")
    return ImageryDataCard;
  else
    return TabularDataCard;
}


// Mostly we expect to deal with the aux_data object format, so if we want to
// display event options, it's easiest to generate a fake aux_data object
function makeFakeAuxDataForEventOptions(event) {
  return {
    data_source: "eventOptions",
    data_array: event.event_options.map((opt) => ({
      data_name:  opt.event_option_name,
      data_value: opt.event_option_value,
      data_uom:   "",
    }))
  };
}


// Generic component for rendering an aux_data object in a card. Most of the
// rendering is handled by a specialized component depending on the data_source.
export class DataCard extends React.Component {
  static propTypes = {
    event: PropTypes.object,
    data: PropTypes.object.isRequired,
    onImageClick: PropTypes.func,
  };

  render() {
    const Comp = componentForDataSource(this.props.data.data_source);
    return (
      <Card className="event-data-card">
        <Comp {...this.props} />
      </Card>
    );
  }
}


// Component for rendering all aux_data objects associated with an event
export class DataCardGrid extends React.Component {
  static propTypes = {
    event: PropTypes.object.isRequired,
  };

  render() {
    // This should not be needed, but we might passed an empty event object
    if (!this.props.event.aux_data)
      return null;

    const dataArray = this.props.event.aux_data
      .sort((a, b) => {
        if (a.data_source > b.data_source)
          return 1;
        else if (a.data_source < b.data_source)
          return -1;
        else
          return 0;
      });

    if (this.props.event.event_options.length > 0) {
      dataArray.push(makeFakeAuxDataForEventOptions(this.props.event));
    }

    const cards = dataArray.map((aux_data) =>
      <DataCard
        key={aux_data.data_source}
        {...this.props}
        data={aux_data}
      />
    );

    return cards;
  }
}
