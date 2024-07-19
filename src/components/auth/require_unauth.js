import React, { Component } from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import * as mapDispatchToProps from '../../actions'

export default (ComposedComponent) => {
  class Unauthentication extends Component {
    constructor(props, context) {
      super(props, context)
    }

    componentDidMount() {
      if (this.props.authenticated) {
        this.props.gotoHome()
      }
    }

    componentDidUpdate() {
      if (this.props.authenticated) {
        this.props.gotoHome()
      }
    }

    render() {
      return <ComposedComponent {...this.props} />
    }
  }

  Unauthentication.contextTypes = {
    router: PropTypes.object
  }

  Unauthentication.propTypes = {
    authenticated: PropTypes.bool.isRequired,
    gotoHome: PropTypes.func.isRequired
  }

  const mapStateToProps = (state) => {
    return { authenticated: state.auth.authenticated }
  }

  return connect(mapStateToProps, mapDispatchToProps)(Unauthentication)
}
