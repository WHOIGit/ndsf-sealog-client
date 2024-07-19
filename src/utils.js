import { basename } from 'path'
import { API_ROOT_URL, ROOT_PATH, IMAGE_PATH } from './client_settings'

// This function constructs a URL to an image served by the Sealog server.
// Normally, this should correspond to the server's IMAGE_ROUTE setting
// (defined in routes/default.js).
//
// Override this function to serve images through alternate methods, such as a
// caching proxy.
//
// Credit rgov (WHOIGit/ndsf-sealog-client)
export const getImageUrl = (image_path) => {
  return `${API_ROOT_URL}${IMAGE_PATH}/${basename(image_path)}`
}

export const handleMissingImage = (ev) => {
  ev.target.src = `${window.location.protocol}//${window.location.hostname}:${window.location.port}${ROOT_PATH}images/noimage.jpeg`
}

export const toTitlecase = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export const generateRandomCharacters = (length) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length)
    result += characters[randomIndex]
  }
  return result
}
