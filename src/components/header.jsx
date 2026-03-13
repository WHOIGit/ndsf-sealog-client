import React, {Component} from 'react';
import { connect } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Navbar, Nav, NavDropdown } from 'react-bootstrap';
import { HEADER_TITLE, RECAPTCHA_SITE_KEY, DISABLE_EVENT_LOGGING } from 'client_config';
import * as mapDispatchToProps from '../actions';
import { _Cruises_, _Lowerings_ } from '../vocab';

class Header extends Component {

  constructor (props) {
    super(props);

    this.state = { };
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
    if (this.props.roles.includes('admin') || this.props.roles.includes('cruise_manager') ) {
      return (
        <NavDropdown.Item onClick={this.props.gotoUsers}>Users</NavDropdown.Item>
      );
    }
  }

  renderEventLoggingOptions() {
    if ( !DISABLE_EVENT_LOGGING ) {
      return (
        <Nav.Link onClick={this.props.gotoCruiseMenu}>Review {_Cruises_}/{_Lowerings_}</Nav.Link>
      );
    }
  }

  renderEventManagementOptions() {
    if (this.props.roles.includes('admin') || this.props.roles.includes('event_manager') ) {
      return (
        <NavDropdown.Item onClick={this.props.gotoEventManagement}>Event Management</NavDropdown.Item>
      );
    }
  }

  renderEventTemplateOptions() {
    if (!DISABLE_EVENT_LOGGING && (this.props.roles.includes('admin') || this.props.roles.includes('template_manager')) ) {
      return (
        <NavDropdown.Item onClick={this.props.gotoEventTemplates}>Event Templates</NavDropdown.Item>
      );
    }
  }

  renderLoweringOptions() {
    if (this.props.roles.includes('admin') || this.props.roles.includes('cruise_manager') ) {
      return (
        <NavDropdown.Item onClick={this.props.gotoLowerings}>{_Lowerings_}</NavDropdown.Item>
      );
    }
  }

  renderCruiseOptions() {
    if (this.props.roles.includes('admin') || this.props.roles.includes('cruise_manager') ) {
      return (
        <NavDropdown.Item onClick={this.props.gotoCruises}>{_Cruises_}</NavDropdown.Item>
      );
    }
  }

  renderTaskOptions() {
    if (this.props.roles.includes('admin') ) {
      return (
        <NavDropdown.Item onClick={this.props.gotoTasks}>Tasks</NavDropdown.Item>
      );
    }
  }

  renderToggleASNAP() {
    if (!DISABLE_EVENT_LOGGING && (this.props.roles.includes('admin') || this.props.roles.includes('cruise_manager') || this.props.roles.includes('event_manager') || this.props.roles.includes('event_logger')) ) {
      return (
        <NavDropdown.Item onClick={ () => this.handleASNAPToggle() }>Toggle ASNAP</NavDropdown.Item>
      );
    }
  }

  renderSystemManagerDropdown() {
    if (this.props.roles.includes('admin') || this.props.roles.includes('cruise_manager') || this.props.roles.includes('template_manager') || this.props.roles.includes('event_manager') ) {
      return (
        <NavDropdown title='System Management' id="basic-nav-dropdown-system">
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

  renderUserSwitchButtons() {
    return this.props.guest_users.map((guest) => {
      if (RECAPTCHA_SITE_KEY !== "")
        return null;

      if (guest.username === this.props.user.profile.username)
        return null;

      return (
        <NavDropdown.Item key={`switch2${guest.username}`}
            onClick={ () => this.handleSwitchToUser(guest.username) }>

            Switch to {guest.fullname}
        </NavDropdown.Item>
      );
    });
  }

  userIsGuest() {
    return this.props.guest_users.some(
      (guest) => guest.username === this.props.user.username);
  }

  renderUserDropdown() {
    if(this.props.authenticated) {
      return (
        <NavDropdown title={<span>{this.props.user.profile.fullname} <FontAwesomeIcon icon="user" /></span>} id="basic-nav-dropdown-user">
          {this.userIsGuest() ? <NavDropdown.Item onClick={this.props.gotoProfile} key="profile" >User Profile</NavDropdown.Item> : null }
          {this.renderUserSwitchButtons()}
          <NavDropdown.Item key="logout" onClick={ () => this.handleLogout() } >Log Out</NavDropdown.Item>
        </NavDropdown>
      );
    }

    // Show login link for unauthenticated users
    return (
      <Nav.Link onClick={this.props.gotoLogin}>
        <FontAwesomeIcon icon="user-lock" /> Login
      </Nav.Link>
    );
  }

  handleLogout() {
    this.props.logout();
  }

  handleSwitchToUser(user) {
    this.props.switch2Guest(user);
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
    user: state.user,
    guest_users: state.user.guest_users,
    roles: state.user.profile.roles,
    asnapStatus: (state.custom_var)? state.custom_var.custom_vars.find(custom_var => custom_var.custom_var_name === "asnapStatus") : null
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Header);
