'use strict'

import defaults from './../defaults'
import { merge, forEach } from 'lodash'
import InterceptorManager from './InterceptorManager'
import dispatchRequest from './dispatchRequest'
import { AxiosPromise, AxiosRequestConfig, AxiosResponse } from '../interfaces'

export type HttpVerb = 'get' | 'put' | 'post' | 'delete' | 'options' | 'head' | 'patch'

class Axios {
  public defaults: AxiosRequestConfig
  private interceptors: {
    request: InterceptorManager<AxiosRequestConfig>
    response: InterceptorManager<AxiosResponse>
  }
  /**
   * Create a new instance of Axios
   *
   * @param {Object} instanceConfig The default config for the instance
   */
  constructor (instanceConfig: AxiosRequestConfig) {
    this.defaults = instanceConfig
    this.interceptors = {
      request: new InterceptorManager<AxiosRequestConfig>(),
      response: new InterceptorManager<AxiosResponse>()
    }
  }

  /**
   * Dispatch a request
   *
   * @param {Object} config The config specific for this request (merged with this.defaults)
   */
  request<T = any> (config: AxiosRequestConfig): AxiosPromise<T> {
    /*eslint no-param-reassign:0*/
    // Allow for axios('example/url'[, config]) a la fetch API
    if (typeof config === 'string') {
      config = merge({
        url: arguments[0]
      }, arguments[1])
    }

    config = merge({}, defaults, this.defaults, { method: 'get' }, config)
    config.method = config.method.toLowerCase()

    // Hook up interceptors middleware
    const finalConfig = this.interceptors.request.apply(Promise.resolve(config))
    const request = finalConfig.then(dispatchRequest)
    const finalResponse = this.interceptors.response.apply(request)

    return finalResponse
  }

  // Provide aliases for supported request methods
  get<T = any> (url: string, config?: AxiosRequestConfig) {
    return this.methodNoData<T>('get', url, config)
  }

  delete (url: string, config?: AxiosRequestConfig) {
    return this.methodNoData('delete', url, config)
  }

  head (url: string, config?: AxiosRequestConfig) {
    return this.methodNoData('head', url, config)
  }

  options (url: string, config?: AxiosRequestConfig) {
    return this.methodNoData('options', url, config)
  }

  post<T = any> (url: string, data: any, config?: AxiosRequestConfig) {
    return this.methodWithData<T>('post', url, data, config)
  }

  put<T = any> (url: string, data: any, config?: AxiosRequestConfig) {
    return this.methodWithData<T>('put', url, data, config)
  }

  patch<T = any> (url: string, data: any, config?: AxiosRequestConfig) {
    return this.methodWithData<T>('patch', url, data, config)
  }

  private methodNoData<T = any> (method: HttpVerb, url: string, config: AxiosRequestConfig = {}) {
    return this.request<T>(merge(config, {
      method: method,
      url: url
    }))
  }

  private methodWithData<T = any> (method: HttpVerb, url: string, data: any, config: AxiosRequestConfig = {}) {
    return this.request<T>(merge(config, {
      method: method,
      url: url,
      data: data
    }))
  }
}

export default Axios
