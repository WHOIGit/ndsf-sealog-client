import axios from 'axios';
import Cookies from 'universal-cookie';
import { push } from 'connected-react-router';
import { show } from 'redux-modal';
import { change, untouch } from 'redux-form';
import { API_ROOT_URL } from '../client_config';

import {
  AUTH_ERROR,
  AUTH_SUCCESS,
  AUTH_USER,
  CLEAR_SELECTED_EVENT,
  CREATE_CRUISE_ERROR,
  CREATE_CRUISE_SUCCESS,
  CREATE_EVENT_TEMPLATE_ERROR,
  CREATE_EVENT_TEMPLATE_SUCCESS,
  CREATE_LOWERING_ERROR,
  CREATE_LOWERING_SUCCESS,
  CREATE_USER_ERROR,
  CREATE_USER_SUCCESS,
  EVENT_FETCHING,
  FETCH_CRUISES,
  FETCH_CUSTOM_VARS,
  FETCH_EVENT_HISTORY,
  FETCH_EVENT_TEMPLATES,
  FETCH_EVENT_TEMPLATES_FOR_MAIN,
  FETCH_EVENTS,
  FETCH_FILTERED_EVENTS,
  FETCH_LOWERINGS,
  FETCH_USERS,
  HIDE_ASNAP,
  INIT_CRUISE,
  INIT_EVENT,
  INIT_EVENT_TEMPLATE,
  INIT_LOWERING,
  INIT_USER,
  LEAVE_AUTH_LOGIN_FORM,
  LEAVE_CRUISE_FORM,
  LEAVE_EVENT_FILTER_FORM,
  LEAVE_EVENT_TEMPLATE_FORM,
  LEAVE_LOWERING_FORM,
  LEAVE_REGISTER_USER_FORM,
  LEAVE_UPDATE_PROFILE_FORM,
  LEAVE_USER_FORM,
  REGISTER_USER_ERROR,
  REGISTER_USER_SUCCESS,
  SET_SELECTED_EVENT,
  SHOW_ASNAP,
  UNAUTH_USER,
  UPDATE_CRUISE_ERROR,
  UPDATE_CRUISE_SUCCESS,
  UPDATE_EVENT,
  UPDATE_EVENT_FILTER_FORM,
  UPDATE_EVENT_HISTORY,
  UPDATE_EVENT_TEMPLATE_CATEGORY,
  UPDATE_EVENT_TEMPLATE_ERROR,
  UPDATE_EVENT_TEMPLATE_SUCCESS,
  UPDATE_EVENTS,
  UPDATE_LOWERING_ERROR,
  UPDATE_LOWERING_SUCCESS,
  UPDATE_PROFILE,
  UPDATE_PROFILE_ERROR,
  UPDATE_PROFILE_SUCCESS,
  UPDATE_USER_ERROR,
  UPDATE_USER_SUCCESS,

} from './types';

const cookies = new Cookies();

const port = (window.location.port) ? ':' + window.location.port : '';
const resetURL = window.location.protocol + '//' + window.location.hostname + port + '/resetPassword/';

export const authorizationHeader = { 
  headers: {
    Authorization: 'Bearer ' + cookies.get('token')
  }
}

export const advanceLoweringReplayTo = (id) => {
  return async (dispatch) => {
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

export const authError = (error) => {
  return {
    type: AUTH_ERROR,
    payload: error
  };
}

export const authSuccess = (message) => {
  return {
    type: AUTH_SUCCESS,
    payload: message
  };
}

export const autoLogin = ({loginToken, reCaptcha = null}) => {

  const payload = (reCaptcha !== null)? {loginToken, reCaptcha} : {loginToken};

  return async (dispatch) => {
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

export const clearEvents = () => {
  return (dispatch) => {
    return dispatch({type: UPDATE_EVENTS, payload: []});
  };
}

export const clearSelectedCruise = () => {
  return (dispatch) => {
    return dispatch({type: LEAVE_CRUISE_FORM, payload: null});
  };
}

export const clearSelectedEvent = () => {
  return (dispatch) => {
    return dispatch({type: CLEAR_SELECTED_EVENT, payload: null});
  };
}

export const clearSelectedLowering = () => {
  return (dispatch) => {
    return dispatch({type: LEAVE_LOWERING_FORM, payload: null});
  };
}

export const createCruise = (formProps) => {

  let fields = { ...formProps };

  return async (dispatch) => {
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

export const createCruiseError = (message) => {
  return {
    type: CREATE_CRUISE_ERROR,
    payload: message
  };
}

export const createCruiseSuccess = (message) => {
  return {
    type: CREATE_CRUISE_SUCCESS,
    payload: message
  };
}

export const createEvent = (eventValue, eventFreeText = '', eventOptions = [], eventTS = '', publish = true) => {

  return async () => {
    try {
      const event = await createEventRequest(eventValue, eventFreeText, eventOptions, eventTS, publish);
      return event;
    } catch (error) {
      console.debug(error);
    }
  };
}

export const createEventRequest = async (eventValue, eventFreeText, eventOptions, eventTS, publish) => {

  let payload = {
    event_value: eventValue,
    event_free_text: eventFreeText,
    event_options: eventOptions,
    publish
  };

  if(eventTS.length > 0){
    payload.ts = eventTS;
  }

  return await axios.post(`${API_ROOT_URL}/api/v1/events`,
    payload,
    {
      headers: { Authorization: 'Bearer ' + cookies.get('token') }
    }).then((response) => {
      return response.data.insertedEvent;
    })
    .catch((error)=>{
      console.debug(error);
    });
}

export const createEventTemplate = (formProps) => {

  let fields = { ...formProps };

  return async (dispatch) => {
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

export const createEventTemplateError = (message) => {
  return {
    type: CREATE_EVENT_TEMPLATE_ERROR,
    payload: message
  };
}

export const createEventTemplateSuccess = (message) => {
  return {
    type: CREATE_EVENT_TEMPLATE_SUCCESS,
    payload: message
  };
}

export const createLowering = (formProps) => {

  let fields = { ...formProps };

  return async (dispatch) => {
    return await axios.post(`${API_ROOT_URL}/api/v1/lowerings`, {fields},
      {
        headers: { Authorization: 'Bearer ' + cookies.get('token') }
      }).then((response) => {
        dispatch(initLowering(response.data.insertedId));
        dispatch(createLoweringSuccess('Lowering created'));
        return dispatch(fetchLowerings());
      }).catch((error) => {
        // If request is unauthenticated
        console.debug(error);
        return dispatch(createLoweringError(error.response.data.message));
      });
  };
}

export const createLoweringError = (message) => {
  return {
    type: CREATE_LOWERING_ERROR,
    payload: message
  };
}

export const createLoweringSuccess = (message) => {
  return {
    type: CREATE_LOWERING_SUCCESS,
    payload: message
  };
}

export const createUser = (formProps) => {

  let fields = { ...formProps, resetURL };

  return async (dispatch) => {
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

export const createUserError = (message) => {
  return {
    type: CREATE_USER_ERROR,
    payload: message
  };
}

export const createUserSuccess = (message) => {
  return {
    type: CREATE_USER_SUCCESS,
    payload: message
  };
}

export const deleteAllCruises = () => {
  return async (dispatch) => {
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

export const deleteAllEvents = () => {
  return async (dispatch) => {
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

export const deleteAllLowerings = () => {
  return async (dispatch) => {
    return await axios.delete(`${API_ROOT_URL}/api/v1/lowerings/all`,
      {
        headers: { Authorization: 'Bearer ' + cookies.get('token') }
      }).then(() => {
        return dispatch(fetchLowerings());
      }).catch((error)=> {
        console.debug(error.response);
      });
  };
}

export const deleteAllNonSystemEventTemplates = () => {
  return async (dispatch) => {
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

export const deleteAllNonSystemUsers = () => {
  return async (dispatch) => {
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

export const deleteCruise = (id) => {

  return async (dispatch, getState) => {
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

export const deleteEvent = (event_id) => {

  return async () => {
    try {
      return await deleteEventRequest(event_id);
    } catch (error) {
      console.debug(error);
    }
  };
}

export const deleteEventRequest = async (event_id) => {

  return await axios.delete(`${API_ROOT_URL}/api/v1/events/${event_id}`,
    {
      headers: { Authorization: 'Bearer ' + cookies.get('token') }
    }).then((response) => {
      return { response };
    }).catch((error)=>{
      console.debug(error);
    });
}

export const deleteEventTemplate = (id) => {

  return async (dispatch, getState) => {
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

export const deleteLowering = (id) => {

  return async (dispatch, getState) => {
    return await axios.delete(`${API_ROOT_URL}/api/v1/lowerings/${id}`,
      {
        headers: { Authorization: 'Bearer ' + cookies.get('token') }
      }).then(() => {
        if(getState().lowering.lowering.id === id) {
          dispatch(leaveLoweringForm());
        }

        return dispatch(fetchLowerings());

      }).catch((error) => {
        console.debug(error);
      });
  };
}

export const deleteUser = (id) => {

  return async (dispatch, getState) => {
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

export const eventUpdate = () => {
  return async (dispatch, getState) => {
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

export const eventUpdateLoweringReplay = (lowering_id, hideASNAP = false) => {
  return async (dispatch, getState) => {

    let startTS = (getState().event.eventFilter.startTS)? `startTS=${getState().event.eventFilter.startTS}` : '';
    let stopTS = (getState().event.eventFilter.stopTS)? `&stopTS=${getState().event.eventFilter.stopTS}` : '';
    let value = (getState().event.eventFilter.value)? `&value=${getState().event.eventFilter.value.split(',').join("&value=")}` : '';
    value = (hideASNAP)? `&value=!ASNAP${value}` : value;
    let author = (getState().event.eventFilter.author)? `&author=${getState().event.eventFilter.author.split(',').join("&author=")}` : '';
    let freetext = (getState().event.eventFilter.freetext)? `&freetext=${getState().event.eventFilter.freetext}` : '';
    let datasource = (getState().event.eventFilter.datasource)? `&datasource=${getState().event.eventFilter.datasource}` : '';

    dispatch({ type: EVENT_FETCHING, payload: true});
    return await axios.get(`${API_ROOT_URL}/api/v1/events/bylowering/${lowering_id}?${startTS}${stopTS}${value}${author}${freetext}${datasource}`,
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

export const fetchCruises = () => {

  return async (dispatch) => {
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

export const fetchCustomVars = () => {

  return async (dispatch) => {
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

export const fetchEventHistory = (asnap=false, filter='', page=0) => {

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

  return async (dispatch) => {
    return await axios.get(url,
      {
        headers: { Authorization: 'Bearer ' + cookies.get('token') }
      }).then(({data}) => {
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

export const fetchEvents = () => {

  return async (dispatch) => {
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

export const fetchEventTemplates = () => {

  return async (dispatch) => {
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

export const fetchEventTemplatesForMain = () => {

  return async (dispatch) => {
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

export const fetchFilteredEvents = (filterParams={}) => {

  let params = new URLSearchParams(filterParams).toString();

  return async (dispatch) => {
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

export const fetchLowerings = () => {

  return async (dispatch) => {
    return await axios.get(API_ROOT_URL + '/api/v1/lowerings',
      {
        headers: { Authorization: 'Bearer ' + cookies.get('token') }
      }).then(({data}) => {
        return dispatch({type: FETCH_LOWERINGS, payload: data});
      }).catch((error) => {
        console.debug(error);
      });
  };
}

export const fetchSelectedEvent = (id) => {

  return async (dispatch) => {
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

export const fetchUsers = () => {

  return async (dispatch) => {
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

export const forgotPassword = ({email, reCaptcha = null}) => {

  const payload = (reCaptcha)? {email, resetURL, reCaptcha}: {email, resetURL};

  return async (dispatch) => {
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

export const gotoCruiseMenu = () => {

  return (dispatch) => {
    return dispatch(push(`/cruise_menu`));
  };
}

export const gotoCruises = () => {

  return (dispatch) => {
    return dispatch(push(`/cruises`));
  };
}

export const gotoEventManagement = () => {

  return (dispatch) => {
    return dispatch(push(`/event_management`));
  };
}

export const gotoEventTemplates = () => {

  return (dispatch) => {
    return dispatch(push(`/event_templates`));
  };
}

export const gotoHome = () => {

  return (dispatch) => {
    return dispatch(push(`/`));
  };
}

export const gotoLoweringGallery = (id) => {

  return (dispatch) => {
    dispatch(initLowering(id));
    return dispatch(push(`/lowering_gallery/${id}`));
  };
}

export const gotoLoweringMap = (id) => {

  return (dispatch) => {
    dispatch(initLowering(id));
    return dispatch(push(`/lowering_map/${id}`));
  };
}

export const gotoLoweringReplay = (id) => {

  return (dispatch) => {
    dispatch(initLowering(id));
    return dispatch(push(`/lowering_replay/${id}`));
  };
}

export const gotoLoweringReview = (id) => {

  return (dispatch) => {
    dispatch(initLowering(id));
    return dispatch(push(`/lowering_review/${id}`));
  };
}

export const gotoLowerings = () => {

  return (dispatch) => {
    return dispatch(push(`/lowerings`));
  };
}

export const gotoProfile = () => {

  return (dispatch) => {
    return dispatch(push(`/profile`));
  };
}

export const gotoTasks = () => {

  return (dispatch) => {
    return dispatch(push(`/tasks`));
  };
}

export const gotoUsers = () => {

  return (dispatch) => {
    return dispatch(push(`/users`));
  };
}

export const hideASNAP = () => {
  return (dispatch) => {
    return dispatch({type: HIDE_ASNAP});
  };
}

export const hideCruise = (id) => {

  let fields = { cruise_hidden: true };

  return async (dispatch) => {
    return await axios.patch(`${API_ROOT_URL}/api/v1/cruises/${id}`, fields,
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

export const hideLowering = (id) => {

  let fields = { lowering_hidden: true };

  return async (dispatch) => {
    await axios.patch(`${API_ROOT_URL}/api/v1/lowerings/${id}`, fields,
      {
        headers: { Authorization: 'Bearer ' + cookies.get('token') }
      }).then(() => {
        return dispatch(fetchLowerings());
      }).catch((error) => {
        console.debug(error);
        return dispatch(updateLoweringError(error.response.data.message));
      });
  };
}

export const initCruise = (id) => {
  return async (dispatch) => {
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

export const initCruiseFromLowering = (id) => {

  return async (dispatch) => {
    return await axios.get(`${API_ROOT_URL}/api/v1/lowerings/${id}`,
      {
        headers: { Authorization: 'Bearer ' + cookies.get('token') }
      }).then(async (loweringResponse) => {

        return await axios.get(`${API_ROOT_URL}/api/v1/cruises?startTS=${loweringResponse.data.start_ts}&stopTS=${loweringResponse.data.stop_ts}`,
          {
            headers: { Authorization: 'Bearer ' + cookies.get('token') }
          }).then((response) => {
            return dispatch({ type: INIT_CRUISE, payload: response.data[0] });
          }).catch((error)=>{
            if(error.response.data.statusCode !== 404) {
              console.debug(error);
            }
          });
      }).catch((error)=>{
        console.debug(error);
      });
  };
}

export const initEventTemplate = (id) => {
  return async (dispatch) => {
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

export const initLowering = (id) => {
  return async (dispatch) => {
    return await axios.get(`${API_ROOT_URL}/api/v1/lowerings/${id}`,
      {
        headers: { Authorization: 'Bearer ' + cookies.get('token') }
      }).then((response) => {
        return dispatch({ type: INIT_LOWERING, payload: response.data });
      }).catch((error)=>{
        console.debug(error);
      });
  };
}

export const initLoweringReplay = (id, hideASNAP = false) => {
  return async (dispatch) => {
    dispatch(initLowering(id));
    dispatch({ type: EVENT_FETCHING, payload: true});

    let url = (hideASNAP)? `${API_ROOT_URL}/api/v1/events/bylowering/${id}?value=!ASNAP`: `${API_ROOT_URL}/api/v1/events/bylowering/${id}`;

    return await axios.get(url,
      {
        headers: { Authorization: 'Bearer ' + cookies.get('token') }
      }).then((response) => {
        dispatch({ type: INIT_EVENT, payload: response.data });
        if (response.data.length > 0){
          dispatch(advanceLoweringReplayTo(response.data[0].id));
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

export const initUser = (id) => {
  return async (dispatch) => {
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

export const leaveCruiseForm = () => {
  return (dispatch) => {
    return dispatch({type: LEAVE_CRUISE_FORM, payload: null});
  };
}

export const leaveEventFilterForm = () => {
  return (dispatch) => {
    return dispatch({type: LEAVE_EVENT_FILTER_FORM, payload: null});
  };
}

export const leaveEventTemplateForm = () => {
  return (dispatch) => {
    return dispatch({type: LEAVE_EVENT_TEMPLATE_FORM, payload: null});
  };
}

export const leaveLoginForm = () => {
  return (dispatch) => {
    return dispatch({type: LEAVE_AUTH_LOGIN_FORM, payload: null});
  };
}

export const leaveLoweringForm = () => {
  return (dispatch) => {
    return dispatch({type: LEAVE_LOWERING_FORM, payload: null});
  };
}

export const leaveRegisterForm = () => {
  return (dispatch) => {
    return dispatch({type: LEAVE_REGISTER_USER_FORM, payload: null});
  };
}

export const leaveUpdateProfileForm = () => {
  return (dispatch) => {
    return dispatch({type: LEAVE_UPDATE_PROFILE_FORM, payload: null});
  };
}

export const leaveUserForm = () => {
  return (dispatch) => {
    return dispatch({type: LEAVE_USER_FORM, payload: null});
  };
}

export const login = ({username, password, reCaptcha = null}) => {

  const payload = (reCaptcha !== null)? {username, password, reCaptcha} : {username, password};

  return async (dispatch) => {
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

export const logout = () => {
  return (dispatch) => {
    cookies.remove('token', { path: '/' });
    cookies.remove('id', { path: '/' });
    dispatch(push(`/login`));
    return dispatch({type: UNAUTH_USER });
  };
}

export const registerUser = ({username, fullname, password, email, reCaptcha = null}) => {

  const payload = (reCaptcha !== null)? {username, fullname, password, email, reCaptcha} : {username, fullname, password, email};

  return async (dispatch) => {
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

export const registerUserError = (message) => {
  return {
    type: REGISTER_USER_ERROR,
    payload: message
  };
}

export const registerUserSuccess = (message) => {
  return {
    type: REGISTER_USER_SUCCESS,
    payload: message
  };
}

export const resetFields = (formName, fieldsObj) => {
  return (dispatch) => {
    Object.keys(fieldsObj).forEach(fieldKey => {
      //reset the field's value
      dispatch(change(formName, fieldKey, fieldsObj[fieldKey]));

      //reset the field's error
      return dispatch(untouch(formName, fieldKey));
    });
  };
}

export const resetPassword = ({token, password, reCaptcha = null}) => {

  const payload = (reCaptcha)? {token, password, reCaptcha}: {token, password};

  return async (dispatch) => {
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

export const showASNAP = () => {
  return (dispatch) => {
    return dispatch({type: SHOW_ASNAP});
  };
}

export const showCruise = (id) => {

  let fields = { cruise_hidden: false };

  return async (dispatch) => {
    return await axios.patch(`${API_ROOT_URL}/api/v1/cruises/${id}`, fields,
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

export const showLowering = (id) => {

  let fields = { lowering_hidden: false };

  return async (dispatch) => {
    await axios.patch(`${API_ROOT_URL}/api/v1/lowerings/${id}`, fields,
      {
        headers: { Authorization: 'Bearer ' + cookies.get('token') }
      }).then(() => {
        return dispatch(fetchLowerings());
      }).catch((error) => {
        console.debug(error);
        return dispatch(updateLoweringError(error.response.data.message));
      });
  };
}

export const showModal = (modal, props) => {
  return (dispatch) => {
    return dispatch(show(modal, props));
  };
}

export const switch2Guest = (reCaptcha = null) => {
  return (dispatch) => {
    return dispatch(login( { username:"guest", password: "", reCaptcha } ) );
  };
}

export const updateCruise = (formProps) => {

  let fields = { ...formProps};
  delete fields.id;

  return async (dispatch) => {
    await axios.patch(`${API_ROOT_URL}/api/v1/cruises/${formProps.id}`, fields,
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

export const updateCruiseError = (message) => {
  return {
    type: UPDATE_CRUISE_ERROR,
    payload: message
  };
}

export const updateCruiseSuccess = (message) => {
  return {
    type: UPDATE_CRUISE_SUCCESS,
    payload: message
  };
}

export const updateCustomVars = (id, value) => {

  return async (dispatch) => {
    return await axios.patch(`${API_ROOT_URL}/api/v1/custom_vars/${id}`, value,
      {
        headers: { Authorization: 'Bearer ' + cookies.get('token') }
      }).then(() => {
        return dispatch(fetchCustomVars());
      }).catch((error) => {
        console.debug(error);
      });
  };
}

export const updateEvent = (event_id, eventValue, eventFreeText = '', eventOptions = [], eventTS = '') => {

  return async () => {
    try {
      return await updateEventRequest(event_id, eventValue, eventFreeText, eventOptions, eventTS);
    } catch (error) {
      console.debug(error);
    }
  };
}

export const updateEventFilterForm = (formProps) => {
  return (dispatch) => {
    return dispatch({type: UPDATE_EVENT_FILTER_FORM, payload: formProps});
  };
}

export const updateEventHistory = (update) => {
  return (dispatch) => {
    return dispatch({type: UPDATE_EVENT_HISTORY, payload: update});
  };
}

export const updateEventRequest = async (event_id, eventValue, eventFreeText = '', eventOptions = [], eventTS = '') => {

  let payload = {
    event_value: eventValue,
    event_free_text: eventFreeText,
    event_options: eventOptions
  };

  if(eventTS.length > 0){
    payload.ts = eventTS;
  }

  return await axios.patch(`${API_ROOT_URL}/api/v1/events/${event_id}`,
    payload,
    {
      headers: { Authorization: 'Bearer ' + cookies.get('token') }
    }).then((response) => {
      return { response };
    })
    .catch((error)=>{
      console.debug(error);
    });
}

export const updateEventTemplate = (formProps) => {

  let fields = { ...formProps };
  delete fields.id;

  return async (dispatch) => {
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

export const updateEventTemplateCategory = (category) => {
  return { type: UPDATE_EVENT_TEMPLATE_CATEGORY, payload: category };
}

export const updateEventTemplateError = (message) => {
  return {
    type: UPDATE_EVENT_TEMPLATE_ERROR,
    payload: message
  };
}

export const updateEventTemplateSuccess = (message) => {
  return {
    type: UPDATE_EVENT_TEMPLATE_SUCCESS,
    payload: message
  };
}

export const updateLowering = (formProps) => {

  let fields = { ...formProps };
  delete fields.id;

  return async (dispatch) => {
    return await axios.patch(`${API_ROOT_URL}/api/v1/lowerings/${formProps.id}`, fields,
      {
        headers: { Authorization: 'Bearer ' + cookies.get('token') }
      }).then(() => {
        dispatch(fetchLowerings());
        return dispatch(updateLoweringSuccess('Lowering updated'));
      }).catch((error) => {
        console.debug(error);
        return dispatch(updateLoweringError(error.response.data.message));
      });
  };
}

export const updateLoweringError = (message) => {
  return {
    type: UPDATE_LOWERING_ERROR,
    payload: message
  };
}

export const updateLoweringReplayEvent = (event_id) => {

  return async (dispatch) => {

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

export const updateLoweringSuccess = (message) => {
  return {
    type: UPDATE_LOWERING_SUCCESS,
    payload: message
  };
}

export const updateProfile = (formProps) => {

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

  return async (dispatch) => {
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

export const updateProfileError = (message) => {
  return {
    type: UPDATE_PROFILE_ERROR,
    payload: message
  };
}

export const updateProfileState = () => {

  return async (dispatch) => {
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

export const updateProfileSuccess = (message) => {
  return {
    type: UPDATE_PROFILE_SUCCESS,
    payload: message
  };
}

export const updateUser = (formProps) => {

  let fields = { ...formProps};
  delete fields.id;

  return async (dispatch) => {
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

export const updateUserError = (message) => {
  return {
    type: UPDATE_USER_ERROR,
    payload: message
  };
}

export const updateUserSuccess = (message) => {
  return {
    type: UPDATE_USER_SUCCESS,
    payload: message
  };
}

export const validateJWT = () => {

  const token = cookies.get('token');

  if(!token) {
    return (dispatch) => {
      dispatch({type: UNAUTH_USER});
    };
  }

  return async (dispatch) => {
    return await axios.get(`${API_ROOT_URL}/api/v1/auth/validate`,
      {
        headers: { Authorization: 'Bearer ' + cookies.get('token') }
      }).then(() => {
        return dispatch({type: AUTH_USER});
      }).catch(()=>{
        return dispatch(logout());
      });
  };
}
