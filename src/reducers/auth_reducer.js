import {
  AUTH_USER,
  UNAUTH_USER,
  AUTH_ERROR,
  AUTH_SUCCESS,
  LEAVE_AUTH_LOGIN_FORM,
  REFRESH_AUTH_LOGIN_FORM
} from '../actions/types';

export default ( state={ error: '', message: '', authenticated: false }, action) => {
  switch(action.type){
    case AUTH_USER:
      return { ...state, error: '', message: '', authenticated: true };

    case UNAUTH_USER:
      return { ...state, error: '', message: '', authenticated: false};

    case AUTH_ERROR:
      return { ...state, error: action.payload, message: '' };

    case AUTH_SUCCESS:
      return { ...state, error: '', message: action.payload };

    case REFRESH_AUTH_LOGIN_FORM:
      return { ...state, error: '', message: '' };

    case LEAVE_AUTH_LOGIN_FORM:
      return { ...state, error: '', message: '' };

  }
  return state;
}