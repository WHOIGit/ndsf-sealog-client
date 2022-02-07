import PropTypes from 'prop-types';
import React from 'react';
import { Card } from 'react-bootstrap';



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

  render = () => {
    const data_rows = this.props.data.data_array.map((data, i) => {
      return (
        <tr key={i}>
          <td>{prettyPrint(data.data_name)}:</td>
          <td style={{textAlign: 'right', wordWrap: 'break-word'}}>
            {data.data_value} {data.data_uom}
          </td>
        </tr>
      );
    });

    return (
      <>
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
      </>
    );
  };
}
