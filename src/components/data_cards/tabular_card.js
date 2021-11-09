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

  render() {
    const data_array = this.props.data.data_array.map((data, i) => {
      return (
        <div key={`row${i}`}>
          <span className="data-name">
            {prettyPrint(data.data_name)}:
          </span>
          <span className="float-right" style={{wordWrap:'break-word'}}>
            {data.data_value} {data.data_uom}
          </span>
        </div>
      );
    });

    return (
      <>
        <Card.Header>
          {prettyPrint(this.props.data.data_source)}
        </Card.Header>
        <Card.Body>
          {data_array}
        </Card.Body>
      </>
    );
  }
}
