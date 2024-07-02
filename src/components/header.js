import React, { Component } from 'react'
import { connect } from 'react-redux'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Navbar, Nav, NavDropdown } from 'react-bootstrap'
import PropTypes from 'prop-types'
import { HEADER_TITLE, RECAPTCHA_SITE_KEY, DISABLE_EVENT_LOGGING } from '../client_config'
import { get_custom_vars, update_custom_var } from '../api'
import { _Cruises_, _Lowerings_ } from '../vocab'
import * as mapDispatchToProps from '../actions'

class Header extends Component {
  constructor(props) {
    super(props)
  }

  componentDidMount() {
    if (this.props.authenticated) {
      this.props.updateProfileState()
    }
  }

  async handleASNAPToggle() {
    const query = {
      name: ['asnapStatus']
    }

    const response = await get_custom_vars(query)
    const asnapStatus = response.length ? response[0] : null

    const id = asnapStatus.id
    delete asnapStatus.id

    if (asnapStatus) {
      const new_var_value = asnapStatus.custom_var_value === 'Off' ? 'On' : 'Off'
      asnapStatus['custom_var_value'] = new_var_value
      await update_custom_var(asnapStatus, id)
    }
  }

  renderUserOptions() {
    if (this.props.roles.some((item) => ['admin', 'cruise_manager'].includes(item))) {
      return <NavDropdown.Item onClick={this.props.gotoUsers}>Users</NavDropdown.Item>
    }
  }

  renderEventLoggingOptions() {
    if (this.props.authenticated && !DISABLE_EVENT_LOGGING) {
      return (
        <Nav.Link onClick={this.props.gotoCruiseMenu}>
          Review {_Cruises_}/{_Lowerings_}
        </Nav.Link>
      )
    }
  }

  renderEventManagementOptions() {
    if (this.props.roles.some((item) => ['admin', 'cruise_manager', 'event_manager'].includes(item))) {
      return <NavDropdown.Item onClick={this.props.gotoEventManagement}>Event Management</NavDropdown.Item>
    }
  }

  renderEventTemplateOptions() {
    if (!DISABLE_EVENT_LOGGING && this.props.roles.some((item) => ['admin', 'cruise_manager', 'template_manager'].includes(item))) {
      return <NavDropdown.Item onClick={this.props.gotoEventTemplates}>Event Templates</NavDropdown.Item>
    }
  }

  renderCruiseOptions() {
    if (this.props.roles.some((item) => ['admin', 'cruise_manager'].includes(item))) {
      return <NavDropdown.Item onClick={this.props.gotoCruises}>{_Cruises_}</NavDropdown.Item>
    }
  }

  renderLoweringOptions() {
    if (this.props.roles.some((item) => ['admin', 'cruise_manager'].includes(item))) {
      return <NavDropdown.Item onClick={this.props.gotoLowerings}>{_Lowerings_}</NavDropdown.Item>
    }
  }

  renderTaskOptions() {
    if (this.props.roles.includes('admin')) {
      return <NavDropdown.Item onClick={this.props.gotoTasks}>Tasks</NavDropdown.Item>
    }
  }

  renderToggleASNAP() {
    if (!DISABLE_EVENT_LOGGING && this.props.roles.includes('admin')) {
      return <NavDropdown.Item onClick={() => this.handleASNAPToggle()}>Toggle ASNAP</NavDropdown.Item>
    }
  }

  renderSystemManagerDropdown() {
    if (
      this.props.roles &&
      this.props.roles.some((item) => ['admin', 'cruise_manager', 'event_manager', 'template_manager'].includes(item))
    ) {
      return (
        <NavDropdown title={'System Management'} id='basic-nav-dropdown-system'>
          {this.renderCruiseOptions()}
          {this.renderEventManagementOptions()}
          {this.renderEventTemplateOptions()}
          {this.renderLoweringOptions()}
          {this.renderTaskOptions()}
          {this.renderUserOptions()}
          {this.renderToggleASNAP()}
        </NavDropdown>
      )
    }
  }

  renderUserDropdown() {
    if (this.props.authenticated) {
      return (
        <NavDropdown
          title={
            <span>
              {this.props.fullname} <FontAwesomeIcon icon='user' />
            </span>
          }
          id='basic-nav-dropdown-user'
        >
          {this.props.fullname !== 'Guest' ? (
            <NavDropdown.Item onClick={this.props.gotoProfile} key='profile'>
              User Profile
            </NavDropdown.Item>
          ) : null}
          {this.props.fullname !== 'Guest' && !RECAPTCHA_SITE_KEY ? (
            <NavDropdown.Item key='switch2Guest' onClick={() => this.handleSwitchToGuest()}>
              Switch to Guest
            </NavDropdown.Item>
          ) : null}
          <NavDropdown.Item key='logout' onClick={() => this.handleLogout()}>
            Log Out
          </NavDropdown.Item>
        </NavDropdown>
      )
    }
  }

  handleLogout() {
    this.props.logout()
  }

  handleSwitchToGuest() {
    this.props.switch2Guest()
  }

  render() {
    return (
      <Navbar collapseOnSelect expand='md' variant='dark'>
        <Navbar.Brand onClick={this.props.gotoHome}>{HEADER_TITLE}</Navbar.Brand>
        <Navbar.Toggle aria-controls='responsive-navbar-nav' />
        <Navbar.Collapse id='responsive-navbar-nav' className='justify-content-end'>
          <Nav>
            {this.renderEventLoggingOptions()}
            {this.renderSystemManagerDropdown()}
            {this.renderUserDropdown()}
          </Nav>
        </Navbar.Collapse>
      </Navbar>
    )
  }
}

Header.propTypes = {
  authenticated: PropTypes.bool.isRequired,
  fullname: PropTypes.string,
  gotoCruiseMenu: PropTypes.func.isRequired,
  gotoCruises: PropTypes.func.isRequired,
  gotoEventManagement: PropTypes.func.isRequired,
  gotoEventTemplates: PropTypes.func.isRequired,
  gotoHome: PropTypes.func.isRequired,
  gotoLowerings: PropTypes.func.isRequired,
  gotoProfile: PropTypes.func.isRequired,
  gotoTasks: PropTypes.func.isRequired,
  gotoUsers: PropTypes.func.isRequired,
  logout: PropTypes.func.isRequired,
  roles: PropTypes.array,
  switch2Guest: PropTypes.func.isRequired,
  updateProfileState: PropTypes.func.isRequired
}
const mapStateToProps = (state) => {
  return {
    authenticated: state.auth.authenticated,
    fullname: state.user.profile.fullname,
    roles: state.user.profile.roles,
    asnapStatus: state.custom_var ? state.custom_var.custom_vars.find((custom_var) => custom_var.custom_var_name === 'asnapStatus') : null
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Header)
