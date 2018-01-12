'use strict';

import { extend, merge, bind } from 'lodash'
import Axios from './core/Axios'
var defaults = require('./defaults');

interface MainExport {
  Axios?: any,
  create?: any,
  Cancel?: any,
  CancelToken?: any,
  isCancel?: any,
  all?: any,
  spread?: any
}

/**
 * Create an instance of Axios
 *
 * @param {Object} defaultConfig The default config for the instance
 * @return {Axios} A new instance of Axios
 */
function createInstance(defaultConfig): MainExport {
  var context = new Axios(defaultConfig);
  var instance = bind(Axios.prototype.request, context);

  // Copy axios.prototype to instance
  extend(instance, Axios.prototype, context);

  // Copy context to instance
  extend(instance, context);

  return instance as MainExport;
}

// Create the default instance to be exported
var axios = createInstance(defaults);

// Expose Axios class to allow class inheritance
axios.Axios = Axios;

// Factory for creating new instances
axios.create = function create(instanceConfig) {
  return createInstance(merge(defaults, instanceConfig));
};

// Expose Cancel & CancelToken
axios.Cancel = require('./cancel/Cancel');
axios.CancelToken = require('./cancel/CancelToken');
axios.isCancel = require('./cancel/isCancel');

// Expose all/spread
axios.all = function all(promises) {
  return Promise.all(promises);
};
axios.spread = require('./helpers/spread');

export default axios
