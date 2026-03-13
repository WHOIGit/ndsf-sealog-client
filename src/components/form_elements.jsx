import React, { useRef } from 'react';
import { Alert, Col, Form, OverlayTrigger, Tooltip } from 'react-bootstrap';
import Datetime from 'react-datetime';
import moment from 'moment';

export const dateFormat = "YYYY-MM-DD";
export const timeFormat = "HH:mm:ss";

export function renderStaticTextField({ input, label, xs=12, sm=6, md=12, lg=6}) {
  
  const labelComponent = (label)? <Form.Label>{label}</Form.Label> : null;

  return (
    <Form.Group as={Col} xs={xs} sm={sm} md={md} lg={lg}>
      {labelComponent}
      <Form.Control type="text" {...input} disabled />
    </Form.Group>
  );
}

export function renderTextField({ input, label, placeholder, required, meta: { touched, error, warning }, type="text", disabled=false, xs=12, sm=6, md=12, lg=6}) {
  const requiredField = (required)? <span className='text-danger'> *</span> : '';
  const labelComponent = (label)? <Form.Label>{label}{requiredField}</Form.Label> : null;

  return (
    <Form.Group as={Col} xs={xs} sm={sm} md={md} lg={lg}>
      {labelComponent}
      <Form.Control type={type} {...input} placeholder={placeholder} isInvalid={touched && (warning || error)} disabled={disabled} />
      <Form.Control.Feedback className={(warning) ? 'text-warning': ''} type="invalid">{error}{warning}</Form.Control.Feedback>
    </Form.Group>
  );
}

export function renderTextArea({ input, label, placeholder, required, meta: { touched, error }, rows=4, disabled=false, xs=12, sm=12, md=12, lg=12 }) {
  let requiredField = (required)? <span className='text-danger'> *</span> : '';

  return (
    <Form.Group as={Col} xs={xs} sm={sm} md={md} lg={lg}>
      <Form.Label>{label}{requiredField}</Form.Label>
      <Form.Control as="textarea" {...input} placeholder={placeholder} isInvalid={touched && error} disabled={disabled} rows={rows}/>
      <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
    </Form.Group>
  );
}

export function renderSelectField({ input, label, placeholder, required, options, meta: { touched, error }, disabled=false, xs=12, sm=6, md=12, lg=6 }) {

  let requiredField = (required)? <span className='text-danger'> *</span> : '';
  let defaultOption = ( <option key={`${input.name}.empty`} value=""></option> );
  let optionList = options.map((option, index) => {
    return (
      <option key={`${input.name}.${index}`} value={`${option}`}>{ `${option}`}</option>
    );
  });

  return (
    <Form.Group as={Col} xs={xs} sm={sm} md={md} lg={lg}>
      <Form.Label>{label}{requiredField}</Form.Label>
      <Form.Control as="select" {...input} placeholder={placeholder} isInvalid={touched && error} disabled={disabled} >
        { defaultOption }
        { optionList }
      </Form.Control>
      <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
    </Form.Group>
  );
}

/**
 * This component intentionally not exported, use renderDatePicker or renderDateTimePicker below
 */
function DateTimePicker({ input, label, required, meta: { touched, error }, dateFormat='YYYY-MM-DD', timeFormat, disabled=false, xs=12, sm=6, md=12, lg=6 }) {
  // Use ref for updating calendar view when user types manually
  const ref = useRef(null);

  const formatString = timeFormat ? `${dateFormat} ${timeFormat}` : dateFormat;

  // react-datetime does not handle empty string well, so convert to null
  if (input.value == '') {
    input.value = null;
  }
  // Dates are stored as ISO 8601 strings, but react-datetime does not parse without help
  // Only apply formatting in this condition to avoid overwriting user input as they type
  else if (moment(input.value, "YYYY-MM-DDTHH:mm:ss.SSS[Z]", true).isValid()) {
    input.value = moment.utc(input.value, moment.ISO_8601).format(formatString);
  }
  let requiredField = required ? <span className='text-danger'> *</span> : '';

  const inputProps = {
    disabled,
    onChange: (e) => {
      // Redux-Form controlled fields conflict with react-datetime's controlled input, causing
      // caret to jump on manual edit. This saves the caret position.
      // Inspired by https://stackoverflow.com/a/49648061
      const caret = e.target.selectionStart;
      window.requestAnimationFrame(() => e.target.selectionStart = e.target.selectionEnd = caret);
      if (moment(e.target.value, formatString).isValid()) {
        // Update calendar view
        ref.current.setViewDate(moment(e.target.value, formatString))
      }
    }
  }

  return (
    <Form.Group as={Col} xs={xs} sm={sm} md={md} lg={lg}>
      <Form.Label>{label}{requiredField}</Form.Label>
      <Datetime 
        ref={ref}
        {...input} 
        utc={true}
        dateFormat={dateFormat}
        timeFormat={timeFormat} 
        inputProps={inputProps}
      />
      {error && <div className="w-100 mt-1 text-danger" style={{fontSize: ".7rem"}}>{error}</div>}
    </Form.Group>
  )
}

export function renderDatePicker({ timeFormat=false, ...props}) {
  return DateTimePicker({ timeFormat, ...props });
}

export function renderDateTimePicker({ timeFormat='HH:mm:ss', ...props}) {
  return DateTimePicker({ timeFormat, ...props });
}

export function renderCheckboxGroup({ label, options, input, required, meta: { dirty, error }, disabled=false, inline=false, indication=false }) {

  const requiredField = (required)? (<span className='text-danger'> *</span>) : '';
  const checkboxList = options.map((option, index) => {

    const tooltip = (option.description)? (<Tooltip id={`${option.value}_Tooltip`}>{option.description}</Tooltip>) : null
    
    const checkbox = <Form.Check
      label={(indication && input.value.includes(option.value)) ? <span className="text-warning">{option.value}</span> : option.value }
      name={`${option.label}[${index}]`}
      key={`${label}.${index}`}
      value={option.value}
      checked={input.value.indexOf(option.value) !== -1}
      disabled={disabled}
      inline={inline}
      onChange={event => {
        const newValue = [...input.value];
        if(event.target.checked) {
          newValue.push(option.value);
        } else {
          newValue.splice(newValue.indexOf(option.value), 1);
        }
        return input.onChange(newValue);
      }}
    />

    return (tooltip) ? <span key={`${label}.${index}`}><OverlayTrigger placement="right" overlay={tooltip}>{checkbox}</OverlayTrigger></span> : <span key={`${label}.${index}`}>{checkbox}</span>;
  });

  return (
    <Form.Group as={Col}>
      <Form.Label><span>{label}{requiredField}</span> {dirty && (error && <span className="text-danger" style={{fontSize: ".7rem"}}>{error}<br/></span>)}</Form.Label><br/>
      {checkboxList}
    </Form.Group>      
  );
}

export function renderCheckbox({ input, label, meta: { dirty, error }, disabled=false, xs=12, sm=6, md=12, lg=6 }) {    
  return (
    <Form.Group as={Col} xs={xs} sm={sm} md={md} lg={lg}>
      <Form.Check
        {...input}
        label={label}
        checked={input.value ? true : false}
        onChange={(e) => input.onChange(e.target.checked)}
        isInvalid={dirty && error}
        disabled={disabled}
      >
      </Form.Check>
      <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
    </Form.Group>
  );
}


export function renderRadioGroup({ label, options, input, required, meta: { dirty, error }, disabled=false, inline=false, indication=false }) {

  const requiredField = (required)? (<span className='text-danger'> *</span>) : '';
  // console.log(options);
  const radioList = options.map((option, index) => {

    const tooltip = (option.description)? (<Tooltip id={`${option.value}_Tooltip`}>{option.description}</Tooltip>) : null
    
    const radio = <Form.Check
      label={(indication && input.value === option.value) ? <span className="text-warning">{option.value}</span> : option.value }
      name={`${label}`}
      key={`${label}.${index}`}
      value={option.value}
      checked={input.value === option.value}
      disabled={disabled}
      type="radio"
      inline={inline}
      onChange={() => {
        return input.onChange(option.value);
      }}
    />

    return (tooltip) ? <span key={`${label}.${index}`}><OverlayTrigger placement="right" overlay={tooltip}>{radio}</OverlayTrigger></span> : <span key={`${label}.${index}`}>{radio}</span>;
  });

  return (
    <Form.Group as={Col}>
      <Form.Label><span>{label}{requiredField}</span> {dirty && (error && <span className="text-danger" style={{fontSize: ".7rem"}}>{error}<br/></span>)}</Form.Label><br/>
      {radioList}
    </Form.Group>      
  );
}

export function renderSwitch({ input, label, meta: { dirty, error }, disabled=false }) {    

  return (
    <Form.Group className="ml-2">
      <Form.Switch
        {...input}
        id={input.name}
        checked={input.value ? true : false}
        onChange={(e) => input.onChange(e.target.checked)}
        isInvalid={dirty && error}
        label={label}
        disabled={disabled}
      >
      </Form.Switch>
      <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
    </Form.Group>
  );
}


export function renderAlert(message) {
  if (message) {
    return (
      <Alert variant="danger">
        <strong>Oops!</strong> {message}
      </Alert>
    );
  }
}

export function renderMessage(message) {
  if (message) {
    return (
      <Alert variant="success">
        <strong>Success!</strong> {message}
      </Alert>
    );
  }
}