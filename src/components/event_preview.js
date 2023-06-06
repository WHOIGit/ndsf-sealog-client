import PropTypes from 'prop-types';
import React from 'react';
import { Col, Row } from 'react-bootstrap';
import DataCard from './data_cards';

function degreesToRadians(degrees) {
  return degrees * (Math.PI/180);
}

function deltaLat(renav, realtime, lat_given) {

  const delta_degrees = renav - realtime;
  const lat_radians = degreesToRadians(lat_given);

  let lat_distance_at_lat = latDistanceAtLat(lat_radians);
  // let lat_distance_at_lat = metersDegLat(lat_radians);
  
  return lat_distance_at_lat * delta_degrees
}

function deltaLong(renav, realtime, lat_given) {

  const delta_degrees = renav - realtime;
  const lat_radians = degreesToRadians(lat_given);

  let long_distance_at_lat = longDistanceAtLat(lat_radians);
  // let long_distance_at_lat = metersDegLon(lat_radians);

  return long_distance_at_lat * delta_degrees;
}

function latDistanceAtLat(lat_radians) {
  return 111132.954 - (559.822 * Math.cos(2 * lat_radians)) + (1.175 * Math.cos(4*lat_radians));
}

function longDistanceAtLat(lat_radians) {

  const eq_radius = 6378137.0;
  const eccentricity = 0.081819190842613;

  const numerator = (eq_radius * Math.PI * Math.cos(lat_radians));
  const denominator = 180 * Math.sqrt(1 - Math.pow(eccentricity, 2) * Math.pow(Math.sin(lat_radians), 2));

  return numerator/denominator;
}

function metersDegLon(lat_given) {
  // from rov code
  return((111415.13 * Math.cos(degreesToRadians(lat_given)))
    - (94.55 * Math.cos(3.0*degreesToRadians(lat_given)))
    + (0.12 * Math.cos(5.0*degreesToRadians(lat_given))));
}

function metersDegLat(lat_given) {
  // from rov code
  return(111132.09 - (566.05 * Math.cos(2.0*degreesToRadians(lat_given)))
    + (1.20 * Math.cos(4.0*degreesToRadians(lat_given)))
    - (0.002 * Math.cos(6.0*degreesToRadians(lat_given))));
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

function makeFakeAuxDataForSulis(event) {

  const fakeSulisAuxData = {

    data_source : "vehicleRealtimeFramegrabberData",
    data_array: [
      {
        data_name: "camera_name",
        data_value: "Sulis Camera",
        data_uom: "",
      },
      {
        data_name: "filename",
        data_value: event.event_options[0].event_option_value,
        data_uom: "",
      }
    ]

  };

  return fakeSulisAuxData;

}


// Pull nav data from multiple data sources to create a more useful card.
function reorganizeNavData(event, dataArray) {
  // Locate the realtime and renav auxdata
  const realtimeIdx = dataArray.findIndex(
    (x) => x.data_source === "vehicleRealtimeNavData");
  const renavIdx = dataArray.findIndex(
    (x) => x.data_source === "vehicleReNavData");

  // If we don't have realtime data, something went wrong! This will fall back
  // to displaying the default tabular cards.
  if (realtimeIdx === -1)
    return;

  // Copy the object
  const realtime = dataArray[realtimeIdx];
  const renav = renavIdx > -1 ? dataArray[renavIdx] : undefined;

  // Delete the original from the array
  const toDelete = [realtimeIdx];
  if (renavIdx > -1) toDelete.push(renavIdx);
  toDelete.sort((a, b) => b - a);
  for (const idx of toDelete) {
    dataArray.splice(idx, 1);
  }

  // Start the new nav data out as a copy of the realtime data
  const navData = [...realtime.data_array];

  // Override realtime data with renav
  const hasRenav = (renavIdx > -1);
  const overridden = [];

  let delta = [];

  if (hasRenav) {

    // Grab latitude for oblate spheroid calculations
    const lat_degrees = navData.filter(datum =>datum.data_name === 'latitude')[0].data_value;

    for (const entry of renav.data_array) {
      // Remove an existing entry with the same data_name
      const idx = navData.findIndex((x) => x.data_name === entry.data_name);
      if (idx > -1) {
        overridden.push(navData[idx]);

        // Grab lat and long for delta data
        if (['latitude', 'longitude'].includes(entry.data_name)) {

          let renav = parseFloat(entry.data_value);
          let realtime = parseFloat(navData[idx].data_value);

          if (entry.data_name == 'latitude'){
            var delta_float = deltaLat(renav, realtime, lat_degrees);
          }
          else {
            var delta_float = deltaLong(renav, realtime, lat_degrees);
          }

          let delta_value = String(delta_float.toPrecision(8));
          let delta_name = entry.data_name;
          let delta_uom = "meters";

          delta.push({
            data_value: delta_value,
            data_name: delta_name,
            data_uom: delta_uom
          });

          navData.splice(idx, 1);

        }
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

  // If renav'd, push the original data and the delta
  if (hasRenav) {
    dataArray.push({
      data_source: "navigationDelta",
      data_array: delta
    });

    dataArray.push({
      data_source: "originalNavData",
      data_array: overridden,
    });
  }

} //reorganizeNavData()


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

      if (this.props.event.event_value == 'SulisCam'){
        dataArray.push(makeFakeAuxDataForSulis(this.props.event));
      }

      else{
        dataArray.push(makeFakeAuxDataForEventOptions(this.props.event));
      }
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
            <div className="px-1" style={{ ...cardStyle, height: "100%" }}>
              { this.props.event.event_free_text ? ` ${this.props.event.event_free_text}` : null }
              <span className="float-right">
                {this.props.event.event_author} @ {this.props.event.ts}
              </span>
            </div>
          </Col>
        </Row>

        <Row className="mx-n1 mt-2 mb-n2">
          {cards}
        </Row>
      </>
    );
  }
}
