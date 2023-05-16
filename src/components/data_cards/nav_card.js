import PropTypes from 'prop-types';
import React from 'react';
import { Card } from 'react-bootstrap';
import Coordinate from '../coordinate';



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

  render = () => {
    // Preferred order in which to sort the columns as specified by UI mock-ups
    const preferred_order = [
      [
        "time",
        "latitude",
        "longitude",
        "local_x",
        "local_y",
      ],
      [
        "depth",
        "altitude",
        "heading",
        "pitch",
        "roll",
      ],
    ];

    // List of data entries we've already sorted
    const processed = [];
    processed.push("nav_source");  // handled as special case, don't display 2x

    // First split the entries for which we already know their preferred column,
    // in sorted order.
    const data_cells = [[], []];

    for (let i = 0; i < preferred_order.length; i ++) {
      preferred_order[i].forEach((name) => {
        const data =
          this.props.data.data_array.find((x) => x.data_name === name);
        if (!data) return;

        processed.push(name);
        data_cells[i].push(data);
      });
    }

    // Handle anything remaining and sort into the shortest column
    this.props.data.data_array.forEach((data) => {
      if (processed.indexOf(data.data_name) !== -1)
        return;

      // Find the shortest column. Defaults to the first column.
      // See https://gist.github.com/janosh/099bd8061f15e3fbfcc19be0e6b670b9
      const shortest = data_cells.map((el, idx) => [el.length, idx])
        .reduce((min, el) => (el[0] < min[0] ? el : min))[1];

      data_cells[shortest].push(data);
    });

    // Transform into table rows
    const max_rows = Math.max.apply(null, data_cells.map((col) => col.length));
    const table_rows = [];

    for (let i = 0; i < max_rows; i ++) {
      const row_cols = [];
      for (let j = 0; j < data_cells.length; j ++) {
        // For short columns, just pad with empty cells
        if (i > data_cells[j].length - 1) {
          row_cols.push(
            <React.Fragment key={j}>
              <td></td>
              <td></td>
            </React.Fragment>
          );
          continue;
        }

        const data = data_cells[j][i];
        row_cols.push(
          <React.Fragment key={j}>
            <td className={"data-name" + ((j > 0) ? " pl-4" : "")}>
              {prettyPrint(data.data_name)}
            </td>
            <td style={{textAlign: 'right', wordWrap: 'break-word'}}>
              {data.data_uom == 'ddeg' ? <Coordinate data={data} /> : data.data_value + " " + data.data_uom}
            </td>
          </React.Fragment>
        );
      }

      table_rows.push(
        <tr key={i}>
          {row_cols}
        </tr>
      );
    }

    return (
      <>
        <Card className="event-data-card">
          <Card.Header>
            Navigation
            <span className="float-right badge badge-pill badge-info">
                { this.props.data.data_array.find((x) => x.data_name === "nav_source").data_value }
            </span>
          </Card.Header>
          <Card.Body>
            <table style={{width: '100%'}}>
              <tbody>
                { table_rows }
              </tbody>
            </table>
          </Card.Body>
        </Card>
      </>
    );
  };
}
