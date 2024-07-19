import { createBrowserHistory } from 'history'
import { ROOT_PATH } from './client_settings'

const history = createBrowserHistory({ basename: ROOT_PATH })

export default history
