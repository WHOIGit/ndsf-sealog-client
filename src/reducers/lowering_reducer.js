import {
  INIT_LOWERING,
  INIT_LOWERING_ERROR,
  UPDATE_LOWERING,
  UPDATE_LOWERING_SUCCESS,
  UPDATE_LOWERING_ERROR,
  LEAVE_UPDATE_LOWERING_FORM,
  CREATE_LOWERING_SUCCESS,
  CREATE_LOWERING_ERROR,
  LEAVE_CREATE_LOWERING_FORM,
  FETCH_LOWERINGS,

} from '../actions/types';

export default function(state={ lowerings: [], lowering: null, lowering_message: '', lowering_error: '', lowering_unauthorized: false }, action) {
  switch(action.type){

    case INIT_LOWERING:
      return { ...state, lowering: action.payload, lowering_message: '', lowering_error: '', lowering_unauthorized: false };

    case INIT_LOWERING_ERROR:
      return { ...state, lowering: null, lowering_error: action.payload.message, lowering_unauthorized: action.payload.unauthorized || false, lowering_message: '' };

    case UPDATE_LOWERING:
      return { ...state };

    case UPDATE_LOWERING_SUCCESS:
      return { ...state, lowering_error: '', lowering_message: action.payload };

    case UPDATE_LOWERING_ERROR:
      return { ...state, lowering_error: action.payload, lowering_message: '' };

    case LEAVE_UPDATE_LOWERING_FORM:
      return { ...state, lowering_error: '', lowering_message: '' };

    case CREATE_LOWERING_SUCCESS:
      return { ...state, lowering_error: '', lowering_message: action.payload };

    case CREATE_LOWERING_ERROR:
      return { ...state, lowering_error: action.payload, lowering_message: '' };

    case LEAVE_CREATE_LOWERING_FORM:
      return { ...state, lowering_error: '', lowering_message: '' };

    case FETCH_LOWERINGS:
      return { ...state, lowerings: action.payload };
  }    
  return state;
}