import { combineReducers } from 'redux';
import { reducer as reduxFormReducer } from 'redux-form';
import { connectRouter } from 'connected-react-router';
import { reducer as modalReducer } from 'redux-modal';
import authReducer from './auth_reducer';
import cruiseReducer from './cruise_reducer';
import customVarReducer from './custom_var_reducer';
import eventReducer from './event_reducer';
import eventHistoryReducer from './event_history_reducer';
import eventTemplateReducer from './event_template_reducer';
import loweringReducer from './lowering_reducer';
import userReducer from './user_reducer';

export default (history) => combineReducers({
  form: reduxFormReducer,
  router: connectRouter(history),
  modal: modalReducer,
  auth: authReducer,
  cruise: cruiseReducer,
  custom_var: customVarReducer,
  event: eventReducer,
  event_history: eventHistoryReducer,
  event_template: eventTemplateReducer,
  lowering: loweringReducer,
  user: userReducer,
});