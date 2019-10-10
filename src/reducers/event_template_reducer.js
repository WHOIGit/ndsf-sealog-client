import {
  INIT_EVENT_TEMPLATE,
  UPDATE_EVENT_TEMPLATE,
  UPDATE_EVENT_TEMPLATE_SUCCESS,
  UPDATE_EVENT_TEMPLATE_ERROR,
  LEAVE_UPDATE_EVENT_TEMPLATE_FORM,
  CREATE_EVENT_TEMPLATE,
  CREATE_EVENT_TEMPLATE_SUCCESS,
  CREATE_EVENT_TEMPLATE_ERROR,
  LEAVE_CREATE_EVENT_TEMPLATE_FORM,
  FETCH_EVENT_TEMPLATES,

} from '../actions/types';

export default function(state={ event_template: {}, event_templates: [], event_template_error: '', event_template_message: '' }, action) {

  switch(action.type){

    case INIT_EVENT_TEMPLATE:
      return { ...state, event_template: action.payload };

    case UPDATE_EVENT_TEMPLATE:
      return { ...state, event_template: action.payload };

    case UPDATE_EVENT_TEMPLATE_SUCCESS:
      return { ...state, event_template_error: '', event_template_message: action.payload };

    case UPDATE_EVENT_TEMPLATE_ERROR:
      return { ...state, event_template_error: action.payload, event_template_message: '' };

    case LEAVE_UPDATE_EVENT_TEMPLATE_FORM:
      return { ...state, event_template: {}, event_template_error: '', event_template_message: '' };

    case CREATE_EVENT_TEMPLATE:
      return { ...state, event_template: action.payload };

    case CREATE_EVENT_TEMPLATE_SUCCESS:
      return { ...state, event_template_error: '', event_template_message: action.payload };

    case CREATE_EVENT_TEMPLATE_ERROR:
      return { ...state, event_template_error: action.payload, event_template_message: '' };

    case LEAVE_CREATE_EVENT_TEMPLATE_FORM:
      return { ...state, event_template_error: '', event_template_message: '' };

    case FETCH_EVENT_TEMPLATES:
      return { ...state, event_templates: action.payload };

  }    
  return state;
}