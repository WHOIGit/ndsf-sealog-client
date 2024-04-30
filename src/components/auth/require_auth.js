import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import * as mapDispatchToProps from '../../actions';

export default (ComposedComponent) => {
  class Authentication extends Component {
    static contextTypes = {
      router: PropTypes.object
    }

    constructor (props, context) {
      super(props, context);
    }

    componentDidMount() {
      this.props.validateJWT();
      if (!this.props.authenticated) {
        this.props.logout()
      }
    }

    componentDidUpdate() {
      this.props.validateJWT();
      if (!this.props.authenticated) {
        this.props.logout();
      }
    }

    render() {
      return <ComposedComponent {...this.props} />
    }
  }

  const mapStateToProps = (state) => {
    return { authenticated: state.auth.authenticated };
  }

  return connect(mapStateToProps, mapDispatchToProps)(Authentication);
}