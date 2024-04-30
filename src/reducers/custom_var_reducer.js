import {
  FETCH_CUSTOM_VARS,
  UPDATE_CUSTOM_VAR,

} from '../actions/types';

export default ( state={ custom_vars: [] }, action) => {
  switch(action.type){

    case FETCH_CUSTOM_VARS:
      return { ...state, custom_vars: action.payload };

    case UPDATE_CUSTOM_VAR:
      return state;
  }
  return state;
}