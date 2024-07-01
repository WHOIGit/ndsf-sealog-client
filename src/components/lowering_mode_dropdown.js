import React, { Component, useState } from 'react'
import { Dropdown } from 'react-bootstrap'
import PropTypes from 'prop-types'

// eslint-disable-next-line react/display-name
const LoweringModeDropdownToggle = React.forwardRef(({ children, onClick }, ref) => {
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

LoweringModeDropdownToggle.propTypes = {
  children: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired
}

// eslint-disable-next-line react/display-name
const LoweringModeDropdownMenu = React.forwardRef(({ children, style, className, 'aria-labelledby': labeledBy }, ref) => {
  // eslint-disable-next-line no-unused-vars
  const [value, setValue] = useState('')

  return (
    <div ref={ref} style={style} className={className} aria-labelledby={labeledBy}>
      {React.Children.toArray(children).filter((child) => !value || child.props.children.toLowerCase().startsWith(value))}
    </div>
  )
})

LoweringModeDropdownMenu.propTypes = {
  children: PropTypes.array.isRequired,
  style: PropTypes.object.isRequired,
  className: PropTypes.string.isRequired,
  'aria-labelledby': PropTypes.string.isRequired
}

class LoweringModeDropdown extends Component {
  render() {
    return (
      <Dropdown id='dropdown-custom-menu'>
        <Dropdown.Toggle as={LoweringModeDropdownToggle}>{this.props.active_mode ? this.props.active_mode : 'Loading...'}</Dropdown.Toggle>
        <Dropdown.Menu as={LoweringModeDropdownMenu}>
          {this.props.modes.map((mode, index) => (
            <Dropdown.Item className='text-primary' onClick={() => this.props.onClick(mode)} key={index}>
              {mode}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
    )
  }
}

LoweringModeDropdown.propTypes = {
  active_mode: PropTypes.string.isRequired,
  modes: PropTypes.array.isRequired,
  onClick: PropTypes.func
}

export default LoweringModeDropdown
