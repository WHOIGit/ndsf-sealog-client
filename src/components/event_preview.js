import PropTypes from 'prop-types';
import React from 'react';
import { Col, Row } from 'react-bootstrap';
import DataCard from './data_cards';


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


// Pull nav data from multiple data sources to create a more useful card.
function reorganizeNavData(event, dataArray) {
  // Locate the various nav data cards
  const renavIdx = dataArray.findIndex(
    (x) => x.data_source === "vehicleReNavData");
  const localIdx = dataArray.findIndex(
    (x) => x.data_source === "vehicleRealtimeLocalCoordData");
  const realtimeIdx = dataArray.findIndex(
    (x) => x.data_source === "vehicleRealtimeNavData");

  // If we don't have realtime and local nav data, something went wrong.
  // TODO: Handle this case if it comes up in real life.
  if (localIdx === -1 || realtimeIdx === -1)
    return;

  // Copy the object
  const renav = renavIdx > -1 ? dataArray[renavIdx] : undefined;
  const local = localIdx > -1 ? dataArray[localIdx] : undefined;
  const realtime = realtimeIdx > -1 ? dataArray[realtimeIdx] : undefined;

  // Delete the original from the array
  const toDelete = [];
  if (renavIdx > -1) toDelete.push(renavIdx);
  if (localIdx > -1) toDelete.push(localIdx);
  if (realtimeIdx > -1) toDelete.push(realtimeIdx);
  toDelete.sort((a, b) => b - a);
  for (const idx of toDelete) {
    dataArray.splice(idx, 1);
  }

  // Start the new nav data out as a copy of the realtime data
  const navData = [...realtime.data_array];

  // Override realtime data with renav
  const hasRenav = (renavIdx > -1);
  const overridden = [];

  if (hasRenav) {
    for (const entry of renav.data_array) {
      // Remove an existing entry with the same data_name
      const idx = navData.findIndex((x) => x.data_name === entry.data_name);
      if (idx > -1) {
        overridden.push(navData[idx]);
        navData.splice(idx, 1);
      }

      // Append the new value
      navData.push(entry);
    }
  }

    // Attach the event timestamp
    navData.push({
      data_name:  "time",
      data_value: event.ts,
      data_uom:   "",
    });

  // Attach the nav source
  navData.push({
    data_name:  "nav_source",
    data_value: hasRenav ? "renav" : "realtime",
    data_uom:   "",
  });

  // Add the merged data as a new aux_data record
  dataArray.push({
    data_source: "navData",
    data_array: navData,
  });

  // If renav'd, push the original data
  if (hasRenav) {
    dataArray.push({
      data_source: "originalNavData",
      data_array: overridden,
    });
  }
}


export default class EventPreview extends React.Component {
  static propTypes = {
    event: PropTypes.object.isRequired,
  };

  render() {
    // This should not be needed, but we might be passed an empty event object
    if (!this.props.event.aux_data)
      return null;

    const dataArray = [ ...this.props.event.aux_data ]
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

    // Reorganize nav data according to desired display grouping
    reorganizeNavData(this.props.event, dataArray);

    const cards = dataArray.map((aux_data) =>
      <DataCard
        key={aux_data.data_source}
        {...this.props}
        data={aux_data}
      />
    );

    const cardStyle = {
      backgroundColor: "#282828",
      border: "1px solid #555",
      borderRadius: "0.25rem",
    };

    const eventOptionsRows = this.props.event.event_options.map((opt) => {
      return (
        <tr>
          <th>{opt.event_option_name}</th>
          <td>{opt.event_option_value}</td>
        </tr>
      );
    });

    // Prepend the free text if it exists
    if (this.props.event.event_free_text) {
      eventOptionsRows.splice(0, 0, (
        <tr>
          <th>Free Text</th>
          <td>{this.props.event.event_free_text}</td>
        </tr>
      ));
    }

    // The margins and padding in this are particularly fussy to get the spacing
    // between every element correct. Careful!

    return (
      <>
        <Row className="mx-n1">
          <Col className="px-1" xs="auto">
            <div className="px-2" style={{...cardStyle, backgroundColor: "#555", color: "white" }}>
              {this.props.event.event_value}
            </div>
          </Col>
          <Col className="px-1">
            <div style={cardStyle}>X</div>
            { /*
            <Row>
              <Col>
                <div style={{textOverflow: "ellipsis"}}>
                  { this.props.event.event_free_text ? ` ${this.props.event.event_free_text}` : null }
                </div>
              </Col>
              <Col xs="auto">
                {this.props.event.event_author} @ {this.props.event.ts}
              </Col>
            </Row>
            */ }
          </Col>
        </Row>

        <Row className="mx-n1 mt-2 mb-n2">
          {cards}
        </Row>
      </>
    );
  }
}
