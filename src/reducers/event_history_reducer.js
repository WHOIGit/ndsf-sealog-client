import {
  FETCH_EVENT_TEMPLATES_FOR_MAIN,
  FETCH_EVENT_HISTORY,
  UPDATE_EVENT_HISTORY,
} from '../actions/types';

const historyLimit = 20;

export default function(state={event_templates: [], history: []}, action) {
  switch(action.type){
    case FETCH_EVENT_TEMPLATES_FOR_MAIN:
      return {...state, event_templates: action.payload };
    case FETCH_EVENT_HISTORY:
      if(action.payload.length > historyLimit) {
        action.payload = action.payload.slice(action.payload.length-historyLimit);
      }
      return { ...state, history: action.payload };
    case UPDATE_EVENT_HISTORY:

      let completeHistory = [];
      let event = state.history.find(event => event.id === action.payload.id);

      if(!event) {
        completeHistory = [action.payload, ...state.history ];
      } else {
        completeHistory = state.history.map(event => {
          return (event.id === action.payload.id)? action.payload : event;
        });
        completeHistory.sort((eventA, eventB) => {
          if (eventA.ts > eventB.ts) {
            return -1;
          }
          if (eventA.ts < eventB.ts) {
            return 1;
          }
          return 0;
        });
      }
      let recentHistory = [];
      if(completeHistory.length > historyLimit) {
        recentHistory = completeHistory.slice(0, historyLimit);
      } else {
        recentHistory = completeHistory;
      }
      return {...state, history: recentHistory };
  }
  return state;
}