import {
  INIT_CRUISE,
  UPDATE_CRUISE,
  UPDATE_CRUISE_SUCCESS,
  UPDATE_CRUISE_ERROR,
  LEAVE_UPDATE_CRUISE_FORM,
  CREATE_CRUISE_SUCCESS,
  CREATE_CRUISE_ERROR,
  LEAVE_CREATE_CRUISE_FORM,
  FETCH_CRUISES,

} from '../actions/types';

export default function(state={ cruise: {}, cruises: [], cruise_message: '', cruise_error: '' }, action) {
  switch(action.type){

    case INIT_CRUISE:
      return { ...state, cruise: action.payload, cruise_message: '', cruise_error: '' };

    case UPDATE_CRUISE:
      return { ...state, cruise: action.payload };

    case UPDATE_CRUISE_SUCCESS:
      return { ...state, cruise_error: '', cruise_message: action.payload };

    case UPDATE_CRUISE_ERROR:
      return { ...state, cruise_error: action.payload, cruise_message: '' };

    case LEAVE_UPDATE_CRUISE_FORM:
      return { ...state, cruise: {}, cruise_error: '', cruise_message: '' };

    case CREATE_CRUISE_SUCCESS:
      return { ...state, cruise_error: '', cruise_message: action.payload };

    case CREATE_CRUISE_ERROR:
      return { ...state, cruise_error: action.payload, cruise_message: '' };

    case LEAVE_CREATE_CRUISE_FORM:
      return { ...state, cruise_error: '', cruise_message: '' };

    case FETCH_CRUISES:
      let cruise = (state.cruise.id)? action.payload.find((cruise) => cruise.id === state.cruise.id) : {};
      return { ...state, cruise: cruise, cruises: action.payload };
  }    
  return state;
}