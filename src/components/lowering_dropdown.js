import React, { Component, useState } from 'react';
import { Dropdown } from 'react-bootstrap';
import PropTypes from 'prop-types';
import axios from 'axios';
import Cookies from 'universal-cookie';
import { API_ROOT_URL } from '../client_config';

const cookies = new Cookies();

const LoweringDropdownToggle = React.forwardRef(
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

const LoweringDropdownMenu = React.forwardRef(
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


class LoweringDropdown extends Component {

  constructor(props) {
    super(props);

    this.state = {
      menuItems: [],
      toggleText: this.props.active_lowering.lowering_id,
    }

    this.menuItemStyle = {paddingLeft: "10px"};
  }

  static propTypes = {
    active_cruise: PropTypes.object.isRequired,
    active_lowering: PropTypes.object.isRequired,
    onClick: PropTypes.func
  };

  componentDidMount() {
  }

  componentDidUpdate(prevProps) {
    if(prevProps.active_lowering !== this.props.active_lowering){
      this.setState({toggleText: this.props.active_lowering.lowering_id})
    }

    if(prevProps.active_cruise !== this.props.active_cruise){
      this.buildMenuItems();
    }
  }

  async buildMenuItems() {

    // let lowering_start_ts = new Date(this.props.active_lowering.start_ts);
    // let lowering_stop_ts = new Date(this.props.active_lowering.stop_ts);
    // let startOfYear = new Date(Date.UTC(lowering_start_ts.getFullYear(), 0, 1, 0, 0, 0));
    // let endOfYear = new Date(Date.UTC(lowering_start_ts.getFullYear(), 11, 31, 23, 59, 59));
    
    if ( this.props.active_cruise.id ) {
      try {
        const response = await axios.get(`${API_ROOT_URL}/api/v1/lowerings/bycruise/${this.props.active_cruise.id}`,
        {
          headers: {
            authorization: cookies.get('token')
          }
        })
        
        const lowerings = await response.data;
        this.setState({menuItems: lowerings.map((lowering) => (<Dropdown.Item className="text-primary" onClick={() => this.props.onClick(lowering.id)} key={lowering.id}>{lowering.lowering_id}</Dropdown.Item>))})
      }
      catch(error){
        console.log(error)
      }
    }
  }

  render() {

    return (
      <Dropdown as={'span'} id="dropdown-custom-menu">
        <Dropdown.Toggle as={LoweringDropdownToggle}>{this.state.toggleText}</Dropdown.Toggle>
        <Dropdown.Menu as={LoweringDropdownMenu} style={this.dropdownMenuStyle}>
          {this.state.menuItems}
        </Dropdown.Menu>
      </Dropdown>
    )
  }
}

export default LoweringDropdown;
