import {
  INIT_EVENT,
  UPDATE_EVENT,
  UPDATE_EVENTS,
  UPDATE_EVENT_FILTER_FORM,
  LEAVE_EVENT_FILTER_FORM,
  SET_SELECTED_EVENT,
  EVENT_FETCHING,
  HIDE_ASNAP,
  SHOW_ASNAP

} from '../actions/types';

export default function( state={ selected_event: {}, events: [], eventFilter: {}, hideASNAP: false, fetching: false}, action) {
  switch(action.type){

    case INIT_EVENT:
      return { ...state, events: action.payload, selected_event: action.payload[0] };

    case UPDATE_EVENT:
      let newEvents = state.events.map((event) => {
        if(event.id === action.payload.id) {
          return action.payload;
        } else {
          return event;
        }
      });
      return { ...state, selected_event: {}, events: newEvents };

    case UPDATE_EVENTS:
      return { ...state, selected_event: {}, events: action.payload };

    case UPDATE_EVENT_FILTER_FORM:
      return { ...state, eventFilter: action.payload };

    case LEAVE_EVENT_FILTER_FORM:
      return { ...state, eventFilter: {} };

    case SET_SELECTED_EVENT:
      return { ...state, selected_event: action.payload};

    case EVENT_FETCHING:
      return { ...state, fetching: action.payload };

    case HIDE_ASNAP:
      return { ...state, hideASNAP: true };

    case SHOW_ASNAP:
      return { ...state, hideASNAP: false };
  }
  
  return state;
}