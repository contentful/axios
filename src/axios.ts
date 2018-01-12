'use strict'

import { extend, merge, bind } from 'lodash'
import Axios from './core/Axios'
import defaults from './defaults'

export type DefaultAxios = Axios & {
  create: (instanceConfig: any) => Axios
}

// Create the default instance to be exported
let axios = new Axios(defaults) as DefaultAxios

// TODO: remove me, this is bad practice
// Expose defaults for assigning defaults via object mutation
axios.defaults = defaults

/**
 * Create an instance of Axios
 *
 * @param {Object} defaultConfig The default config for the instance
 * @return {Axios} A new instance of Axios
 */
axios.create = function create (instanceConfig) {
  return new Axios(merge(defaults, instanceConfig))
}

// Expose Cancel & CancelToken
import Cancel from './cancel/Cancel'
import CancelToken from './cancel/CancelToken'
import isCancel from './cancel/isCancel'

export default axios

export {
  Axios,
  Cancel,
  CancelToken,
  isCancel
}
