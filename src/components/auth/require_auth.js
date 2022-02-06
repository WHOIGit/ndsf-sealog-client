import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import * as mapDispatchToProps from '../../actions';

export default function(ComposedComponent) {
  class Authentication extends Component {
    static contextTypes = {
      router: PropTypes.object
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

  function mapStateToProps(state) {
    return { authenticated: state.auth.authenticated };
  }

  return connect(mapStateToProps, mapDispatchToProps)(Authentication);
}