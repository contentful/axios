// Polyfill ES6 Promise
require('es6-promise').polyfill()

// Polyfill URLSearchParams
URLSearchParams = require('url-search-params')

// Import axios
axios = require('../../index')

// Jasmine config
jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000
jasmine.getEnv().defaultTimeoutInterval = 20000

// Is this an old version of IE that lacks standard objects like DataView, ArrayBuffer, FormData, etc.
isOldIE = /MSIE (8|9)\.0/.test(navigator.userAgent)

// Get Ajax request using an increasing timeout to retry
getAjaxRequest = (function () {
  let attempts = 0
  const MAX_ATTEMPTS = 5
  const ATTEMPT_DELAY_FACTOR = 5

  function getAjaxRequest () {
    return new Promise(function (resolve, reject) {
      attempts = 0
      attemptGettingAjaxRequest(resolve, reject)
    })
  }

  function attemptGettingAjaxRequest (resolve, reject) {
    const delay = attempts * attempts * ATTEMPT_DELAY_FACTOR

    if (attempts++ > MAX_ATTEMPTS) {
      reject(new Error('No request was found'))
      return
    }

    setTimeout(function () {
      const request = jasmine.Ajax.requests.mostRecent()
      if (request) {
        resolve(request)
      } else {
        attemptGettingAjaxRequest(resolve, reject)
      }
    }, delay)
  }

  return getAjaxRequest
})()
