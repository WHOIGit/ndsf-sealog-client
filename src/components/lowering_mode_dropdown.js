import React, { Component } from 'react';
import { Dropdown } from 'react-bootstrap';
import PropTypes from 'prop-types';

class LoweringModeDropdownToggle extends Component {
  constructor(props) {
    super(props);

    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(e) {
    e.preventDefault();

    this.props.onClick(e);
  }

  render() {
    return (
      <span className="text-primary dropdown-toggle" onClick={this.handleClick}>
        {this.props.children}
      </span>
    );
  }
}

class LoweringModeDropdownMenu extends Component {
  constructor(props) {
    super(props);

    this.handleChange = this.handleChange.bind(this);

  }

  handleChange(e) {
    this.setState({ value: e.target.value.toLowerCase().trim() });
  }

  render() {
    const { children, style, className, 'aria-labelledby': labeledBy, } = this.props;

    return (
      <div style={style} className={className} aria-labelledby={labeledBy}>
        {this.props.children}
      </div>
    );
  }
}

class LoweringModeDropdown extends Component {

  constructor(props) {
    super(props);

    this.state = {
      menuItems: [],
      toggleText: "Loading..."
    }

    this.menuItemStyle = {paddingLeft: "10px"};
  }

  static propTypes = {
    active_mode: PropTypes.string.isRequired,
    modes: PropTypes.array.isRequired,
    onClick: PropTypes.func
  };

  componentDidMount() {}

  componentDidUpdate() {}

  UNSAFE_componentWillReceiveProps() {
    this.setState(
      {
        toggleText: (this.props.active_mode)? this.props.active_mode : 'Loading...',
        menuItems: this.props.modes.map((mode, index) => (<Dropdown.Item className="text-primary" onClick={() => this.props.onClick(mode)} key={index}>{mode}</Dropdown.Item>))
      }
    )
  }

  render() {

    return (
      <Dropdown as={'span'} id="dropdown-custom-menu">
        <Dropdown.Toggle as={LoweringModeDropdownToggle}>{this.state.toggleText}</Dropdown.Toggle>
        <Dropdown.Menu as={LoweringModeDropdownMenu} style={this.dropdownMenuStyle}>
          {this.state.menuItems}
        </Dropdown.Menu>
      </Dropdown>
    )
  }
}

export default LoweringModeDropdown;
