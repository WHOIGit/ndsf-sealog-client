import React, { Component, useState } from 'react';
import { Dropdown } from 'react-bootstrap';
import PropTypes from 'prop-types';

const LoweringModeDropdownToggle = React.forwardRef(
  ({ children, onClick }, ref) => {

    return (
      <span
        className="text-primary dropdown-toggle"
        ref={ref}
        onClick={e => {
          e.preventDefault();
          onClick(e);
        }}
      >
        {children}
      </span>
    );
  }
);

const LoweringModeDropdownMenu = React.forwardRef(
  ({ children, style, className, 'aria-labelledby': labeledBy }, ref) => {
    const [value, setValue] = useState('');

    return (
      <div
        ref={ref}
        style={style}
        className={className}
        aria-labelledby={labeledBy}
      >
        <ul className="list-unstyled">
          {React.Children.toArray(children).filter(
            child =>
              !value || child.props.children.toLowerCase().startsWith(value),
          )}
        </ul>
      </div>
    );
  }
);

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
