'use strict'

import {
  isFormData,
  isFile,
  isStream,
  isBlob,
  isArrayBufferView,
  isURLSearchParams
} from './utils'

import {
  isUndefined,
  isBuffer,
  isArrayBuffer,
  isObject,
  forEach,
  merge
} from 'lodash'

import HttpAdapter from './adapters/http'
import XhrAdapter from './adapters/xhr'

import { AxiosRequestConfig } from './interfaces'

import normalizeHeaderName from './helpers/normalizeHeaderName'

let DEFAULT_CONTENT_TYPE = {
  'Content-Type': 'application/x-www-form-urlencoded'
}

function setContentTypeIfUnset (headers, value) {
  if (!isUndefined(headers) && isUndefined(headers['Content-Type'])) {
    headers['Content-Type'] = value
  }
}

let defaultAdapter

if (process.env.TARGET_ENV === 'browser') {
  defaultAdapter = XhrAdapter
} else {
  defaultAdapter = HttpAdapter
}

let defaults: AxiosRequestConfig = {
  adapter: defaultAdapter,

  transformRequest: [function transformRequest (data, headers) {
    normalizeHeaderName(headers, 'Content-Type')
    if (isFormData(data) ||
      isArrayBuffer(data) ||
      isBuffer(data) ||
      isStream(data) ||
      isFile(data) ||
      isBlob(data)
    ) {
      return data
    }
    if (isArrayBufferView(data)) {
      return data.buffer
    }
    if (isURLSearchParams(data)) {
      setContentTypeIfUnset(headers, 'application/x-www-form-urlencoded;charset=utf-8')
      return data.toString()
    }
    if (isObject(data)) {
      setContentTypeIfUnset(headers, 'application/json;charset=utf-8')
      return JSON.stringify(data)
    }
    return data
  }],

  transformResponse: [function transformResponse (data) {
    /*eslint no-param-reassign:0*/
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data)
      } catch (e) { /* Ignore */ }
    }
    return data
  }],

  timeout: 0,

  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',

  maxContentLength: -1,

  validateStatus: function validateStatus (status) {
    return status >= 200 && status < 300
  }
}

defaults.headers = {
  common: {
    'Accept': 'application/json, text/plain, */*'
  }
}

forEach(['delete', 'get', 'head'], function forEachMethodNoData (method) {
  defaults.headers[method] = {}
})

forEach(['post', 'put', 'patch'], function forEachMethodWithData (method) {
  defaults.headers[method] = merge(DEFAULT_CONTENT_TYPE)
})

export default defaults
