import axios from 'axios';
import Cookies from 'universal-cookie';
import queryString from 'querystring';
import { push } from 'connected-react-router';
import { show } from 'redux-modal';
import {change, untouch} from 'redux-form';
import { API_ROOT_URL} from '../client_config';

import {
  AUTH_USER,
  UNAUTH_USER,
  AUTH_ERROR,
  AUTH_SUCCESS,
  CREATE_USER_SUCCESS,
  CREATE_USER_ERROR,
  LEAVE_CREATE_USER_FORM,
  REGISTER_USER_SUCCESS,
  REGISTER_USER_ERROR,
  LEAVE_REGISTER_USER_FORM,
  INIT_USER,
  UPDATE_USER_SUCCESS,
  UPDATE_USER_ERROR,
  LEAVE_UPDATE_USER_FORM,
  FETCH_USERS,
  FETCH_EVENT_TEMPLATES_FOR_MAIN,
  FETCH_EVENTS,
  SET_SELECTED_EVENT,
  CLEAR_SELECTED_EVENT,
  FETCH_FILTERED_EVENTS,
  LEAVE_AUTH_LOGIN_FORM,
  FETCH_EVENT_HISTORY,
  UPDATE_EVENT_HISTORY,
  UPDATE_PROFILE,
  UPDATE_PROFILE_SUCCESS,
  UPDATE_PROFILE_ERROR,
  LEAVE_UPDATE_PROFILE_FORM,
  INIT_EVENT_TEMPLATE,
  FETCH_EVENT_TEMPLATES,
  UPDATE_EVENT_TEMPLATE_CATEGORY,
  UPDATE_EVENT_TEMPLATE_SUCCESS,
  UPDATE_EVENT_TEMPLATE_ERROR,
  LEAVE_UPDATE_EVENT_TEMPLATE_FORM,
  CREATE_EVENT_TEMPLATE_SUCCESS,
  CREATE_EVENT_TEMPLATE_ERROR,
  LEAVE_CREATE_EVENT_TEMPLATE_FORM,
  INIT_EVENT,
  EVENT_FETCHING,
  UPDATE_EVENT_FILTER_FORM,
  LEAVE_EVENT_FILTER_FORM,
  HIDE_ASNAP,
  SHOW_ASNAP,
  UPDATE_EVENT,
  UPDATE_EVENTS,
  FETCH_CUSTOM_VARS,
  INIT_CRUISE,
  UPDATE_CRUISE_SUCCESS,
  UPDATE_CRUISE_ERROR,
  LEAVE_UPDATE_CRUISE_FORM,
  CREATE_CRUISE_SUCCESS,
  CREATE_CRUISE_ERROR,
  LEAVE_CREATE_CRUISE_FORM,
  FETCH_CRUISES,
  INIT_LOWERING,
  UPDATE_LOWERING_SUCCESS,
  UPDATE_LOWERING_ERROR,
  LEAVE_UPDATE_LOWERING_FORM,
  CREATE_LOWERING_SUCCESS,
  CREATE_LOWERING_ERROR,
  LEAVE_CREATE_LOWERING_FORM,
  FETCH_LOWERINGS

} from './types';

const cookies = new Cookies();

export function validateJWT() {

  const token = cookies.get('token');

  if(!token) {
    return function (dispatch) {
      console.log("JWT is missing, logging out");
      dispatch({type: UNAUTH_USER});
    };
  }

  return function (dispatch) {
    axios.get(`${API_ROOT_URL}/api/v1/auth/validate`,
      {
        headers: {
          authorization: token
        }
      })
      .then(() => {
        dispatch({type: AUTH_USER});
      })
      .catch(()=>{
        console.log("JWT is invalid, logging out");
        dispatch(logout());
      });
  };
}

export function resetFields(formName, fieldsObj) {
  return function (dispatch) {
    Object.keys(fieldsObj).forEach(fieldKey => {
      //reset the field's value
      dispatch(change(formName, fieldKey, fieldsObj[fieldKey]));

      //reset the field's error
      dispatch(untouch(formName, fieldKey));
    });
  };
}

export function updateProfileState() {

  return function (dispatch) {
    axios.get(`${API_ROOT_URL}/api/v1/auth/profile`,
      {
        headers: {
          authorization: cookies.get('token')
        }
      })
      .then((response) => {
        dispatch({ type: UPDATE_PROFILE, payload: response.data });
      })
      .catch((error)=>{
        console.log(error);
      });
  };
}

export function initUser(id) {
  return function (dispatch) {
    axios.get(`${API_ROOT_URL}/api/v1/users/${id}`,
      {
        headers: {
          authorization: cookies.get('token')
        }
      })
      .then((response) => {
        dispatch({ type: INIT_USER, payload: response.data });
      })
      .catch((error)=>{
        console.log(error);
      });
  };
}

export function initEventTemplate(id) {
  return function (dispatch) {
    axios.get(`${API_ROOT_URL}/api/v1/event_templates/${id}`,
      {
        headers: {
          authorization: cookies.get('token')
        }
      })
      .then((response) => {

        response.data.event_options = response.data.event_options.map(event_option => {
          event_option.event_option_values = event_option.event_option_values.join(',');
          return event_option;
        });

        dispatch({ type: INIT_EVENT_TEMPLATE, payload: response.data });
      })
      .catch((error)=>{
        console.log(error);
      });
  };
}

export function login({username, password, reCaptcha = null}) {

  const payload = (reCaptcha !== null)? {username, password, reCaptcha} : {username, password};

  return function (dispatch) {
    // axios.post(`${API_ROOT_URL}/api/v1/auth/login`, {username, password, reCaptcha}) <-- need to implement this server-side
    axios.post(`${API_ROOT_URL}/api/v1/auth/login`, payload)
      .then(response => {

        // If request is good save the JWT token to a cookie
        cookies.set('token', response.data.token, { path: '/' });
        cookies.set('id', response.data.id, { path: '/' });
        
        dispatch(updateProfileState());
        dispatch({ type: AUTH_USER });

      })
      .catch((error)=>{
        console.log(error.response.data.message);
        // If request is unauthenticated
        dispatch(authError(error.response.data.message));

      });
  };
}

export function gotoHome() {

  return function (dispatch) {
    dispatch(push(`/`));
  };
}

export function gotoCruiseMenu() {

  return function (dispatch) {
    dispatch(push(`/cruise_menu`));
  };
}

export function gotoCruises() {

  return function (dispatch) {
    dispatch(push(`/cruises`));
  };
}

export function gotoEventManagement() {

  return function (dispatch) {
    dispatch(push(`/event_management`));
  };
}

export function gotoEventTemplates() {

  return function (dispatch) {
    dispatch(push(`/event_templates`));
  };
}

export function gotoLowerings() {

  return function (dispatch) {
    dispatch(push(`/lowerings`));
  };
}

export function gotoProfile() {

  return function (dispatch) {
    dispatch(push(`/profile`));
  };
}

export function gotoTasks() {

  return function (dispatch) {
    dispatch(push(`/tasks`));
  };
}

export function gotoUsers() {

  return function (dispatch) {
    dispatch(push(`/users`));
  };
}

export function gotoLoweringGallery(id) {

  return function (dispatch) {
    dispatch(initLowering(id));
    dispatch(push(`/lowering_gallery/${id}`));
  };
}

export function gotoLoweringMap(id) {

  return function (dispatch) {
    dispatch(initLowering(id));
    dispatch(push(`/lowering_map/${id}`));
  };
}

export function gotoLoweringReplay(id) {

  return function (dispatch) {
    dispatch(initLowering(id));
    dispatch(push(`/lowering_replay/${id}`));
  };
}

export function gotoLoweringReview(id) {

  return function (dispatch) {
    dispatch(initLowering(id));
    dispatch(push(`/lowering_review/${id}`));
  };
}

export async function createEventRequest(eventValue, eventFreeText, eventOptions, eventTS) {

  let payload = {
    event_value: eventValue,
    event_free_text: eventFreeText,
    event_options: eventOptions
  };

  if(eventTS.length > 0){
    payload.ts = eventTS;
  }

  const response = await axios.post(`${API_ROOT_URL}/api/v1/events`,
    payload,
    {
      headers: {
        authorization: cookies.get('token')
      }
    })
    .then((response) => {
      return response.data.insertedEvent;
    })
    .catch((error)=>{
      console.log(error);
    });

  return response;
}

export function createEvent(eventValue, eventFreeText = '', eventOptions = [], eventTS = '') {

  return async dispatch => {
    try {
      const event = await createEventRequest(eventValue, eventFreeText, eventOptions, eventTS);
      return event;
    } catch (e) {
      console(e);
    }
  };
}

export async function updateEventRequest(event_id, eventValue, eventFreeText = '', eventOptions = [], eventTS = '') {

  let payload = {
    event_value: eventValue,
    event_free_text: eventFreeText,
    event_options: eventOptions
  };

  if(eventTS.length > 0){
    payload.ts = eventTS;
  }

  const response = await axios.patch(`${API_ROOT_URL}/api/v1/events/${event_id}`,
    payload,
    {
      headers: {
        authorization: cookies.get('token')
      }
    })
    .then((response) => {
      return { response };
    })
    .catch((error)=>{
      console.log(error);
    });
  
  return response;
}

export function updateEvent(event_id, eventValue, eventFreeText = '', eventOptions = [], eventTS = '') {

  return async dispatch => {
    try {
      const event = await updateEventRequest(event_id, eventValue, eventFreeText, eventOptions, eventTS);
      return event;
    } catch (e) {
      console(e);
    }
  };
}

export function updateLoweringReplayEvent(event_id) {

  return function (dispatch) {
    
    axios.get(API_ROOT_URL + '/api/v1/events/' + event_id, {
      headers: {
        authorization: cookies.get('token')
      },
    }).then(({data}) => {
      dispatch({type: UPDATE_EVENT, payload: data});
    }).catch((error) => {
      if(error.response.status !== 404) {
        console.log(error);
      }
    });
  };
}

export async function deleteEventRequest(event_id) {

  const response = await axios.delete(`${API_ROOT_URL}/api/v1/events/${event_id}`,
    {
      headers: {
        authorization: cookies.get('token')
      }
    })
    .then((response) => {
      return { response };
    })
    .catch((error)=>{
      console.log(error);
    });

  return response;
}

export function deleteEvent(event_id) {

  return async dispatch => {
    try {
      const response = await deleteEventRequest(event_id);
      return response;
    } catch (e) {
      console(e);
    }
  };
}

export function forgotPassword({email, reCaptcha = null}) {

  const payload = (reCaptcha)? {email, reCaptcha}: {email};

  return function (dispatch) {
    axios.post(`${API_ROOT_URL}/api/v1/auth/forgotPassword`, payload)
      .then(response => {

        dispatch(authSuccess(response.data.message));

      })
      .catch((error)=>{
        console.log(error);

        // If request is invalid
        dispatch(authError(error.response.data.message));

      });
  };
}

export function resetPassword({token, password, reCaptcha = null}) {
  
  const payload = (reCaptcha)? {token, password, reCaptcha}: {token, password};
  
  return function (dispatch) {
    axios.patch(`${API_ROOT_URL}/api/v1/auth/resetPassword`, payload)
      .then(() => {
        dispatch(authSuccess('Password Reset'));
      })
      .catch((error) => {

        console.log(error);

        // If request is unauthenticated
        dispatch(authError(error.response.data.message));

      });
  };
}

export function registerUser({username, fullname, password, email, reCaptcha = null}) {

  const payload = (reCaptcha !== null)? {username, fullname, password, email, reCaptcha} : {username, fullname, password, email};

  return function (dispatch) {
    axios.post(`${API_ROOT_URL}/api/v1/auth/register`, payload)
      .then(() => {
        dispatch(registerUserSuccess('User created'));
      })
      .catch((error) => {

        console.log(error);

        // If request is unauthenticated
        dispatch(registerUserError(error.response.data.message));

      });
  };
}

export function createUser({username, fullname, password = '', email, roles, system_user = false}) {
  return function (dispatch) {
    axios.post(`${API_ROOT_URL}/api/v1/users`,
      {username, fullname, password, email, roles, system_user},
      {
        headers: {
          authorization: cookies.get('token'),
          'content-type': 'application/json'
        }
      })
      .then(() => {
        dispatch(createUserSuccess('Account created'));
        dispatch(fetchUsers());
      })
      .catch((error) => {
      // If request is unauthenticated
        console.log(error);
        dispatch(createUserError(error.response.data.message));
      });
  };
}

export function createCruise({cruise_id, start_ts, stop_ts, cruise_location = '', cruise_pi = '', cruise_tags = [], cruise_hidden = false, cruise_additional_meta = {} }) {
  return function (dispatch) {
    axios.post(`${API_ROOT_URL}/api/v1/cruises`,
      {cruise_id, start_ts, stop_ts, cruise_location, cruise_pi, cruise_tags, cruise_hidden, cruise_additional_meta },
      {
        headers: {
          authorization: cookies.get('token'),
          'content-type': 'application/json'
        }
      }).then(() => {
      dispatch(createCruiseSuccess('Cruise created'));
      dispatch(fetchCruises());
    }).catch((error) => {

      // If request is unauthenticated
      console.log(error);
      dispatch(createCruiseError(error.response.data.message));
    });
  };
}

export function createLowering({lowering_id, start_ts, stop_ts, lowering_location = '', lowering_tags = [], lowering_hidden = false, lowering_additional_meta = {}  }) {
  return function (dispatch) {
    axios.post(`${API_ROOT_URL}/api/v1/lowerings`,
      {lowering_id, start_ts, stop_ts, lowering_location, lowering_tags, lowering_hidden, lowering_additional_meta },
      {
        headers: {
          authorization: cookies.get('token'),
          'content-type': 'application/json'
        }
      }).then(() => {
      dispatch(createLoweringSuccess('Lowering created'));
      dispatch(fetchLowerings());
    }).catch((error) => {
      
      // If request is unauthenticated
      console.log(error);
      dispatch(createLoweringError(error.response.data.message));
    });
  };
}

export function createEventTemplate(formProps) {

  let fields = {};

  fields.event_name = formProps.event_name;
  fields.event_value = formProps.event_value;
  fields.system_template = formProps.system_template;
  fields.template_disabled = formProps.template_disabled;
  fields.template_categories = formProps.template_categories;

  if(!formProps.event_free_text_required) {
    fields.event_free_text_required = false;
  } else {
    fields.event_free_text_required = formProps.event_free_text_required;
  }

  if(!formProps.event_options) {
    fields.event_options = [];
  } else {
    fields.event_options = formProps.event_options;
    fields.event_options = fields.event_options.map(event_option => {

      if(!event_option.event_option_allow_freeform) {
        event_option.event_option_allow_freeform = false;
      }

      if(!event_option.event_option_required) {
        event_option.event_option_required = false;
      }

      if(event_option.event_option_type === 'dropdown') {
        event_option.event_option_values = event_option.event_option_values.split(',');
        event_option.event_option_values = event_option.event_option_values.map(string => {
          return string.trim();
        });
      } else if(event_option.event_option_type === 'checkboxes') {
        event_option.event_option_values = event_option.event_option_values.split(',');
        event_option.event_option_values = event_option.event_option_values.map(string => {
          return string.trim();
        });
      } else if (event_option.event_option_type === 'text') {
        event_option.event_option_values = [];
      }

      return event_option;
    });
  }

  return function (dispatch)

  {
    axios.post(`${API_ROOT_URL}/api/v1/event_templates`,
      fields,
      {
        headers: {
          authorization: cookies.get('token')
        }
      }      
    )
      .then(() => {
        dispatch(fetchEventTemplates());
        dispatch(createEventTemplateSuccess('Event Template created'));
      })
      .catch((error) => {
        console.log(error);

        // If request is unauthenticated
        dispatch(createEventTemplateError(error.response.data.message));
      });
  };
}

export function updateProfile(formProps) {

  let fields = {};

  if(formProps.username) {
    fields.username = formProps.username;
  }

  if(formProps.fullname) {
    fields.fullname = formProps.fullname;
  }

  if(formProps.email) {
    fields.email = formProps.email;
  }

  if(formProps.password) {
    fields.password = formProps.password;
  }

  return function (dispatch) {
    axios.patch(`${API_ROOT_URL}/api/v1/users/${formProps.id}`,
      fields,
      {
        headers: {
          authorization: cookies.get('token')
        }
      }      
    )
      .then(() => {
        dispatch(updateProfileState());
        dispatch(updateProfileSuccess('Account updated'));

      })
      .catch((error) => {

        console.log(error);

        // If request is unauthenticated
        dispatch(updateProfileError(error.response.data.message));

      });
  };
}

export function showCruise(id) {

  let fields = { id: id, cruise_hidden: false };

  return async function (dispatch) {
    await axios.patch(`${API_ROOT_URL}/api/v1/cruises/${id}`,
      fields,
      {
        headers: {
          authorization: cookies.get('token')
        }
      }      
    ).then(() => {
      dispatch(fetchCruises());
      dispatch(updateCruiseSuccess('Cruise updated'));
    }).catch((error) => {
      console.log(error);
      dispatch(updateCruiseError(error.response.data.message));
    });
  };
}

export function hideCruise(id) {

  let fields = { id: id, cruise_hidden: true };

  return async function (dispatch) {
    await axios.patch(`${API_ROOT_URL}/api/v1/cruises/${id}`,
      fields,
      {
        headers: {
          authorization: cookies.get('token')
        }
      }      
    ).then(() => {
      dispatch(fetchCruises());
      dispatch(updateCruiseSuccess('Cruise updated'));
    }).catch((error) => {
      console.log(error);
      dispatch(updateCruiseError(error.response.data.message));
    });
  };
}

export function updateCruise(formProps) {

  let fields = {};

  if(formProps.cruise_id) {
    fields.cruise_id = formProps.cruise_id;
  }

  if(formProps.cruise_location) {
    fields.cruise_location = formProps.cruise_location;
  } else {
    fields.cruise_location = '';
  }

  if(formProps.cruise_pi) {
    fields.cruise_pi = formProps.cruise_pi;
  }

  if(formProps.cruise_tags) {
    fields.cruise_tags = formProps.cruise_tags;
  } else {
    fields.cruise_tags = [];
  }

  if(formProps.start_ts) {
    fields.start_ts = formProps.start_ts;
  }

  if(formProps.stop_ts) {
    fields.stop_ts = formProps.stop_ts;
  }

  if(typeof(formProps.cruise_hidden) !== "undefined") {
    fields.cruise_hidden = formProps.cruise_hidden;
  }

  // if(formProps.cruise_access_list) {
  //   fields.cruise_access_list = formProps.cruise_access_list;
  // }
  
  if(formProps.cruise_additional_meta) {
    fields.cruise_additional_meta = formProps.cruise_additional_meta;
  }

  return async function (dispatch) {
    await axios.patch(`${API_ROOT_URL}/api/v1/cruises/${formProps.id}`,
      fields,
      {
        headers: {
          authorization: cookies.get('token')
        }
      }      
    ).then(() => {
      dispatch(fetchCruises());
      dispatch(updateCruiseSuccess('Cruise updated'));
    }).catch((error) => {
      console.log(error);
      dispatch(updateCruiseError(error.response.data.message));
    });
  };
}

export function hideLowering(id) {

  let fields = { id: id, lowering_hidden: true };

  return async function (dispatch) {
    await axios.patch(`${API_ROOT_URL}/api/v1/lowerings/${id}`,
      fields,
      {
        headers: {
          authorization: cookies.get('token')
        }
      }      
    ).then(() => {
      dispatch(fetchLowerings());
      dispatch(updateLoweringSuccess('Lowering updated'));
    }).catch((error) => {
      console.log(error);
      dispatch(updateLoweringError(error.response.data.message));
    });
  };
}

export function showLowering(id) {

  let fields = { id: id, lowering_hidden: false };

  return async function (dispatch) {
    await axios.patch(`${API_ROOT_URL}/api/v1/lowerings/${id}`,
      fields,
      {
        headers: {
          authorization: cookies.get('token')
        }
      }      
    ).then(() => {
      dispatch(fetchLowerings());
      dispatch(updateLoweringSuccess('Lowering updated'));
    }).catch((error) => {
      console.log(error);
      dispatch(updateLoweringError(error.response.data.message));
    });
  };
}

export function updateLowering(formProps) {

  let fields = {};

  if(formProps.lowering_id) {
    fields.lowering_id = formProps.lowering_id;
  }

  if(formProps.lowering_location) {
    fields.lowering_location = formProps.lowering_location;
  } else {
    fields.lowering_location = '';
  }

  if(formProps.lowering_tags) {
    fields.lowering_tags = formProps.lowering_tags;
  } else {
    fields.lowering_tags = [];
  }

  if(formProps.start_ts) {
    fields.start_ts = formProps.start_ts;
  }

  if(formProps.stop_ts) {
    fields.stop_ts = formProps.stop_ts;
  }

  if(typeof(formProps.lowering_hidden) !== "undefined") {
    fields.lowering_hidden = formProps.lowering_hidden;
  }

  // if(formProps.lowering_access_list) {
  //   fields.lowering_access_list = formProps.lowering_access_list;
  // }

  if(formProps.lowering_additional_meta) {
    fields.lowering_additional_meta = formProps.lowering_additional_meta;
  }

  return function (dispatch) {
    axios.patch(`${API_ROOT_URL}/api/v1/lowerings/${formProps.id}`,
      fields,
      {
        headers: {
          authorization: cookies.get('token')
        }
      }      
    ).then(() => {
      dispatch(fetchLowerings());
      dispatch(updateLoweringSuccess('Lowering updated'));
    }).catch((error) => {
      console.log(error);
      dispatch(updateLoweringError(error.response.data.message));
    });
  };
}

export function updateUser(formProps) {

  let fields = {};

  if(formProps.username) {
    fields.username = formProps.username;
  }

  if(formProps.fullname) {
    fields.fullname = formProps.fullname;
  }

  if(formProps.email) {
    fields.email = formProps.email;
  }

  if(formProps.password) {
    fields.password = formProps.password;
  }

  if(formProps.roles) {
    fields.roles = formProps.roles;
  }

  if(formProps.disabled) {
    fields.disabled = formProps.disabled;
  } else {
    fields.disabled = false;
  }

  if(formProps.system_user) {
    fields.system_user = formProps.system_user;
  } else {
    fields.system_user = false;
  }

  return function (dispatch) {
    axios.patch(`${API_ROOT_URL}/api/v1/users/${formProps.id}`,
      fields,
      {
        headers: {
          authorization: cookies.get('token')
        }
      }      
    ).then(() => {
      dispatch(fetchUsers());
      dispatch(updateUserSuccess('Account updated'));
    }).catch((error) => {
      console.log(error);

      // If request is unauthenticated
      dispatch(updateUserError(error.response.data.message));
    });
  };
}

export function updateEventTemplate(formProps) {

  let fields = {};

  fields.event_name = formProps.event_name;
  fields.event_value = formProps.event_value;
  fields.template_disabled = formProps.template_disabled;
  fields.template_categories = formProps.template_categories;

  if(!formProps.event_free_text_required) {
    fields.event_free_text_required = false;
  } else {
    fields.event_free_text_required = formProps.event_free_text_required;
  }

  if(!formProps.system_template) {
    fields.system_template = false;
  } else {
    fields.system_template = formProps.system_template;
  }

  if(!formProps.event_options) {
    fields.event_options = [];
  } else {
    fields.event_options = formProps.event_options;
    fields.event_options = fields.event_options.map(event_option => {

      if(!event_option.event_option_allow_freeform) {
        event_option.event_option_allow_freeform = false;
      }

      if(!event_option.event_option_required) {
        event_option.event_option_required = false;
      }

      if(event_option.event_option_type === 'dropdown') {
        event_option.event_option_values = event_option.event_option_values.split(',');
        event_option.event_option_values = event_option.event_option_values.map(string => {
          return string.trim();
        });
      } else if(event_option.event_option_type === 'checkboxes') {
        event_option.event_option_values = event_option.event_option_values.split(',');
        event_option.event_option_values = event_option.event_option_values.map(string => {
          return string.trim();
        });
      } else if (event_option.event_option_type === 'text') {
        event_option.event_option_values = [];
      }

      return event_option;
    });
  }

  return function (dispatch)

  {
    axios.patch(`${API_ROOT_URL}/api/v1/event_templates/${formProps.id}`,
      fields,
      {
        headers: {
          authorization: cookies.get('token')
        }
      }      
    ).then(() => {
      dispatch(fetchEventTemplates());
      dispatch(updateEventTemplateSuccess('Event template updated'));
    }).catch((error) => {
      console.log(error);

      // If request is unauthenticated
      dispatch(updateEventTemplateError(error.response.data.message));
    });
  };
}

export function deleteCruise(id) {

  return function (dispatch, getState) {
    axios.delete(`${API_ROOT_URL}/api/v1/cruises/${id}`,
      {
        headers: {
          authorization: cookies.get('token')
        }
      }      
    ).then(() => {
      dispatch(fetchCruises());

      if(getState().cruise.cruise.id === id) {
        dispatch(leaveUpdateCruiseForm());
      }
    }).catch((error) => {
      console.log(error);
    });
  };
}

export function deleteLowering(id) {

  return function (dispatch, getState) {
    axios.delete(`${API_ROOT_URL}/api/v1/lowerings/${id}`,
      {
        headers: {
          authorization: cookies.get('token')
        }
      }      
    ).then(() => {
      dispatch(fetchLowerings());

      if(getState().lowering.lowering.id === id) {
        dispatch(leaveUpdateLoweringForm());
      }
    }).catch((error) => {
      console.log(error);
    });
  };
}

export function deleteUser(id) {

  return function (dispatch) {
    axios.delete(`${API_ROOT_URL}/api/v1/users/${id}`,
      {
        headers: {
          authorization: cookies.get('token')
        }
      }      
    ).then(() => {
      dispatch(fetchUsers());
    }).catch((error) => {
      console.log(error);
    });
  };
}

export function deleteEventTemplate(id) {

  return function (dispatch) {
    axios.delete(`${API_ROOT_URL}/api/v1/event_templates/${id}`,
      {
        headers: {
          authorization: cookies.get('token')
        }
      }      
    ).then(() => {
      dispatch(fetchEventTemplates());
    }).catch((error) => {
      console.log(error);
    });
  };
}

export function logout() {
  return function(dispatch) {
    cookies.remove('token', { path: '/' });
    cookies.remove('id', { path: '/' });
    dispatch(push(`/login`));
    return dispatch({type: UNAUTH_USER });
  };
}

export function switch2Guest(reCaptcha = null) {
  return function(dispatch) {
    dispatch(login( { username:"guest", password: "", reCaptcha } ) );
  };
}

export function authSuccess(message) {
  return {
    type: AUTH_SUCCESS,
    payload: message
  };
}

export function authError(error) {
  return {
    type: AUTH_ERROR,
    payload: error
  };
}

export function createCruiseSuccess(message) {
  return {
    type: CREATE_CRUISE_SUCCESS,
    payload: message
  };
}

export function createCruiseError(message) {
  return {
    type: CREATE_CRUISE_ERROR,
    payload: message
  };
}

export function createLoweringSuccess(message) {
  return {
    type: CREATE_LOWERING_SUCCESS,
    payload: message
  };
}

export function createLoweringError(message) {
  return {
    type: CREATE_LOWERING_ERROR,
    payload: message
  };
}

export function createUserSuccess(message) {
  return {
    type: CREATE_USER_SUCCESS,
    payload: message
  };
}

export function createUserError(message) {
  return {
    type: CREATE_USER_ERROR,
    payload: message
  };
}

export function createEventTemplateSuccess(message) {
  return {
    type: CREATE_EVENT_TEMPLATE_SUCCESS,
    payload: message
  };
}

export function createEventTemplateError(message) {
  return {
    type: CREATE_EVENT_TEMPLATE_ERROR,
    payload: message
  };
}

export function registerUserSuccess(message) {
  return {
    type: REGISTER_USER_SUCCESS,
    payload: message
  };
}

export function registerUserError(message) {
  return {
    type: REGISTER_USER_ERROR,
    payload: message
  };
}

export function updateProfileSuccess(message) {
  return {
    type: UPDATE_PROFILE_SUCCESS,
    payload: message
  };
}

export function updateProfileError(message) {
  return {
    type: UPDATE_PROFILE_ERROR,
    payload: message
  };
}

export function updateCruiseSuccess(message) {
  return {
    type: UPDATE_CRUISE_SUCCESS,
    payload: message
  };
}

export function updateCruiseError(message) {
  return {
    type: UPDATE_CRUISE_ERROR,
    payload: message
  };
}

export function updateLoweringSuccess(message) {
  return {
    type: UPDATE_LOWERING_SUCCESS,
    payload: message
  };
}

export function updateLoweringError(message) {
  return {
    type: UPDATE_LOWERING_ERROR,
    payload: message
  };
}

export function updateUserSuccess(message) {
  return {
    type: UPDATE_USER_SUCCESS,
    payload: message
  };
}

export function updateUserError(message) {
  return {
    type: UPDATE_USER_ERROR,
    payload: message
  };
}

export function fetchUsers() {

  const request = axios.get(API_ROOT_URL + '/api/v1/users', {
    headers: {
      authorization: cookies.get('token')
    }
  });

  return function (dispatch) {
    
    request.then(({data}) => {
      dispatch({type: FETCH_USERS, payload: data});
    })
      .catch((error) => {
        if(error.response.status !== 404) {
          console.log(error);
        } else {
          dispatch({type: FETCH_USERS, payload: []});
        }
      });
  };
}

export function fetchCruises() {

  const request = axios.get(API_ROOT_URL + '/api/v1/cruises', {
    headers: {
      authorization: cookies.get('token')
    }
  });

  return function (dispatch) {
    
    request.then(({data}) => {
      dispatch({type: FETCH_CRUISES, payload: data});
    })
      .catch((error) => {
        if(error.response.status !== 404) {
          console.log(error);
        } else {
          dispatch({type: FETCH_CRUISES, payload: []});
        }
      });
  };
}

export function fetchLowerings() {

  const request = axios.get(API_ROOT_URL + '/api/v1/lowerings', {
    headers: {
      authorization: cookies.get('token')
    }
  });

  return function (dispatch) {
    
    request.then(({data}) => {
      dispatch({type: FETCH_LOWERINGS, payload: data});
    })
      .catch((error) => {
        if(error.response.status !== 404) {
          console.log(error);
        } else {
          dispatch({type: FETCH_LOWERINGS, payload: []});
        }
      });
  };
}


export function fetchCustomVars() {

  const request = axios.get(API_ROOT_URL + '/api/v1/custom_vars', {
    headers: {
      authorization: cookies.get('token')
    }
  });

  return async function (dispatch) {
    
    await request.then(({data}) => {
      dispatch({type: FETCH_CUSTOM_VARS, payload: data});
    }).catch((error) => {
      if(error.response.status !== 404) {
        console.log(error);
      } else {
        dispatch({type: FETCH_CUSTOM_VARS, payload: []});
      }
    });
  };
}

export function updateCustomVars(id, value) {
  
  return function(dispatch) {
    axios.patch(`${API_ROOT_URL}/api/v1/custom_vars/${id}`,
      value,
      {
        headers: {
          authorization: cookies.get('token')
        }
      }      
    ).then(() => {
      dispatch(fetchCustomVars());
    }).catch((error) => {
      console.log(error);
    });
  };
}

export function updateEventTemplateSuccess(message) {
  return {
    type: UPDATE_EVENT_TEMPLATE_SUCCESS,
    payload: message
  };
}

export function updateEventTemplateError(message) {
  return {
    type: UPDATE_EVENT_TEMPLATE_ERROR,
    payload: message
  };
}


export function fetchEventTemplatesForMain() {

  const request = axios.get(API_ROOT_URL + '/api/v1/event_templates', {
    headers: {
      authorization: cookies.get('token')
    }
  });

  return function (dispatch) {
    
    request.then(({data}) => {
      //console.log(data);
      dispatch({type: FETCH_EVENT_TEMPLATES_FOR_MAIN, payload: data});
    }).catch((error) => {
      if(error.response.status !== 404) {
        console.log(error);
      } else {
        dispatch({type: FETCH_EVENT_TEMPLATES_FOR_MAIN, payload: []});
      }
    });
  };
}

export function fetchFilteredEvents(filterParams={}) {

  let params = queryString.stringify(filterParams);
  //console.log(params);

  const request = axios.get(API_ROOT_URL + '/api/v1/events' + '?' + params, {
    headers: {
      authorization: cookies.get('token')
    },
  });

  return function (dispatch) {
    
    request.then(({data}) => {
      dispatch({type: FETCH_FILTERED_EVENTS, payload: data});
    }).catch((error) => {
      if(error.response.status !== 404) {
        console.log(error);
      } else {
        dispatch({type: FETCH_FILTERED_EVENTS, payload: []});
      }
    });
  };
}

export function fetchEvents() {

  const request = axios.get(API_ROOT_URL + '/api/v1/events', {
    headers: {
      authorization: cookies.get('token')
    },
  });

  return function (dispatch) {
    
    request.then(({data}) => {
      dispatch({type: FETCH_EVENTS, payload: data});
    }).catch((error) => {
      if(error.response.status !== 404) {
        console.log(error);
      } else {
        dispatch({type: FETCH_EVENTS, payload: []});
      }
    });
  };
}

export function fetchSelectedEvent(id) {
  
  return function(dispatch) {

    axios.get(`${API_ROOT_URL}/api/v1/event_exports/${id}`,
      {
        headers: {
          authorization: cookies.get('token')
        }
      }      
    ).then((response) => {
      // console.log("response:", response.data)
      dispatch({type: SET_SELECTED_EVENT, payload: response.data});
    }).catch((error) => {
      console.log(error);
      dispatch({type: SET_SELECTED_EVENT, payload: {}});
    });
  };
}

export function clearSelectedEvent() {
  return function(dispatch) {
    dispatch({type: CLEAR_SELECTED_EVENT, payload: null});
  };
}

export function clearEvents() {
  return function(dispatch) {
    dispatch({type: UPDATE_EVENTS, payload: []});
  };
}

export function fetchEventHistory(asnap = false) {

  let url = API_ROOT_URL + '/api/v1/events?sort=newest&limit=20';
  if(!asnap) {
    url = url + '&value=!ASNAP';
  }

  const request = axios.get(url, {
    headers: {
      authorization: cookies.get('token')
    },
  });

  return function (dispatch) {
    
    request.then(({data}) => {
      dispatch({type: FETCH_EVENT_HISTORY, payload: data});
    }).catch((error) => {
      if(error.response.status !== 404) {
        console.log(error);
      } else {
        dispatch({type: FETCH_EVENT_HISTORY, payload: []});
      }
    });
  };
}


export function fetchEventTemplates() {

  const request = axios.get(API_ROOT_URL + '/api/v1/event_templates', {
    headers: {
      authorization: cookies.get('token')
    }
  });

  return function (dispatch) {
    
    request.then(({data}) => {
      // console.log("data:", data)
      dispatch({type: FETCH_EVENT_TEMPLATES, payload: data});
    }).catch((error) => {
      if(error.response.data.statusCode === 404) {
        dispatch({type: FETCH_EVENT_TEMPLATES, payload: []});
      } else {
        console.log(error);
      }
    });
  };
}

export function initCruise(id) {
  return function (dispatch) {
    axios.get(`${API_ROOT_URL}/api/v1/cruises/${id}`,
      {
        headers: {
          authorization: cookies.get('token')
        }
      }).then((response) => {
      dispatch({ type: INIT_CRUISE, payload: response.data });
    }).catch((error)=>{
      console.log(error);
    });
  };
}

export function initCruiseFromLowering(id) {
  // console.log("initcruisefromlowering:", id)
  return function (dispatch) {
    axios.get(`${API_ROOT_URL}/api/v1/lowerings/${id}`,
    {
      headers: {
        authorization: cookies.get('token')
      }
    }).then((loweringResponse) => {
    // console.log("response:", loweringResponse.data)
      axios.get(`${API_ROOT_URL}/api/v1/cruises?startTS=${loweringResponse.data.start_ts}&stopTS=${loweringResponse.data.stop_ts}`,
      {
        headers: {
          authorization: cookies.get('token')
        }
      }).then((response) => {
        dispatch({ type: INIT_CRUISE, payload: response.data[0] });
      }).catch((error)=>{
        if(error.response.data.statusCode !== 404) {
          console.log(error);
        }
      });
    }).catch((error)=>{
      console.log(error);
    });
  };
}

export function initLowering(id) {
  return function (dispatch) {
    axios.get(`${API_ROOT_URL}/api/v1/lowerings/${id}`,
      {
        headers: {
          authorization: cookies.get('token')
        }
      }).then((response) => {
      dispatch({ type: INIT_LOWERING, payload: response.data });
    }).catch((error)=>{
      console.log(error);
    });
  };
}

export function initLoweringReplay(id, hideASNAP = false) {
  return function (dispatch) {
    dispatch(initLowering(id));
    dispatch({ type: EVENT_FETCHING, payload: true});

    let url = (hideASNAP)? `${API_ROOT_URL}/api/v1/events/bylowering/${id}?value=!ASNAP`: `${API_ROOT_URL}/api/v1/events/bylowering/${id}`;
    axios.get(url,
      {
        headers: {
          authorization: cookies.get('token')
        }
      }).then((response) => {
      dispatch({ type: INIT_EVENT, payload: response.data });
      if (response.data.length > 0){
        dispatch(advanceLoweringReplayTo(response.data[0].id));
      }
      dispatch({ type: EVENT_FETCHING, payload: false});
    }).catch((error)=>{
      if(error.response.data.statusCode !== 404) {
        console.log(error);
      }
      dispatch({ type: EVENT_FETCHING, payload: false});
    });
  };
}

export function advanceLoweringReplayTo(id) {
  return function (dispatch) {
    axios.get(`${API_ROOT_URL}/api/v1/event_exports/${id}`,
      {
        headers: {
          authorization: cookies.get('token')
        }
      }).then((response) => {
      dispatch({ type: SET_SELECTED_EVENT, payload: response.data });
    }).catch((err) => {
      console.log(err);
    });
  };
}

export function showASNAP() {
  return async function (dispatch) {
    await dispatch({type: SHOW_ASNAP});
  };
}

export function hideASNAP() {
  return async function (dispatch) {
    await dispatch({type: HIDE_ASNAP});
  };
}

export function updateEventFilterForm(formProps) {
  return async function (dispatch) {
    await dispatch({type: UPDATE_EVENT_FILTER_FORM, payload: formProps});
  };
}

export function updateEventHistory(update) {
  return function (dispatch) {
    dispatch({type: UPDATE_EVENT_HISTORY, payload: update});
  };
}

export function leaveLoginForm() {
  return function (dispatch) {
    dispatch({type: LEAVE_AUTH_LOGIN_FORM, payload: null});
  };
}

export function leaveUpdateProfileForm() {
  return function (dispatch) {
    dispatch({type: LEAVE_UPDATE_PROFILE_FORM, payload: null});
  };
}

export function leaveUpdateUserForm() {
  return function (dispatch) {
    dispatch({type: LEAVE_UPDATE_USER_FORM, payload: null});
  };
}

export function leaveCreateUserForm() {
  return function (dispatch) {
    dispatch({type: LEAVE_CREATE_USER_FORM, payload: null});
  };
}

export function leaveRegisterForm() {
  return function (dispatch) {
    dispatch({type: LEAVE_REGISTER_USER_FORM, payload: null});
  };
}

export function leaveUpdateEventTemplateForm() {
  return function (dispatch) {
    dispatch({type: LEAVE_UPDATE_EVENT_TEMPLATE_FORM, payload: null});
  };
}

export function leaveCreateEventTemplateForm() {
  return function (dispatch) {
    dispatch({type: LEAVE_CREATE_EVENT_TEMPLATE_FORM, payload: null});
  };
}

export function leaveUpdateCruiseForm() {
  return function (dispatch) {
    dispatch({type: LEAVE_UPDATE_CRUISE_FORM, payload: null});
  };
}

export function leaveCreateCruiseForm() {
  return function (dispatch) {
    dispatch({type: LEAVE_CREATE_CRUISE_FORM, payload: null});
  };
}

export function leaveUpdateLoweringForm() {
  return function (dispatch) {
    dispatch({type: LEAVE_UPDATE_LOWERING_FORM, payload: null});
  };
}

export function leaveCreateLoweringForm() {
  return function (dispatch) {
    dispatch({type: LEAVE_CREATE_LOWERING_FORM, payload: null});
  };
}

export function leaveEventFilterForm() {
  return function (dispatch) {
    dispatch({type: LEAVE_EVENT_FILTER_FORM, payload: null});
  };
}

export function clearSelectedCruise() {
  return function (dispatch) {
    dispatch({type: LEAVE_UPDATE_CRUISE_FORM, payload: null});
  };
}

export function clearSelectedLowering() {
  return function (dispatch) {
    dispatch({type: LEAVE_UPDATE_LOWERING_FORM, payload: null});
  };
}

export function showModal(modal, props) {
  return function(dispatch) {
    dispatch(show(modal, props));
  };
}

export function eventUpdate() {
  return function (dispatch, getState) {
    let startTS = (getState().event.eventFilter.startTS)? `startTS=${getState().event.eventFilter.startTS}` : '';
    let stopTS = (getState().event.eventFilter.stopTS)? `&stopTS=${getState().event.eventFilter.stopTS}` : '';
    let value = (getState().event.eventFilter.value)? `&value=${getState().event.eventFilter.value.split(',').join("&value=")}` : '';
    let author = (getState().event.eventFilter.author)? `&author=${getState().event.eventFilter.author.split(',').join("&author=")}` : '';
    let freetext = (getState().event.eventFilter.freetext)? `&freetext=${getState().event.eventFilter.freetext}` : '';
    let datasource = (getState().event.eventFilter.datasource)? `&datasource=${getState().event.eventFilter.datasource}` : '';

    dispatch({ type: EVENT_FETCHING, payload: true});
    axios.get(`${API_ROOT_URL}/api/v1/events?${startTS}${stopTS}${value}${author}${freetext}${datasource}`,
      {
        headers: {
          authorization: cookies.get('token')
        }
      }).then((response) => {
      dispatch({ type: UPDATE_EVENTS, payload: response.data });
      dispatch({ type: EVENT_FETCHING, payload: false});
    }).catch((error)=>{
      console.log(error);
      if(error.response.data.statusCode === 404) {
        dispatch({type: UPDATE_EVENTS, payload: []});
      } else {
        console.log(error.response);
      }
      dispatch({ type: EVENT_FETCHING, payload: false});
    });
  };
}

export function eventUpdateLoweringReplay(lowering_id, hideASNAP = false) {
  return function (dispatch, getState) {

    let startTS = (getState().event.eventFilter.startTS)? `startTS=${getState().event.eventFilter.startTS}` : '';
    let stopTS = (getState().event.eventFilter.stopTS)? `&stopTS=${getState().event.eventFilter.stopTS}` : '';
    let value = (getState().event.eventFilter.value)? `&value=${getState().event.eventFilter.value.split(',').join("&value=")}` : '';
    value = (hideASNAP)? `&value=!ASNAP${value}` : value;
    let author = (getState().event.eventFilter.author)? `&author=${getState().event.eventFilter.author.split(',').join("&author=")}` : '';
    let freetext = (getState().event.eventFilter.freetext)? `&freetext=${getState().event.eventFilter.freetext}` : '';
    let datasource = (getState().event.eventFilter.datasource)? `&datasource=${getState().event.eventFilter.datasource}` : '';

    dispatch({ type: EVENT_FETCHING, payload: true});
    axios.get(`${API_ROOT_URL}/api/v1/events/bylowering/${lowering_id}?${startTS}${stopTS}${value}${author}${freetext}${datasource}`,
      {
        headers: {
          authorization: cookies.get('token')
        }
      }).then((response) => {
      dispatch({ type: UPDATE_EVENTS, payload: response.data });
      if(response.data.length > 0) {
        dispatch(fetchSelectedEvent(response.data[0].id));
      }
      dispatch({ type: EVENT_FETCHING, payload: false});
    }).catch((error)=>{
      if(error.response.data.statusCode === 404) {
        dispatch({type: UPDATE_EVENTS, payload: []});
        dispatch({ type: SET_SELECTED_EVENT, payload: {} });

      } else {
        console.log(error);
      }
      dispatch({ type: EVENT_FETCHING, payload: false});
    });
  };
}

export function deleteAllEvents() {
  return function(dispatch) {
    // console.log("set active event to:", id)
    axios.delete(`${API_ROOT_URL}/api/v1/events/all`,
      {
        headers: {
          authorization: cookies.get('token')
        }
      }).then(() => {
      dispatch(fetchEventHistory());
    }).catch((error)=> {
      console.log(error.response);
    });
  };
}

export function deleteAllLowerings() {
  return function(dispatch) {
    axios.delete(`${API_ROOT_URL}/api/v1/lowerings/all`,
      {
        headers: {
          authorization: cookies.get('token')
        }
      }).then(() => {
      dispatch(fetchLowerings());
    }).catch((error)=> {
      console.log(error.response);
    });
  };
}

export function deleteAllCruises() {
  return function(dispatch) {
    axios.delete(`${API_ROOT_URL}/api/v1/cruises/all`,
      {
        headers: {
          authorization: cookies.get('token')
        }
      }).then(() => {
      dispatch(fetchCruises());
    }).catch((error)=> {
      console.log(error.response);
    });
  };
}

export function deleteAllNonSystemUsers() {
  return function(dispatch) {
    axios.get(`${API_ROOT_URL}/api/v1/users`,
      {
        headers: {
          authorization: cookies.get('token')
        }
      }).then((response) => {
      let promises = response.data.filter((user) => {
        if(!user.system_user) {
          return axios.delete(`${API_ROOT_URL}/api/v1/users/${user.id}`,
            {
              headers: {
                authorization: cookies.get('token')
              }
            }).then(() => {
            dispatch(fetchUsers());
          }).catch((error) => {
            console.log(error.response);
          });
        }
      });

      Promise.all(promises).then(()=> {
        dispatch(fetchUsers());
      });
    }).catch((error)=> {
      console.log(error.response);
    });
  };
}

export function deleteAllNonSystemEventTemplates() {
  return function(dispatch) {
    axios.get(`${API_ROOT_URL}/api/v1/event_templates`,
      {
        headers: {
          authorization: cookies.get('token')
        }
      }).then((response) => {
      let promises = response.data.filter((event_template) => {
        if(!event_template.system_template) {
          return axios.delete(`${API_ROOT_URL}/api/v1/event_templates/${event_template.id}`,
            {
              headers: {
                authorization: cookies.get('token')
              }
            }).then(() => {
            dispatch(fetchEventTemplates());
          }).catch((error)=> {
            console.log(error.response);
          });
        }
      });
      Promise.all(promises).then(()=> {
        dispatch(fetchEventTemplates());
      });
    }).catch((error)=> {
      console.log(error.response);
    });
  };
}

export function updateEventTemplateCategory(category) {
  return {
    type: UPDATE_EVENT_TEMPLATE_CATEGORY,
    payload: category
  };
}