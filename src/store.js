import history from './history'
import { applyMiddleware, compose, createStore } from 'redux'
import { routerMiddleware } from 'connected-react-router'
import reduxThunk from 'redux-thunk'

import createRootReducer from './reducers'

export default function configureStore(preloadedState) {
  const store = createStore(
    createRootReducer(history), // root reducer with router state
    preloadedState,
    compose(
      applyMiddleware(
        routerMiddleware(history), // for dispatching history actions
        reduxThunk
        // ... other middlewares ...
      )
    )
  )

  return store
}
