import {
  INIT_EVENT,
  UPDATE_EVENT,
  UPDATE_EVENTS,
  UPDATE_EVENT_FILTER_FORM,
  LEAVE_EVENT_FILTER_FORM,
  SET_SELECTED_EVENT,
  EVENT_FETCHING,
  TOGGLE_ASNAP,

} from '../actions/types';

export default ( state={ selected_event: {}, events: [], eventFilter: {}, hideASNAP: false, fetching: false}, action) => {
  switch(action.type){

    case INIT_EVENT:
      return { ...state, events: action.payload, selected_event: action.payload[0] || {} };

    case UPDATE_EVENT:
      let updateEventEvent = action.payload;
      delete updateEventEvent.aux_data;

      let updateEventEvents = state.events.map((event) => {
        if(event.id === updateEventEvent.id) {
          return updateEventEvent;
        } else {
          return event;
        }
      });

      return { ...state, selected_event: action.payload, events: updateEventEvents };

    case UPDATE_EVENTS:
      let updateEventsSelectedEvent = action.payload.find((event) => {
        if(state.selected_event.id === event.id) {
          return state.selected_event;
        }
      }) || {};

      return { ...state, selected_event: updateEventsSelectedEvent, events: action.payload };

    case UPDATE_EVENT_FILTER_FORM:
      return { ...state, eventFilter: action.payload };

    case LEAVE_EVENT_FILTER_FORM:
      return { ...state, eventFilter: {} };

    case SET_SELECTED_EVENT:
      return { ...state, selected_event: action.payload};

    case EVENT_FETCHING:
      return { ...state, fetching: action.payload };

    case TOGGLE_ASNAP:
      const newASNAP = !state.hideASNAP
      return { ...state, hideASNAP: newASNAP};
  }

  return state;
}