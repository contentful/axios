'use strict'

import defaults from './../defaults'
import { merge, forEach } from 'lodash'
import InterceptorManager from './InterceptorManager'
import dispatchRequest from './dispatchRequest'

class Axios {
  public defaults
  private interceptors
  /**
   * Create a new instance of Axios
   *
   * @param {Object} instanceConfig The default config for the instance
   */
  constructor (instanceConfig) {
    this.defaults = instanceConfig
    this.interceptors = {
      request: new InterceptorManager(),
      response: new InterceptorManager()
    }
  }

  /**
   * Dispatch a request
   *
   * @param {Object} config The config specific for this request (merged with this.defaults)
   */
  request (config) {
    /*eslint no-param-reassign:0*/
    // Allow for axios('example/url'[, config]) a la fetch API
    if (typeof config === 'string') {
      config = merge({
        url: arguments[0]
      }, arguments[1])
    }

    config = merge(defaults, this.defaults, { method: 'get' }, config)
    config.method = config.method.toLowerCase()

    // Hook up interceptors middleware
    let chain = [dispatchRequest, undefined]
    let promise = Promise.resolve(config)

    this.interceptors.request.forEach(function unshiftRequestInterceptors (interceptor) {
      chain.unshift(interceptor.fulfilled, interceptor.rejected)
    })

    this.interceptors.response.forEach(function pushResponseInterceptors (interceptor) {
      chain.push(interceptor.fulfilled, interceptor.rejected)
    })

    while (chain.length) {
      promise = promise.then(chain.shift(), chain.shift())
    }

    return promise
  }

  // Provide aliases for supported request methods
  get (url, config) {
    return this.methodNoData('get', url, config)
  }

  delete (url, config) {
    return this.methodNoData('delete', url, config)
  }

  head (url, config) {
    return this.methodNoData('head', url, config)
  }

  options (url, config) {
    return this.methodNoData('options', url, config)
  }

  post (url, data, config) {
    return this.methodWithData('post', url, data, config)
  }

  put (url, data, config) {
    return this.methodWithData('put', url, data, config)
  }

  patch (url, data, config) {
    return this.methodWithData('patch', url, data, config)
  }

  private methodNoData (method, url, config) {
    return this.request(merge(config || {}, {
      method: method,
      url: url
    }))
  }

  private methodWithData (method, url, data, config) {
    return this.request(merge(config || {}, {
      method: method,
      url: url,
      data: data
    }))
  }
}

export default Axios
