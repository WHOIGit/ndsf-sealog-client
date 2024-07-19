import {
  INIT_LOWERING,
  UPDATE_LOWERING,
  UPDATE_LOWERING_SUCCESS,
  UPDATE_LOWERING_ERROR,
  LEAVE_LOWERING_FORM,
  CREATE_LOWERING_SUCCESS,
  CREATE_LOWERING_ERROR,
  FETCH_LOWERINGS,

} from '../actions/types';

export default (state={ lowering: {}, lowerings: [], lowering_message: '', lowering_error: '' }, action) => {
  switch(action.type){

    case INIT_LOWERING:
      return { ...state, lowering: action.payload, lowering_message: '', lowering_error: '' };

    case UPDATE_LOWERING:
      return { ...state, lowering: action.payload };

    case UPDATE_LOWERING_SUCCESS:
      return { ...state, lowering_error: '', lowering_message: action.payload };

    case UPDATE_LOWERING_ERROR:
      return { ...state, lowering_error: action.payload, lowering_message: '' };

    case LEAVE_LOWERING_FORM:
      return { ...state, lowering: {}, lowering_error: '', lowering_message: '' };

    case CREATE_LOWERING_SUCCESS:
      return { ...state, lowering_error: '', lowering_message: action.payload };

    case CREATE_LOWERING_ERROR:
      return { ...state, lowering_error: action.payload, lowering_message: '' };

    case FETCH_LOWERINGS:
      const selected_lowering_id = (state.lowering.id) ? state.lowering.id : null;
      const lowering = (selected_lowering_id) ? action.payload.find((lowering) => lowering.id === selected_lowering_id) : {};
      return { ...state, lowering: lowering, lowerings: action.payload };
  }
  return state;
}