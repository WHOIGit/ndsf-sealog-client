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
        // Pass current path so user can be redirected back after login
        this.props.logout(window.location.pathname);
      }
    }

    componentDidUpdate() {
      this.props.validateJWT();
      if (!this.props.authenticated) {
        // Pass current path so user can be redirected back after login
        this.props.logout(window.location.pathname);
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