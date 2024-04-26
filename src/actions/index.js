import axios from 'axios';
import Cookies from 'universal-cookie';
import { push } from 'connected-react-router';
import { show } from 'redux-modal';
import { change, untouch } from 'redux-form';
import { API_ROOT_URL } from '../client_config';

import {
  AUTH_USER,
  UNAUTH_USER,
  AUTH_ERROR,
  AUTH_SUCCESS,
  CREATE_USER_SUCCESS,
  CREATE_USER_ERROR,
  REGISTER_USER_SUCCESS,
  REGISTER_USER_ERROR,
  LEAVE_REGISTER_USER_FORM,
  INIT_USER,
  UPDATE_USER_SUCCESS,
  UPDATE_USER_ERROR,
  LEAVE_USER_FORM,
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
  LEAVE_EVENT_TEMPLATE_FORM,
  CREATE_EVENT_TEMPLATE_SUCCESS,
  CREATE_EVENT_TEMPLATE_ERROR,
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
  LEAVE_CRUISE_FORM,
  CREATE_CRUISE_SUCCESS,
  CREATE_CRUISE_ERROR,
  FETCH_CRUISES,

} from './types';

const cookies = new Cookies();

const port = (window.location.port) ? ':' + window.location.port : '';
const resetURL = window.location.protocol + '//' + window.location.hostname + port + '/resetPassword/';

export const authorizationHeader = { 
  headers: {
    Authorization: 'Bearer ' + cookies.get('token')
  }
}

export function advanceCruiseReplayTo(id) {
  return async function (dispatch) {
    return await axios.get(`${API_ROOT_URL}/api/v1/event_exports/${id}`,
      {
        headers: { Authorization: 'Bearer ' + cookies.get('token') }
      }).then((response) => {
        return dispatch({ type: SET_SELECTED_EVENT, payload: response.data });
      }).catch((error) => {
        console.debug(error);
      });
  };
}

export function authError(error) {
  return {
    type: AUTH_ERROR,
    payload: error
  };
}

export function authSuccess(message) {
  return {
    type: AUTH_SUCCESS,
    payload: message
  };
}

export function autoLogin({loginToken, reCaptcha = null}) {

  const payload = (reCaptcha !== null)? {loginToken, reCaptcha} : {loginToken};

  return async function (dispatch) {
    return await axios.post(`${API_ROOT_URL}/api/v1/auth/login`, payload
      ).then(response => {
        // If request is good save the JWT token to a cookie
        cookies.set('token', response.data.token, { path: '/' });
        cookies.set('id', response.data.id, { path: '/' });

        dispatch({ type: AUTH_USER });
        return dispatch(updateProfileState());
      }).catch((error)=>{

        if(error.response && error.response.status !== 401) {
          // If request is unauthenticated
          return dispatch(authError(error.response.data.message));
        }
        else if(error.message == "Network Error") {
          return dispatch(authError("Unable to connect to server"));
        }

        return dispatch(authError(error.response.data.message));

      });
  };
}

export function clearEvents() {
  return function(dispatch) {
    return dispatch({type: UPDATE_EVENTS, payload: []});
  };
}

export function clearSelectedCruise() {
  return function (dispatch) {
    return dispatch({type: LEAVE_CRUISE_FORM, payload: null});
  };
}

export function clearSelectedEvent() {
  return function(dispatch) {
    return dispatch({type: CLEAR_SELECTED_EVENT, payload: null});
  };
}

export function createCruise(formProps) {
  
  let fields = { ...formProps };

  return async function (dispatch) {
    return await axios.post(`${API_ROOT_URL}/api/v1/cruises`, fields,
      {
        headers: { Authorization: 'Bearer ' + cookies.get('token') }
      }).then((response) => {
        dispatch(initCruise(response.data.insertedId));
        dispatch(createCruiseSuccess('Cruise created'));
        return dispatch(fetchCruises());
      }).catch((error) => {
        // If request is unauthenticated
        console.debug(error);
        return dispatch(createCruiseError(error.response.data.message));
      });
  };
}

export function createCruiseError(message) {
  return {
    type: CREATE_CRUISE_ERROR,
    payload: message
  };
}

export function createCruiseSuccess(message) {
  return {
    type: CREATE_CRUISE_SUCCESS,
    payload: message
  };
}

export function createEvent(eventValue, eventFreeText = '', eventOptions = [], eventTS = '', publish = true) {

  return async () => {
    try {
      const event = await createEventRequest(eventValue, eventFreeText, eventOptions, eventTS, publish);
      return event;
    } catch (error) {
      console.debug(error);
    }
  };
}

export async function createEventRequest(eventValue, eventFreeText, eventOptions, eventTS, publish) {

  let payload = {
    event_value: eventValue,
    event_free_text: eventFreeText,
    event_options: eventOptions,
    publish
  };

  if(eventTS.length > 0){
    payload.ts = eventTS;
  }

  const response = await axios.post(`${API_ROOT_URL}/api/v1/events`,
    payload,
    {
      headers: { Authorization: 'Bearer ' + cookies.get('token') }
    }).then((response) => {
      return response.data.insertedEvent;
    })
    .catch((error)=>{
      console.debug(error);
    });

  return response;
}

export function createEventTemplate(formProps) {

  let fields = { ...formProps };

  return async function (dispatch) {
    return await axios.post(`${API_ROOT_URL}/api/v1/event_templates`, fields,
      {
        headers: { Authorization: 'Bearer ' + cookies.get('token') }
      }).then((response) => {
        dispatch(initEventTemplate(response.data.insertedId));
        dispatch(createEventTemplateSuccess('Event Template created'));
        return dispatch(fetchEventTemplates());
      }).catch((error) => {
        console.debug(error);
        // If request is unauthenticated
        return dispatch(createEventTemplateError(error.response.data.message));
      });
  };
}

export function createEventTemplateError(message) {
  return {
    type: CREATE_EVENT_TEMPLATE_ERROR,
    payload: message
  };
}

export function createEventTemplateSuccess(message) {
  return {
    type: CREATE_EVENT_TEMPLATE_SUCCESS,
    payload: message
  };
}

export function createUser(formProps) {

  let fields = { ...formProps, resetURL };

  return async function (dispatch) {
    return await axios.post(`${API_ROOT_URL}/api/v1/users`, fields,
      {
        headers: { Authorization: 'Bearer ' + cookies.get('token') }
      }).then((response) => {
        dispatch(initUser(response.data.insertedId));
        dispatch(createUserSuccess('User created'));
        return dispatch(fetchUsers());
      }).catch((error) => {
      // If request is unauthenticated
        console.debug(error);
        return dispatch(createUserError(error.response.data.message));
      });
  };
}

export function createUserError(message) {
  return {
    type: CREATE_USER_ERROR,
    payload: message
  };
}

export function createUserSuccess(message) {
  return {
    type: CREATE_USER_SUCCESS,
    payload: message
  };
}

export function deleteAllCruises() {
  return async function(dispatch) {
    return await axios.delete(`${API_ROOT_URL}/api/v1/cruises/all`,
      {
        headers: { Authorization: 'Bearer ' + cookies.get('token') }
      }).then(() => {
        return dispatch(fetchCruises());
      }).catch((error)=> {
        console.debug(error.response);
      });
  };
}

export function deleteAllEvents() {
  return async function(dispatch) {
    return await axios.delete(`${API_ROOT_URL}/api/v1/events/all`,
      {
        headers: { Authorization: 'Bearer ' + cookies.get('token') }
      }).then(() => {
        return dispatch(fetchEventHistory());
      }).catch((error)=> {
        console.debug(error.response);
      });
  };
}

export function deleteAllNonSystemEventTemplates() {
  return async function(dispatch) {
    const event_templates = await axios.get(`${API_ROOT_URL}/api/v1/event_templates?system_template=false&sort=event_name`,
      {
        headers: { Authorization: 'Bearer ' + cookies.get('token') }
      }).then((response) => {
        return response.data;
      }).catch((error)=> {
        console.debug(error.response);
      });

    event_templates.map(async (event_template) => {
      return await dispatch(deleteEventTemplate(event_template.id, false));
      });

    return dispatch(fetchEventTemplates());
  };
}

export function deleteAllNonSystemUsers() {
  return async function(dispatch) {
    const users = await axios.get(`${API_ROOT_URL}/api/v1/users?system_user=false`,
      {
        headers: { Authorization: 'Bearer ' + cookies.get('token') }
      }).then((response) => {
        return response.data;
      }).catch((error) =>{
        console.debug(error.response);
      });

    users.map(async (user) => {
      return await dispatch(deleteUser(user.id, false));
      });

    return dispatch(fetchUsers());
  };
}

export function deleteCruise(id) {

  return async function (dispatch, getState) {
    return await axios.delete(`${API_ROOT_URL}/api/v1/cruises/${id}`,
      {
        headers: { Authorization: 'Bearer ' + cookies.get('token') }
      }).then(() => {
        if(getState().cruise.cruise.id === id) {
          dispatch(leaveCruiseForm());
        }
        
        return dispatch(fetchCruises());

      }).catch((error) => {
        console.debug(error);
      });
  };
}

export function deleteEvent(event_id) {

  return async () => {
    try {
      const response = await deleteEventRequest(event_id);
      return response;
    } catch (error) {
      console.debug(error);
    }
  };
}

export async function deleteEventRequest(event_id) {

  const response = await axios.delete(`${API_ROOT_URL}/api/v1/events/${event_id}`,
    {
      headers: { Authorization: 'Bearer ' + cookies.get('token') }
    }).then((response) => {
      return { response };
    }).catch((error)=>{
      console.debug(error);
    });

  return response;
}

export function deleteEventTemplate(id) {

  return async function (dispatch, getState) {
    return await axios.delete(`${API_ROOT_URL}/api/v1/event_templates/${id}`,
      {
        headers: { Authorization: 'Bearer ' + cookies.get('token') }
      }).then(() => {
        if(getState().event_template.event_template.id === id) {
          dispatch(leaveEventTemplateForm());
        }

        return dispatch(fetchEventTemplates());

      }).catch((error) => {
        console.debug(error);
      });
  };
}

export function deleteUser(id) {

  return async function (dispatch, getState) {
    return await axios.delete(`${API_ROOT_URL}/api/v1/users/${id}`,
      {
        headers: { Authorization: 'Bearer ' + cookies.get('token') }
      }).then(() => {
        if(getState().user.user.id === id) {
          dispatch(leaveUserForm());
        }

        return dispatch(fetchUsers());

      }).catch((error) => {
        console.debug(error);
      });
  };
}

export function eventUpdate() {
  return async function (dispatch, getState) {
    let startTS = (getState().event.eventFilter.startTS)? `startTS=${getState().event.eventFilter.startTS}` : '';
    let stopTS = (getState().event.eventFilter.stopTS)? `&stopTS=${getState().event.eventFilter.stopTS}` : '';
    let value = (getState().event.eventFilter.value)? `&value=${getState().event.eventFilter.value.split(',').join("&value=")}` : '';
    let author = (getState().event.eventFilter.author)? `&author=${getState().event.eventFilter.author.split(',').join("&author=")}` : '';
    let freetext = (getState().event.eventFilter.freetext)? `&freetext=${getState().event.eventFilter.freetext}` : '';
    let datasource = (getState().event.eventFilter.datasource)? `&datasource=${getState().event.eventFilter.datasource}` : '';

    dispatch({ type: EVENT_FETCHING, payload: true});
    return await axios.get(`${API_ROOT_URL}/api/v1/events?${startTS}${stopTS}${value}${author}${freetext}${datasource}`,
      {
        headers: { Authorization: 'Bearer ' + cookies.get('token') }
      }).then((response) => {
        dispatch({ type: UPDATE_EVENTS, payload: response.data });
        return dispatch({ type: EVENT_FETCHING, payload: false});
      }).catch((error)=>{
        console.debug(error);
        if(error.response.data.statusCode === 404) {
          dispatch({type: UPDATE_EVENTS, payload: []});
        } else {
          console.error(error.response);
        }
        return dispatch({ type: EVENT_FETCHING, payload: false});
      });
  };
}

export function eventUpdateCruiseReplay(cruise_id, hideASNAP = false) {
  return async function (dispatch, getState) {

    let startTS = (getState().event.eventFilter.startTS)? `startTS=${getState().event.eventFilter.startTS}` : '';
    let stopTS = (getState().event.eventFilter.stopTS)? `&stopTS=${getState().event.eventFilter.stopTS}` : '';
    let value = (getState().event.eventFilter.value)? `&value=${getState().event.eventFilter.value.split(',').join("&value=")}` : '';
    value = (hideASNAP)? `&value=!ASNAP${value}` : value;
    let author = (getState().event.eventFilter.author)? `&author=${getState().event.eventFilter.author.split(',').join("&author=")}` : '';
    let freetext = (getState().event.eventFilter.freetext)? `&freetext=${getState().event.eventFilter.freetext}` : '';
    let datasource = (getState().event.eventFilter.datasource)? `&datasource=${getState().event.eventFilter.datasource}` : '';

    dispatch({ type: EVENT_FETCHING, payload: true});
    return await axios.get(`${API_ROOT_URL}/api/v1/events/bycruise/${cruise_id}?${startTS}${stopTS}${value}${author}${freetext}${datasource}`,
      {
        headers: { Authorization: 'Bearer ' + cookies.get('token') }
      }).then((response) => {
        dispatch({ type: UPDATE_EVENTS, payload: response.data });
        if(response.data.length > 0) {
          dispatch(fetchSelectedEvent(response.data[0].id));
        }
        return dispatch({ type: EVENT_FETCHING, payload: false});
      }).catch((error)=>{
        if(error.response.data.statusCode === 404) {
          dispatch({type: UPDATE_EVENTS, payload: []});
          dispatch({ type: SET_SELECTED_EVENT, payload: {} });

        } else {
          console.debug(error);
        }
        return dispatch({ type: EVENT_FETCHING, payload: false});
      });
  };
}

export function fetchCruises() {

  return async function (dispatch) {
    return await axios.get(API_ROOT_URL + '/api/v1/cruises',
      {
        headers: { Authorization: 'Bearer ' + cookies.get('token') }
      }).then(({data}) => {
        return dispatch({type: FETCH_CRUISES, payload: data});
      }).catch((error) => {
        if(error.response.status === 404) {
          return dispatch({type: FETCH_CRUISES, payload: []});
        } else {
          console.debug(error);
        }
      });
  };
}

export function fetchCustomVars() {

  return async function (dispatch) {
    return await axios.get(API_ROOT_URL + '/api/v1/custom_vars',
      {
        headers: { Authorization: 'Bearer ' + cookies.get('token') }
      }).then(({data}) => {
        return dispatch({type: FETCH_CUSTOM_VARS, payload: data});
      }).catch((error) => {
        if(error.response.status === 404) {
          return dispatch({type: FETCH_CUSTOM_VARS, payload: []});
        } else {
          console.debug(error);
        }
      });
  };
}

export function fetchEventHistory(asnap=false, filter='', page=0) {

  const eventsPerPage = 20;

  let url = `${API_ROOT_URL}/api/v1/events?sort=newest&limit=${eventsPerPage}&offset=${eventsPerPage*page}`;
  if(!asnap) {
    url += '&value=!ASNAP';
  }

  if(filter != '') {
    filter.split(',').forEach((filter_item) => {
      filter_item.trim();
      url += '&value='+filter_item;
    })    
  }

  return async function (dispatch) {
    return await axios.get(url, { headers: { Authorization: 'Bearer ' + cookies.get('token') } }
    ).then(({data}) => {
      return dispatch({type: FETCH_EVENT_HISTORY, payload: data});
    }).catch((error) => {
      if(error.response.status === 404) {
        return dispatch({type: FETCH_EVENT_HISTORY, payload: []});
      } else {
        console.debug(error);
      }
    });
  };
}

export function fetchEventTemplates() {

  return async function (dispatch) {
    return await axios.get(API_ROOT_URL + '/api/v1/event_templates?sort=event_name',
      {
        headers: { Authorization: 'Bearer ' + cookies.get('token') }
      }).then(({data}) => {
        return dispatch({type: FETCH_EVENT_TEMPLATES, payload: data});
      }).catch((error) => {
        if(error.response.data.statusCode === 404) {
          return dispatch({type: FETCH_EVENT_TEMPLATES, payload: []});
        } else {
          console.debug(error);
        }
      });
  };
}

export function fetchEventTemplatesForMain() {

  return async function (dispatch) {
    return await axios.get(API_ROOT_URL + '/api/v1/event_templates?sort=event_name',
      {
        headers: { Authorization: 'Bearer ' + cookies.get('token') }
      }).then(({data}) => {
        return dispatch({type: FETCH_EVENT_TEMPLATES_FOR_MAIN, payload: data});
      }).catch((error) => {
        if(error.response.status === 404) {
          return dispatch({type: FETCH_EVENT_TEMPLATES_FOR_MAIN, payload: []});
        } else {
          console.debug(error);
        }
      });
  };
}

export function fetchEvents() {

  return async function (dispatch) {    
    return await axios.get(API_ROOT_URL + '/api/v1/events',
      {
        headers: { Authorization: 'Bearer ' + cookies.get('token') }
      }).then(({data}) => {
        return dispatch({type: FETCH_EVENTS, payload: data});
      }).catch((error) => {
        if(error.response.status === 404) {
          return dispatch({type: FETCH_EVENTS, payload: []});
        } else {
          console.debug(error);
        }
      });
  };
}

export function fetchFilteredEvents(filterParams={}) {

  let params = new URLSearchParams(filterParams).toString();

  return async function (dispatch) {
    return await axios.get(API_ROOT_URL + '/api/v1/events' + '?' + params,
      {
        headers: { Authorization: 'Bearer ' + cookies.get('token') }
      }).then(({data}) => {
        return dispatch({type: FETCH_FILTERED_EVENTS, payload: data});
      }).catch((error) => {
        if(error.response.status === 404) {
          return dispatch({type: FETCH_FILTERED_EVENTS, payload: []});
        } else {
          console.debug(error);
        }
      });
  };
}

export function fetchSelectedEvent(id) {
  
  return async function(dispatch) {
    return await axios.get(`${API_ROOT_URL}/api/v1/event_exports/${id}`,
      {
        headers: { Authorization: 'Bearer ' + cookies.get('token') }
      }).then((response) => {
        return dispatch({type: SET_SELECTED_EVENT, payload: response.data});
      }).catch((error) => {
        console.debug(error);
        return dispatch({type: SET_SELECTED_EVENT, payload: {}});
      });
  };
}

export function fetchUsers() {

  return async function (dispatch) {
    return await axios.get(API_ROOT_URL + '/api/v1/users',
      {
        headers: { Authorization: 'Bearer ' + cookies.get('token') }
      }).then(({data}) => {
        return dispatch({type: FETCH_USERS, payload: data});
      }).catch((error) => {
        if(error.response.status === 404) {
          return dispatch({type: FETCH_USERS, payload: []});
        } else {
          console.debug(error);
        }
      });
  };
}

export function forgotPassword({email, reCaptcha = null}) {

  const payload = (reCaptcha)? {email, resetURL, reCaptcha}: {email, resetURL};

  return async function (dispatch) {
    return await axios.post(`${API_ROOT_URL}/api/v1/auth/forgotPassword`, payload
      ).then(response => {
        return dispatch(authSuccess(response.data.message));
      }).catch((error)=>{
        console.debug(error);

        // If request is invalid
       return dispatch(authError(error.response.data.message));

      });
  };
}

export function gotoCruiseGallery(id) {

  return function (dispatch) {
    dispatch(initCruise(id));
    return dispatch(push(`/cruise_gallery/${id}`));
  };
}

export function gotoCruiseMap(id) {

  return function (dispatch) {
    dispatch(initCruise(id));
    return dispatch(push(`/cruise_map/${id}`));
  };
}

export function gotoCruiseMenu() {

  return function (dispatch) {
    return dispatch(push(`/cruise_menu`));
  };
}

export function gotoCruiseReplay(id) {

  return function (dispatch) {
    dispatch(initCruise(id));
    return dispatch(push(`/cruise_replay/${id}`));
  };
}

export function gotoCruiseReview(id) {

  return function (dispatch) {
    dispatch(initCruise(id));
    return dispatch(push(`/cruise_review/${id}`));
  };
}

export function gotoCruises() {

  return function (dispatch) {
    return dispatch(push(`/cruises`));
  };
}

export function gotoEventManagement() {

  return function (dispatch) {
    return dispatch(push(`/event_management`));
  };
}

export function gotoEventTemplates() {

  return function (dispatch) {
    return dispatch(push(`/event_templates`));
  };
}

export function gotoHome() {

  return function (dispatch) {
    return dispatch(push(`/`));
  };
}

export function gotoProfile() {

  return function (dispatch) {
    return dispatch(push(`/profile`));
  };
}

export function gotoTasks() {

  return function (dispatch) {
    return dispatch(push(`/tasks`));
  };
}

export function gotoUsers() {

  return function (dispatch) {
    return dispatch(push(`/users`));
  };
}

export function hideASNAP() {
  return function (dispatch) {
    return dispatch({type: HIDE_ASNAP});
  };
}

export function hideCruise(id) {

  let fields = { cruise_hidden: true };

  return async function (dispatch) {
    return await axios.patch(`${API_ROOT_URL}/api/v1/cruises/${id}`,
      fields,
      {
        headers: { Authorization: 'Bearer ' + cookies.get('token') }
      }).then(() => {
        return dispatch(fetchCruises());
      }).catch((error) => {
        console.debug(error);
        return dispatch(updateCruiseError(error.response.data.message));
      });
  };
}

export function initCruise(id) {
  return async function (dispatch) {
    return await axios.get(`${API_ROOT_URL}/api/v1/cruises/${id}`,
      {
        headers: { Authorization: 'Bearer ' + cookies.get('token') }
      }).then((response) => {
      return dispatch({ type: INIT_CRUISE, payload: response.data });
    }).catch((error)=>{
      console.debug(error);
    });
  };
}

export function initCruiseReplay(id, hideASNAP = false) {
  return async function (dispatch) {
    dispatch(initCruise(id));
    dispatch({ type: EVENT_FETCHING, payload: true});

    let url = (hideASNAP)? `${API_ROOT_URL}/api/v1/events/bycruise/${id}?value=!ASNAP`: `${API_ROOT_URL}/api/v1/events/bycruise/${id}`;

    return await axios.get(url,
      {
        headers: { Authorization: 'Bearer ' + cookies.get('token') }
      }).then((response) => {
        dispatch({ type: INIT_EVENT, payload: response.data });
        if (response.data.length > 0){
          dispatch(advanceCruiseReplayTo(response.data[0].id));
        }
        return dispatch({ type: EVENT_FETCHING, payload: false});
      }).catch((error)=>{
        if(error.response.data.statusCode !== 404) {
          console.debug(error);
        }
        return dispatch({ type: EVENT_FETCHING, payload: false});
      });
  };
}

export function initEventTemplate(id) {
  return async function (dispatch) {
    return await axios.get(`${API_ROOT_URL}/api/v1/event_templates/${id}`,
      {
        headers: { Authorization: 'Bearer ' + cookies.get('token') }
      }).then((response) => {
        response.data.event_options = response.data.event_options.map(event_option => {
          event_option.event_option_values = event_option.event_option_values.join(',');
          return event_option;
        });

        return dispatch({ type: INIT_EVENT_TEMPLATE, payload: response.data });
      }).catch((error)=>{
        console.debug(error);
      });
  };
}

export function initUser(id) {
  return async function (dispatch) {
    return await axios.get(`${API_ROOT_URL}/api/v1/users/${id}`,
      {
        headers: { Authorization: 'Bearer ' + cookies.get('token') }
      }).then((response) => {
        return dispatch({ type: INIT_USER, payload: response.data });
      }).catch((error)=>{
        console.debug(error);
      });
  };
}

export function leaveCruiseForm() {
  return function (dispatch) {
    return dispatch({type: LEAVE_CRUISE_FORM, payload: null});
  };
}

export function leaveEventFilterForm() {
  return function (dispatch) {
    return dispatch({type: LEAVE_EVENT_FILTER_FORM, payload: null});
  };
}

export function leaveEventTemplateForm() {
  return function (dispatch) {
    return dispatch({type: LEAVE_EVENT_TEMPLATE_FORM, payload: null});
  };
}

export function leaveLoginForm() {
  return function (dispatch) {
    return dispatch({type: LEAVE_AUTH_LOGIN_FORM, payload: null});
  };
}

export function leaveRegisterForm() {
  return function (dispatch) {
    return dispatch({type: LEAVE_REGISTER_USER_FORM, payload: null});
  };
}

export function leaveUpdateProfileForm() {
  return function (dispatch) {
    return dispatch({type: LEAVE_UPDATE_PROFILE_FORM, payload: null});
  };
}

export function leaveUserForm() {
  return function (dispatch) {
    return dispatch({type: LEAVE_USER_FORM, payload: null});
  };
}

export function login({username, password, reCaptcha = null}) {

  const payload = (reCaptcha !== null)? {username, password, reCaptcha} : {username, password};

  return async function (dispatch) {
    return await axios.post(`${API_ROOT_URL}/api/v1/auth/login`, payload
      ).then(response => {
        // If request is good save the JWT token to a cookie
        cookies.set('token', response.data.token, { path: '/' });
        cookies.set('id', response.data.id, { path: '/' });

        dispatch({ type: AUTH_USER });
        return dispatch(updateProfileState());
      }).catch((error)=>{

        if(error.response && error.response.status !== 401) {
          // If request is unauthenticated
          return dispatch(authError(error.response.data.message));
        }
        else if(error.message == "Network Error") {
          return dispatch(authError("Unable to connect to server"));
        }

        return dispatch(authError(error.response.data.message));
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

export function registerUser({username, fullname, password, email, reCaptcha = null}) {

  const payload = (reCaptcha !== null)? {username, fullname, password, email, reCaptcha} : {username, fullname, password, email};

  return async function (dispatch) {
    return await axios.post(`${API_ROOT_URL}/api/v1/auth/register`, payload
      ).then(() => {
        return dispatch(registerUserSuccess('User created'));
      }).catch((error) => {

        console.debug(error);

        // If request is unauthenticated
        return dispatch(registerUserError(error.response.data.message));

      });
  };
}

export function registerUserError(message) {
  return {
    type: REGISTER_USER_ERROR,
    payload: message
  };
}

export function registerUserSuccess(message) {
  return {
    type: REGISTER_USER_SUCCESS,
    payload: message
  };
}

export function resetFields(formName, fieldsObj) {
  return function (dispatch) {
    Object.keys(fieldsObj).forEach(fieldKey => {
      //reset the field's value
      dispatch(change(formName, fieldKey, fieldsObj[fieldKey]));

      //reset the field's error
      return dispatch(untouch(formName, fieldKey));
    });
  };
}

export function resetPassword({token, password, reCaptcha = null}) {
  
  const payload = (reCaptcha)? {token, password, reCaptcha}: {token, password};
  
  return async function (dispatch) {
    return await axios.patch(`${API_ROOT_URL}/api/v1/auth/resetPassword`, payload
      ).then(() => {
        return dispatch(authSuccess('Password Reset'));
      }).catch((error) => {

        console.debug(error);

        // If request is unauthenticated
        return dispatch(authError(error.response.data.message));

      });
  };
}

export function showASNAP() {
  return function (dispatch) {
    return dispatch({type: SHOW_ASNAP});
  };
}

export function showCruise(id) {

  let fields = { cruise_hidden: false };

  return async function (dispatch) {
    return await axios.patch(`${API_ROOT_URL}/api/v1/cruises/${id}`,
      fields,
      {
        headers: { Authorization: 'Bearer ' + cookies.get('token') }
      }).then(() => {
        return dispatch(fetchCruises());
      }).catch((error) => {
        console.debug(error);
        return dispatch(updateCruiseError(error.response.data.message));
      });
  };
}

export function showModal(modal, props) {
  return function(dispatch) {
    return dispatch(show(modal, props));
  };
}

export function switch2Guest(reCaptcha = null) {
  return function(dispatch) {
    return dispatch(login( { username:"guest", password: "", reCaptcha } ) );
  };
}

export function updateCruise(formProps) {

  let fields = { ...formProps};
  delete fields.id;

  return async function (dispatch) {
    await axios.patch(`${API_ROOT_URL}/api/v1/cruises/${formProps.id}`,
      fields,
      {
        headers: { Authorization: 'Bearer ' + cookies.get('token') }
      }).then(() => {
        dispatch(fetchCruises());
        return dispatch(updateCruiseSuccess('Cruise updated'));
      }).catch((error) => {
        console.debug(error);
        return dispatch(updateCruiseError(error.response.data.message));
      });
  };
}

export function updateCruiseError(message) {
  return {
    type: UPDATE_CRUISE_ERROR,
    payload: message
  };
}

export function updateCruiseReplayEvent(event_id) {

  return async function (dispatch) {
    
    return await axios.get(API_ROOT_URL + '/api/v1/events/' + event_id,
    {
      headers: { Authorization: 'Bearer ' + cookies.get('token') }
    }).then(({data}) => {
      return dispatch({type: UPDATE_EVENT, payload: data});
    }).catch((error) => {
      if(error.response.status !== 404) {
        console.debug(error);
      }
    });
  };
}

export function updateCruiseSuccess(message) {
  return {
    type: UPDATE_CRUISE_SUCCESS,
    payload: message
  };
}

export function updateCustomVars(id, value) {
  
  return async function(dispatch) {
    return await axios.patch(`${API_ROOT_URL}/api/v1/custom_vars/${id}`,
      value,
      {
        headers: { Authorization: 'Bearer ' + cookies.get('token') }
      }).then(() => {
        return dispatch(fetchCustomVars());
      }).catch((error) => {
        console.debug(error);
      });
  };
}

export function updateEvent(event_id, eventValue, eventFreeText = '', eventOptions = [], eventTS = '') {

  return async () => {
    try {
      const event = await updateEventRequest(event_id, eventValue, eventFreeText, eventOptions, eventTS);
      return event;
    } catch (error) {
      console.debug(error);
    }
  };
}

export function updateEventFilterForm(formProps) {
  return function (dispatch) {
    return dispatch({type: UPDATE_EVENT_FILTER_FORM, payload: formProps});
  };
}

export function updateEventHistory(update) {
  return function (dispatch) {
    return dispatch({type: UPDATE_EVENT_HISTORY, payload: update});
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
      headers: { Authorization: 'Bearer ' + cookies.get('token') }
    }).then((response) => {
      return { response };
    })
    .catch((error)=>{
      console.debug(error);
    });
  
  return response;
}

export function updateEventTemplate(formProps) {

  let fields = { ...formProps };
  delete fields.id;

  return async function (dispatch) {
    return await axios.patch(`${API_ROOT_URL}/api/v1/event_templates/${formProps.id}`,
      fields,
      {
        headers: { Authorization: 'Bearer ' + cookies.get('token') }
      }).then(() => {
        dispatch(fetchEventTemplates());
        return dispatch(updateEventTemplateSuccess('Event template updated'));
      }).catch((error) => {
        console.debug(error);

        // If request is unauthenticated
        return dispatch(updateEventTemplateError(error.response.data.message));
      });
  };
}

export function updateEventTemplateCategory(category) {
  return { type: UPDATE_EVENT_TEMPLATE_CATEGORY, payload: category };
}

export function updateEventTemplateError(message) {
  return {
    type: UPDATE_EVENT_TEMPLATE_ERROR,
    payload: message
  };
}

export function updateEventTemplateSuccess(message) {
  return {
    type: UPDATE_EVENT_TEMPLATE_SUCCESS,
    payload: message
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

  if(formProps.password) {
    fields.password = formProps.password;
  }

  return async function (dispatch) {
    return await axios.patch(`${API_ROOT_URL}/api/v1/users/${formProps.id}`,
      fields,
      {
        headers: { Authorization: 'Bearer ' + cookies.get('token') }
      }).then(() => {
        dispatch(updateProfileState());
        return dispatch(updateProfileSuccess('User updated'));
      }).catch((error) => {
        console.debug(error);

        // If request is unauthenticated
        return dispatch(updateProfileError(error.response.data.message));
      });
  };
}

export function updateProfileError(message) {
  return {
    type: UPDATE_PROFILE_ERROR,
    payload: message
  };
}

export function updateProfileState() {

  return async function (dispatch) {
    return await axios.get(`${API_ROOT_URL}/api/v1/auth/profile`, 
      {
        headers: { Authorization: 'Bearer ' + cookies.get('token') }
      }).then((response) => {
        return dispatch({ type: UPDATE_PROFILE, payload: response.data });
      }).catch((error)=>{
        console.debug(error);
      });
  };
}

export function updateProfileSuccess(message) {
  return {
    type: UPDATE_PROFILE_SUCCESS,
    payload: message
  };
}

export function updateUser(formProps) {

  let fields = { ...formProps};
  delete fields.id;

  return async function (dispatch) {
    return await axios.patch(`${API_ROOT_URL}/api/v1/users/${formProps.id}`,
      fields,
      {
        headers: { Authorization: 'Bearer ' + cookies.get('token') }
      }).then(() => {
        dispatch(fetchUsers());
        return dispatch(updateUserSuccess('User updated'));
      }).catch((error) => {
        console.debug(error);

        // If request is unauthenticated
        return dispatch(updateUserError(error.response.data.message));
      });
  };
}

export function updateUserError(message) {
  return {
    type: UPDATE_USER_ERROR,
    payload: message
  };
}

export function updateUserSuccess(message) {
  return {
    type: UPDATE_USER_SUCCESS,
    payload: message
  };
}

export function validateJWT() {

  const token = cookies.get('token');

  if(!token) {
    return function (dispatch) {
      dispatch({type: UNAUTH_USER});
    };
  }

  return async function (dispatch) {
    return await axios.get(`${API_ROOT_URL}/api/v1/auth/validate`,
      {
        headers: { Authorization: 'Bearer ' + cookies.get('token') }
      }).then(() => {
        return dispatch({type: AUTH_USER});
      }).catch(()=>{
        console.error("JWT is invalid, logging out");
        return dispatch(logout());
      });
  };
}
