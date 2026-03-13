import PropTypes from 'prop-types';
import React from 'react';
import { Card } from 'react-bootstrap';
import Coordinate from '../coordinate';
import Datum from '../datum';



// Inserts spaces into snake_case and CamelCase
function prettyPrint(text) {
  return text
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ');
}


export default class TabularDataCard extends React.Component {
  static propTypes = {
    data: PropTypes.object.isRequired,
  };

  static sizeProps = {
    xs: 12,
    sm: 6,
    md: 4,
    lg: 3,
  };

  render = () => {
    const data_rows = this.props.data.data_array.map((data, i) => {
      return (
        <tr key={i}>
          <td className="data-name">{prettyPrint(data.data_name)}:</td>
          <td style={{textAlign: 'right', wordWrap: 'break-word'}}>
            {data.data_uom == 'ddeg' ? <Coordinate data={data} /> : <Datum data={data} />}
          </td>
        </tr>
      );
    });

    return (
      <>
        <Card className="event-data-card">
          <Card.Header>
            {prettyPrint(this.props.data.data_source)}
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
