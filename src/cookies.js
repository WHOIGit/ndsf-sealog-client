import Cookies from 'universal-cookie'
import { ROOT_PATH, SERVER_TLS } from './client_settings'

const cookies = new Cookies(null, { path: ROOT_PATH, sameSite: SERVER_TLS ? 'None' : 'Lax', secure: SERVER_TLS })

export default cookies
