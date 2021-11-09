// This file contains utility functions for making direct calls to the
// Sealog REST API.
//
// This is incomplete. Many components make their API calls directly, or use
// Redux actions defined in actions/index.js. The low-level calls should migrate
// to this file.

import axios from 'axios';
import Cookies from 'universal-cookie';
import { API_ROOT_URL } from './client_config';


const cookies = new Cookies();

// TODO:
// Set the Authorization header by default, so that we do not need to write it
// over and over again. We will have to update the token when the user logs in.
//
// axios.defaults.headers.common['Authorization'] = cookies.get('token');


export function getCruiseByLowering(id) {
  const url = `${API_ROOT_URL}/api/v1/cruises/bylowering/${id}`;
  return axios.get(url, { headers: { 'authorization': cookies.get('token') } })
    .catch((e) => console.error(e))
    .then((r) => r.data);
}

export function getLowering(id) {
  const url = `${API_ROOT_URL}/api/v1/lowerings/${id}`;
  return axios.get(url, { headers: { 'authorization': cookies.get('token') } })
    .catch((e) => console.error(e))
    .then((r) => r.data);
}
