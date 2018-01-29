'use strict'

import { isStream } from './../utils'
import { isArrayBuffer, isString, extend } from 'lodash'

import { AxiosResponse } from '../interfaces'

import settle from './../core/settle'
import buildURL from './../helpers/buildURL'

import * as http from 'http'
import * as https from 'https'

// TODO: untyped library
const httpFollow = require('follow-redirects').http
const httpsFollow = require('follow-redirects').https

import * as url from 'url'
import * as zlib from 'zlib'
import createError from '../core/createError'
import enhanceError from '../core/enhanceError'

let pkg = require('./../../../package.json')

export type AxiosRequestOptions = http.RequestOptions & {
  maxRedirects?: number
}

/*eslint consistent-return:0*/
export default function httpAdapter (config) {
  return new Promise(function dispatchHttpRequest (resolve, reject) {
    let data = config.data
    let headers = config.headers
    let timer

    // Set User-Agent (required by some servers)
    // Only set header if it hasn't been set in config
    // See https://github.com/axios/axios/issues/69
    if (!headers['User-Agent'] && !headers['user-agent']) {
      headers['User-Agent'] = 'axios/' + pkg.version
    }

    if (data && !isStream(data)) {
      if (Buffer.isBuffer(data)) {
        // Nothing to do...
      } else if (isArrayBuffer(data)) {
        data = new Buffer(new Uint8Array(data))
      } else if (isString(data)) {
        data = new Buffer(data, 'utf-8')
      } else {
        return reject(createError(
          'Data after transformation must be a string, an ArrayBuffer, a Buffer, or a Stream',
          config
        ))
      }

      // Add Content-Length header if data exists
      headers['Content-Length'] = data.length
    }

    // HTTP basic authentication
    let auth = undefined
    if (config.auth) {
      let username = config.auth.username || ''
      let password = config.auth.password || ''
      auth = username + ':' + password
    }

    // Parse url
    let parsed = url.parse(config.url)
    let protocol = parsed.protocol || 'http:'

    if (!auth && parsed.auth) {
      let urlAuth = parsed.auth.split(':')
      let urlUsername = urlAuth[0] || ''
      let urlPassword = urlAuth[1] || ''
      auth = urlUsername + ':' + urlPassword
    }

    if (auth) {
      delete headers.Authorization
    }

    let isHttps = protocol === 'https:'
    let agent = isHttps ? config.httpsAgent : config.httpAgent

    let options: AxiosRequestOptions = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: buildURL(parsed.path, config.params, config.paramsSerializer).replace(/^\?/, ''),
      method: config.method,
      headers: headers,
      agent: agent,
      auth: auth
    }

    let proxy = config.proxy
    if (!proxy && proxy !== false) {
      let proxyEnv = protocol.slice(0, -1) + '_proxy'
      let proxyUrl = process.env[proxyEnv] || process.env[proxyEnv.toUpperCase()]
      if (proxyUrl) {
        let parsedProxyUrl = url.parse(proxyUrl)
        proxy = {
          host: parsedProxyUrl.hostname,
          port: parsedProxyUrl.port
        }

        if (parsedProxyUrl.auth) {
          let proxyUrlAuth = parsedProxyUrl.auth.split(':')
          proxy.auth = {
            username: proxyUrlAuth[0],
            password: proxyUrlAuth[1]
          }
        }
      }
    }

    if (proxy) {
      options.hostname = proxy.host
      options.host = proxy.host
      options.headers.host = parsed.hostname + (parsed.port ? ':' + parsed.port : '')
      options.port = proxy.port
      options.path = protocol + '//' + parsed.hostname + (parsed.port ? ':' + parsed.port : '') + options.path

      // Basic proxy authorization
      if (proxy.auth) {
        let base64 = new Buffer(proxy.auth.username + ':' + proxy.auth.password, 'utf8').toString('base64')
        options.headers['Proxy-Authorization'] = 'Basic ' + base64
      }
    }

    let transport
    if (config.transport) {
      transport = config.transport
    } else if (config.maxRedirects === 0) {
      transport = isHttps ? https : http
    } else {
      if (config.maxRedirects) {
        options.maxRedirects = config.maxRedirects
      }
      transport = isHttps ? httpsFollow : httpFollow
    }

    // Create the request
    let req = transport.request(options, function handleResponse (res) {
      if (req.aborted) return

      // Response has been received so kill timer that handles request timeout
      clearTimeout(timer)
      timer = null

      // uncompress the response body transparently if required
      let stream = res
      switch (res.headers['content-encoding']) {
      /*eslint default-case:0*/
        case 'gzip':
        case 'compress':
        case 'deflate':
        // add the unzipper to the body stream processing pipeline
          stream = stream.pipe(zlib.createUnzip())

        // remove the content-encoding in order to not confuse downstream operations
          delete res.headers['content-encoding']
          break
      }

      // return the last request in case of redirects
      let lastRequest = res.req || req

      let responsePartial = {
        status: res.statusCode,
        statusText: res.statusMessage,
        headers: res.headers,
        config: config,
        request: lastRequest
      }

      let response: AxiosResponse

      if (config.responseType === 'stream') {
        response = extend({}, responsePartial, { data: stream })
        settle(resolve, reject, response)
      } else {
        let responseBuffer = []
        stream.on('data', function handleStreamData (chunk) {
          responseBuffer.push(chunk)

          // make sure the content length is not over the maxContentLength if specified
          if (config.maxContentLength > -1 && Buffer.concat(responseBuffer).length > config.maxContentLength) {
            reject(createError('maxContentLength size of ' + config.maxContentLength + ' exceeded',
              config, null, lastRequest))
          }
        })

        stream.on('error', function handleStreamError (err) {
          if (req.aborted) return
          reject(enhanceError(err, config, null, lastRequest))
        })

        stream.on('end', function handleStreamEnd () {
          let responseData: Buffer | String = Buffer.concat(responseBuffer)
          if (config.responseType !== 'arraybuffer') {
            responseData = responseData.toString('utf8')
          }

          response.data = responseData
          settle(resolve, reject, response)
        })
      }
    })

    // Handle errors
    req.on('error', function handleRequestError (err) {
      if (req.aborted) return
      reject(enhanceError(err, config, null, req))
    })

    // Handle request timeout
    if (config.timeout && !timer) {
      timer = setTimeout(function handleRequestTimeout () {
        req.abort()
        reject(createError('timeout of ' + config.timeout + 'ms exceeded', config, 'ECONNABORTED', req))
      }, config.timeout)
    }

    if (config.cancelToken) {
      // Handle cancellation
      config.cancelToken.promise.then(function onCanceled (cancel) {
        if (req.aborted) return

        req.abort()
        reject(cancel)
      })
    }

    // Send the request
    if (isStream(data)) {
      data.pipe(req)
    } else {
      req.end(data)
    }
  })
}
