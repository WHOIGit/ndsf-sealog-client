import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Card, Col } from 'react-bootstrap'

class AuxDataCard extends Component {
  render() {
    const aux_data_points = this.props.aux_data.data_array.map((data, index) => {
      return (
        <div key={`${this.props.aux_data.data_source}_data_point_${index}`}>
          <span className='data-name'>{data.data_name.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}:</span>{' '}
          <span className='float-right' style={{ wordWrap: 'break-word' }}>
            {data.data_value} {data.data_uom}
          </span>
          <br />
        </div>
      )
    })

    return (
      <Col
        className='event-data-col'
        key={`${this.props.aux_data.data_source}_col`}
        sm={this.props.sm || 6}
        md={this.props.md || 4}
        lg={this.props.lg || 3}
      >
        <Card className='event-data-card' key={`${this.props.aux_data.data_source}`}>
          <Card.Header>{this.props.aux_data.data_source.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}</Card.Header>
          <Card.Body>{aux_data_points}</Card.Body>
        </Card>
      </Col>
    )
  }
}

AuxDataCard.propTypes = {
  aux_data: PropTypes.object.isRequired,
  sm: PropTypes.number,
  md: PropTypes.number,
  lg: PropTypes.number
}

class AuxDataCards extends Component {
  render() {
    return this.props.aux_data.map((aux_data) => {
      return (
        <AuxDataCard aux_data={aux_data} key={`${aux_data.data_source}_col`} sm={this.props.sm} md={this.props.md} lg={this.props.lg} />
      )
    })
  }
}

AuxDataCards.propTypes = {
  aux_data: PropTypes.array.isRequired,
  sm: PropTypes.number,
  md: PropTypes.number,
  lg: PropTypes.number
}

export default AuxDataCards
