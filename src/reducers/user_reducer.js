import {
  INIT_PROFILE,
  UNAUTH_USER,
  UPDATE_PROFILE,
  UPDATE_PROFILE_SUCCESS,
  UPDATE_PROFILE_ERROR,
  LEAVE_UPDATE_PROFILE_FORM,
  INIT_USER,
  UPDATE_USER,
  UPDATE_USER_SUCCESS,
  UPDATE_USER_ERROR,
  LEAVE_USER_FORM,
  CREATE_USER_SUCCESS,
  CREATE_USER_ERROR,
  REGISTER_USER_SUCCESS,
  REGISTER_USER_ERROR,
  LEAVE_REGISTER_USER_FORM,
  FETCH_USERS
} from '../actions/types';

export default (state={ profile: {}, profile_error: '', profile_message: '', user: {}, user_error: '', user_message: '', users: [] }, action) => {
  switch(action.type){

    case UNAUTH_USER:
      return { ...state, profile: {} };

    case INIT_PROFILE:
      return { ...state, profile: action.payload, profile_error: '', profile_message: '' };

    case UPDATE_PROFILE:
      return { ...state, profile: action.payload };

    case UPDATE_PROFILE_SUCCESS:
      return { ...state, profile_error: '', profile_message: action.payload };

    case UPDATE_PROFILE_ERROR:
      return { ...state, profile_error: action.payload, profile_message: '' };

    case LEAVE_UPDATE_PROFILE_FORM:
      return { ...state, profile_error: '', profile_message: '' };

    case INIT_USER:
      return { ...state, user: action.payload, user_error: '', user_message: '' };

    case UPDATE_USER:
      return { ...state, user: action.payload };

    case UPDATE_USER_SUCCESS:
      return { ...state, user_error: '', user_message: action.payload };

    case UPDATE_USER_ERROR:
      return { ...state, user_error: action.payload, user_message: '' };

    case LEAVE_USER_FORM:
      return { ...state, user: {}, user_error: '', user_message: '' };

    case CREATE_USER_SUCCESS:
      return { ...state, user_error: '', user_message: action.payload };

    case CREATE_USER_ERROR:
      return { ...state, user_error: action.payload, user_message: '' };

    case REGISTER_USER_SUCCESS:
      return { ...state, register_error: '', register_message: action.payload };

    case REGISTER_USER_ERROR:
      return { ...state, register_error: action.payload, register_message: '' };

    case LEAVE_REGISTER_USER_FORM:
      return { ...state, register_error: '', register_message: '' };

    case FETCH_USERS:
      const selected_user_id = (state.user.id) ? state.user.id : null;
      const user = (selected_user_id) ? action.payload.find((user) => user.id === selected_user_id) : {};
      const profile = (state.profile.id && state.user.id === state.profile.id) ? user : state.profile;
      return { ...state, profile, user, users: action.payload };

  }
  return state;
}