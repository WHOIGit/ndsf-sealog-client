import React from 'react';
import { Alert, Col, Form, OverlayTrigger, Row, Tooltip } from 'react-bootstrap';
import Datetime from 'react-datetime';
import moment from 'moment';

export const dateFormat = "YYYY-MM-DD";
export const timeFormat = "HH:mm:ss";

export function renderTextField({ input, label, placeholder, required, meta: { touched, error }, type="text", disabled=false, xs=12, sm=6, md=12, lg=6}) {
  const requiredField = (required)? <span className='text-danger'> *</span> : '';
  const labelComponent = (label)? <Form.Label>{label}{requiredField}</Form.Label> : null;

  return (
    <Form.Group as={Col} xs={xs} sm={sm} md={md} lg={lg}>
      {labelComponent}
      <Form.Control type={type} {...input} placeholder={placeholder} isInvalid={touched && error} />
      <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
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
      <Form.Control as="select" {...input} placeholder={placeholder} isInvalid={touched && error}>
        { defaultOption }
        { optionList }
      </Form.Control>
      <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
    </Form.Group>
  );
}

export function renderDatePicker({ input, label, required, meta: { touched, error }, dateFormat='YYYY-MM-DD', disabled=false, xs=12, sm=6, md=12, lg=6 }) {
  let requiredField = (required)? <span className='text-danger'> *</span> : '';
  
  // inputProps={{className: "form-control form-control-sm"}} 

  return (
    <Form.Group as={Col} xs={xs} sm={sm} md={md} lg={lg}>
      <Form.Label>{label}{requiredField}</Form.Label>
      <Datetime {...input} utc={true} value={input.value ? moment.utc(input.value).format(dateFormat) : null} dateFormat={dateFormat} timeFormat={false} selected={input.value ? moment.utc(input.value, dateFormat) : null }/>
      {touched && (error && <div style={{width: "100%", marginTop: "0.25rem", fontSize: "80%"}} className='text-danger'>{error}</div>)}
    </Form.Group>
  );
}

export function renderDateTimePicker({ input, label, required, meta: { touched, error }, dateFormat='YYYY-MM-DD', timeFormat='HH:mm:ss', disabled=false, xs=12, sm=6, md=12, lg=6 }) {
  let requiredField = (required)? <span className='text-danger'> *</span> : ''

  // inputProps={{className: "form-control form-control-sm"}} 

  return (
    <Form.Group as={Col} xs={xs} sm={sm} md={md} lg={lg}>
      <Form.Label>{label}{requiredField}</Form.Label>
      <Datetime {...input} utc={true} value={input.value ? moment.utc(input.value).format(dateFormat + ' ' + timeFormat) : null} dateFormat={dateFormat} timeFormat={timeFormat} selected={input.value ? moment.utc(input.value) : null } />
      {touched && (error && <div style={{width: "100%", marginTop: "0.25rem", fontSize: "80%"}} className='text-danger'>{error}</div>)}
    </Form.Group>
  )
}

export function renderCheckboxGroup({ label, options, input, required, meta: { dirty, error }, disabled=false }) {

  const requiredField = (required)? (<span className='text-danger'> *</span>) : '';
  // console.log(options);
  const checkboxList = options.map((option, index) => {

    const tooltip = (option.description)? (<Tooltip id={`${option.value}_Tooltip`}>{option.description}</Tooltip>) : null
    
    const checkbox = <Form.Check
      label={option.value}
      name={`${option.label}[${index}]`}
      key={`${label}.${index}`}
      value={option.value}
      checked={input.value.indexOf(option.value) !== -1}
      disabled={disabled}
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
      <Form.Label><span>{label}{requiredField}</span> {dirty && (error && <span className="text-danger" style={{marginTop: "-16px", fontSize: "80%"}}>{error}<br/></span>)}</Form.Label><br/>
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

export function renderSwitch({ input, label, meta: { dirty, error }, disabled=false }) {    

  return (
    <Form.Group>
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
        <strong>Opps!</strong> {message}
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