import React, {Component} from 'react';
import { connect } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Navbar, Nav, NavDropdown } from 'react-bootstrap';
import { HEADER_TITLE, RECAPTCHA_SITE_KEY, DISABLE_EVENT_LOGGING, CUSTOM_CRUISE_NAME, CUSTOM_LOWERING_NAME } from '../client_config';
import * as mapDispatchToProps from '../actions';

class Header extends Component {

  constructor (props) {
    super(props);

    this.state = {
      cruises_name: (CUSTOM_CRUISE_NAME)? CUSTOM_CRUISE_NAME[1].charAt(0).toUpperCase() + CUSTOM_CRUISE_NAME[1].slice(1) : "Cruises",
      lowerings_name: (CUSTOM_LOWERING_NAME)? CUSTOM_LOWERING_NAME[1].charAt(0).toUpperCase() + CUSTOM_LOWERING_NAME[1].slice(1) : "Lowerings",
    }
  }

  componentDidMount() {
    if (this.props.authenticated) {
      this.props.updateProfileState();
    }
  }

  handleASNAPToggle() {
    if(this.props.asnapStatus) {
      if(this.props.asnapStatus.custom_var_value === 'Off') {
        this.props.updateCustomVars(this.props.asnapStatus.id, {custom_var_value: 'On'});
      } else {
        this.props.updateCustomVars(this.props.asnapStatus.id, {custom_var_value: 'Off'});
      }
    }
  }

  renderUserOptions() {
    if ( this.props.roles.includes('admin') || this.props.roles.includes('cruise_manager') ) {
      return (
        <NavDropdown.Item onClick={this.props.gotoUsers}>Users</NavDropdown.Item>
      );
    }
  }

  renderEventLoggingOptions() {
    if ( this.props.authenticated && !DISABLE_EVENT_LOGGING ) {
      return (
        <Nav.Link onClick={this.props.gotoCruiseMenu}>Review {this.state.cruises_name}/{this.state.lowerings_name}</Nav.Link>
      );
    }
  }

  renderEventManagementOptions() {
    if ( this.props.roles.includes('admin') || this.props.roles.includes('event_manager') ) {
      return (
        <NavDropdown.Item onClick={this.props.gotoEventManagement}>Event Management</NavDropdown.Item>
      );
    }
  }

  renderEventTemplateOptions() {
    if ( !DISABLE_EVENT_LOGGING && (this.props.roles.includes('admin') || this.props.roles.includes('template_manager')) ) {
      return (
        <NavDropdown.Item onClick={this.props.gotoEventTemplates}>Event Templates</NavDropdown.Item>
      );
    }
  }

  renderLoweringOptions() {
    if ( this.props.roles.includes('admin') || this.props.roles.includes('cruise_manager') ) {
      return (
        <NavDropdown.Item onClick={this.props.gotoLowerings}>{this.state.lowerings_name}</NavDropdown.Item>
      );
    }
  }

  renderCruiseOptions() {
    if ( this.props.roles.includes('admin') || this.props.roles.includes('cruise_manager') ) {
      return (
        <NavDropdown.Item onClick={this.props.gotoCruises}>{this.state.cruises_name}</NavDropdown.Item>
      );
    }
  }

  renderTaskOptions() {
    if ( this.props.roles.includes('admin') ) {
      return (
        <NavDropdown.Item onClick={this.props.gotoTasks}>Tasks</NavDropdown.Item>
      );
    }
  }

  renderToggleASNAP() {
    if ( !DISABLE_EVENT_LOGGING && ( this.props.roles.includes('admin') || this.props.roles.includes('cruise_manager') || this.props.roles.includes('event_manager') || this.props.roles.includes('event_logger')) ) {
      return (
        <NavDropdown.Item onClick={ () => this.handleASNAPToggle() }>Toggle ASNAP</NavDropdown.Item>
      );
    }
  }

  renderSystemManagerDropdown() {
    if ( this.props.roles && (this.props.roles.includes('admin') || this.props.roles.includes('cruise_manager') || this.props.roles.includes('template_manager') || this.props.roles.includes('event_manager')) ) {
      return (
        <NavDropdown title={'System Management'} id="basic-nav-dropdown-system">
          {this.renderCruiseOptions()}
          {this.renderEventManagementOptions()}
          {this.renderEventTemplateOptions()}
          {this.renderLoweringOptions()}
          {this.renderTaskOptions()}
          {this.renderUserOptions()}
          {this.renderToggleASNAP()}
        </NavDropdown>
      );
    }
  }

  renderUserDropdown() {
    if(this.props.authenticated) {
      return (
        <NavDropdown title={<span>{this.props.fullname} <FontAwesomeIcon icon="user" /></span>} id="basic-nav-dropdown-user">
          {(this.props.fullname !== "Guest") ? <NavDropdown.Item onClick={this.props.gotoProfile} key="profile" >User Profile</NavDropdown.Item> : null }
          {(this.props.fullname !== 'Guest' && RECAPTCHA_SITE_KEY === "")? (<NavDropdown.Item key="switch2Guest" onClick={ () => this.handleSwitchToGuest() } >Switch to Guest</NavDropdown.Item>) : null }
          <NavDropdown.Item key="logout" onClick={ () => this.handleLogout() } >Log Out</NavDropdown.Item>
        </NavDropdown>
      );
    }
  }

  handleLogout() {
    this.props.logout();
  }

  handleSwitchToGuest() {
    this.props.switch2Guest();
  }

  render () {
    return (
      <Navbar className="px-0" collapseOnSelect expand="md" variant="dark">
        <Navbar.Brand onClick={this.props.gotoHome}>{HEADER_TITLE}</Navbar.Brand>
        <Navbar.Toggle aria-controls="responsive-navbar-nav"/>
        <Navbar.Collapse id="responsive-navbar-nav" className="justify-content-end">
          <Nav>
            {this.renderEventLoggingOptions()}
            {this.renderSystemManagerDropdown()}
            {this.renderUserDropdown()}
          </Nav>
        </Navbar.Collapse>
      </Navbar>
    );
  }
}

function mapStateToProps(state){
  return {
    authenticated: state.auth.authenticated,
    fullname: state.user.profile.fullname,
    roles: state.user.profile.roles,
    asnapStatus: (state.custom_var)? state.custom_var.custom_vars.find(custom_var => custom_var.custom_var_name === "asnapStatus") : null
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Header);
