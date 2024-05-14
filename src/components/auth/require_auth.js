import React, { Component } from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import * as mapDispatchToProps from '../../actions'

export default (ComposedComponent) => {
  class Authentication extends Component {
    constructor(props, context) {
      super(props, context)
    }

    componentDidMount() {
      this.props.validateJWT()
      if (!this.props.authenticated) {
        this.props.logout()
      }
    }

    componentDidUpdate() {
      this.props.validateJWT()
      if (!this.props.authenticated) {
        this.props.logout()
      }
    }

    render() {
      return <ComposedComponent {...this.props} />
    }
  }

  Authentication.contextTypes = {
    router: PropTypes.object
  }

  Authentication.propTypes = {
    authenticated: PropTypes.bool.isRequired,
    gotoHome: PropTypes.func.isRequired,
    logout: PropTypes.func.isRequired,
    validateJWT: PropTypes.func.isRequired
  }

  const mapStateToProps = (state) => {
    return { authenticated: state.auth.authenticated }
  }

  return connect(mapStateToProps, mapDispatchToProps)(Authentication)
}
