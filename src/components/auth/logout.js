import React, { Component } from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import * as mapDispatchToProps from '../../actions'

class Logout extends Component {
  componentDidMount() {
    this.props.logout()
  }

  render() {
    return <div />
  }
}

Logout.propTypes = {
  logout: PropTypes.func.isRequired
}

export default connect(null, mapDispatchToProps)(Logout)
