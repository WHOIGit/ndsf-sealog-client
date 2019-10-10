import React, { Component } from 'react';
import { Dropdown } from 'react-bootstrap';
import PropTypes from 'prop-types';
import axios from 'axios';
import Cookies from 'universal-cookie';
import { API_ROOT_URL } from '../client_config';

const cookies = new Cookies();

class LoweringDropdownToggle extends Component {
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
      <span className="text-warning dropdown-toggle" onClick={this.handleClick}>
        {this.props.children}
      </span>
    );
  }
}

class LoweringDropdownMenu extends Component {
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

class LoweringDropdown extends Component {

  constructor(props) {
    super(props);

    this.state = {
      menuItems: [],
      toggleText: "Loading...",
      cruise: {}
    }

    this.menuItemStyle = {paddingLeft: "10px"};
    this.getLowerings = this.getLowerings.bind(this);

  }

  static propTypes = {
    active_cruise: PropTypes.object.isRequired,
    active_lowering: PropTypes.object.isRequired,
    onClick: PropTypes.func
  };

  componentDidMount() {}

  componentDidUpdate() {

    if(this.state.cruise && this.props.active_cruise && this.state.cruise.id !== this.props.active_cruise.id) {
      this.getLowerings(this.props.active_cruise, this.props.onClick)
    }
  }

  UNSAFE_componentWillReceiveProps() {
    this.setState(
      {
        toggleText: (this.props.active_lowering.lowering_id)? this.props.active_lowering.lowering_id : 'Loading...'
      }
    )

    if(this.props.active_cruise && this.props.active_cruise.cruise_id !== this.state.cruise.cruise_id) {
      this.getLowerings(this.props.active_cruise, this.props.onClick)
    }
  }

  async getLowerings(cruise, onClick) {

    try {
      const response = await axios.get(`${API_ROOT_URL}/api/v1/lowerings?startTS=${cruise.start_ts}&stopTS=${cruise.stop_ts}`,
      {
        headers: {
          authorization: cookies.get('token')
        }
      })
      
      const lowerings = await response.data;
      this.setState({cruise, menuItems: lowerings.map((lowering) => (<Dropdown.Item className="text-warning" onClick={() => onClick(lowering.id)} key={lowering.id}>{lowering.lowering_id}</Dropdown.Item>))})
    }
    catch(error){
      console.log(error)
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
