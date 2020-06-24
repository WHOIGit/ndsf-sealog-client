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
        {React.Children.toArray(children).filter(
          child =>
            !value || child.props.children.toLowerCase().startsWith(value),
        )}
      </div>
    );
  }
);


class LoweringDropdown extends Component {

  constructor(props) {
    super(props);

    this.state = {
      lowerings: [],
    }
  }

  static propTypes = {
    active_cruise: PropTypes.object.isRequired,
    active_lowering: PropTypes.object.isRequired,
    onClick: PropTypes.func
  };

  componentDidMount() {
    this.fetchLowerings();
  }

  componentDidUpdate(prevProps) {
    if(prevProps.active_cruise !== this.props.active_cruise){
      this.fetchLowerings();
    }
  }

  async fetchLowerings() {

    if ( this.props.active_cruise.id ) {
      try {
        const response = await axios.get(`${API_ROOT_URL}/api/v1/lowerings/bycruise/${this.props.active_cruise.id}`,
        {
          headers: {
            authorization: cookies.get('token')
          }
        })
        
        const lowerings = await response.data;
        this.setState({lowerings})
      }
      catch(error){
        console.log(error)
      }
    }
  }

  render() {

    return (
      <Dropdown className="no-arrow" id="dropdown-custom-menu">
        <Dropdown.Toggle as={LoweringDropdownToggle}>{(this.props.active_lowering.lowering_id) ? this.props.active_lowering.lowering_id : 'Loading...'}</Dropdown.Toggle>
        <Dropdown.Menu as={LoweringDropdownMenu}>
          {this.state.lowerings.map((lowering) => (<Dropdown.Item className="text-primary" onClick={() => this.props.onClick(lowering.id)} key={lowering.id}>{lowering.lowering_id}</Dropdown.Item>))}
        </Dropdown.Menu>
      </Dropdown>
    )
  }
}

export default LoweringDropdown;
