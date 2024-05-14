import React, { Component, useState } from 'react'
import { Dropdown } from 'react-bootstrap'
import PropTypes from 'prop-types'
import { get_lowerings_by_cruise } from '../api'

// eslint-disable-next-line react/display-name
const LoweringDropdownToggle = React.forwardRef(({ children, onClick }, ref) => {
  return (
    <span
      className='text-primary dropdown-toggle'
      ref={ref}
      onClick={(e) => {
        e.preventDefault()
        onClick(e)
      }}
    >
      {children}
    </span>
  )
})

LoweringDropdownToggle.propTypes = {
  children: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired
}

// eslint-disable-next-line react/display-name
const LoweringDropdownMenu = React.forwardRef(({ children, style, className, 'aria-labelledby': labeledBy }, ref) => {
  // eslint-disable-next-line no-unused-vars
  const [value, setValue] = useState('')

  return (
    <div ref={ref} style={style} className={className} aria-labelledby={labeledBy}>
      {React.Children.toArray(children).filter((child) => !value || child.props.children.toLowerCase().startsWith(value))}
    </div>
  )
})

LoweringDropdownMenu.propTypes = {
  children: PropTypes.array.isRequired,
  style: PropTypes.object.isRequired,
  className: PropTypes.string.isRequired,
  'aria-labelledby': PropTypes.string.isRequired
}

class LoweringDropdown extends Component {
  constructor(props) {
    super(props)

    this.state = {
      lowerings: []
    }
  }

  componentDidMount() {
    this.fetchLowerings()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.cruise !== this.props.cruise) {
      this.fetchLowerings()
    }
  }

  async fetchLowerings() {
    if (this.props.cruise.id) {
      const lowerings = await get_lowerings_by_cruise(this.props.cruise.id)
      this.setState({ lowerings })
    }
  }

  render() {
    return (
      <Dropdown className='no-arrow' id='dropdown-custom-menu'>
        <Dropdown.Toggle as={LoweringDropdownToggle}>
          {this.props.lowering.lowering_id ? this.props.lowering.lowering_id : 'Loading...'}
        </Dropdown.Toggle>
        <Dropdown.Menu as={LoweringDropdownMenu}>
          {this.state.lowerings.map((lowering) => (
            <Dropdown.Item className='text-primary' onClick={() => this.props.onClick(lowering.id)} key={lowering.id}>
              {lowering.lowering_id}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
    )
  }
}

LoweringDropdown.propTypes = {
  cruise: PropTypes.object.isRequired,
  lowering: PropTypes.object.isRequired,
  onClick: PropTypes.func
}

export default LoweringDropdown
