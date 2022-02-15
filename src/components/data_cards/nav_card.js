import PropTypes from 'prop-types';
import React from 'react';
import { Card } from 'react-bootstrap';



// Inserts spaces into snake_case and CamelCase
function prettyPrint(text) {
  return text
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ');
}


export default class NavDataCard extends React.Component {
  static propTypes = {
    data: PropTypes.object.isRequired,
  };

  static sizeProps = {
    xs: 12,
    md: 6
  };

  static shouldSkipCard = (event, data) => {
    // We only want to render for the vehicleRealtimeNavData data source.
    return (data.data_source !== "vehicleRealtimeNavData");
  };

  render = () => {
    const data_rows = this.props.data.data_array.map((data, i) => {
      return (
        <tr key={i}>
          <td className="data-name">{prettyPrint(data.data_name)}:</td>
          <td style={{textAlign: 'right', wordWrap: 'break-word'}}>
            {data.data_value} {data.data_uom}
          </td>
        </tr>
      );
    });

    return (
      <>
        <Card className="event-data-card">
          <Card.Header>
            Navigation
            <span class="float-right badge badge-pill badge-info">
                { this.props.data.data_array.find((x) => x.data_name === "nav_source").data_value }
            </span>
          </Card.Header>
          <Card.Body>
            <table style={{width: '100%'}}>
              <tbody>
                { data_rows }
              </tbody>
            </table>
          </Card.Body>
        </Card>
      </>
    );
  };
}
