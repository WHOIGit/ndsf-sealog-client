import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { push } from 'connected-react-router';
import * as mapDispatchToProps from '../../actions';
import { setRedirectPath } from '../../actions';

export default function(ComposedComponent) {
  class Unauthentication extends Component {
    constructor(props) {
      super(props);
      this.handleRedirect = this.handleRedirect.bind(this);
    }

    static contextTypes = {
      router: PropTypes.object
    }

    componentDidMount() {
      if (this.props.authenticated) {
        this.handleRedirect();
      }
    }

    componentDidUpdate() {
      if (this.props.authenticated) {
        this.handleRedirect();
      }
    }

    handleRedirect() {
      const redirectPath = this.props.redirectPath;
      if (redirectPath) {
        this.props.setRedirectPath(null);
        this.props.push(redirectPath);
      } else {
        this.props.gotoHome();
      }
    }

    render() {
      return <ComposedComponent {...this.props} />
    }
  }

  function mapStateToProps(state) {
    return {
      authenticated: state.auth.authenticated,
      redirectPath: state.auth.redirectPath
    };
  }

  return connect(mapStateToProps, { ...mapDispatchToProps, push, setRedirectPath })(Unauthentication);
}