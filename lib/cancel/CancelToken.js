'use strict'

import Cancel from './Cancel'

/**
 * A `CancelToken` is an object that can be used to request cancellation of an operation.
 *
 * @class
 * @param {Function} executor The executor function.
 */
export default class CancelToken {
  public promise
  public reason

  constructor (executor) {
    if (typeof executor !== 'function') {
      throw new TypeError('executor must be a function.')
    }

    let resolvePromise
    this.promise = new Promise(function promiseExecutor (resolve) {
      resolvePromise = resolve
    })

    let token = this
    executor(function cancel (message) {
      if (token.reason) {
        // Cancellation has already been requested
        return
      }

      token.reason = new Cancel(message)
      resolvePromise(token.reason)
    })
  }

  /**
   * Returns an object that contains a new `CancelToken` and a function that, when called,
   * cancels the `CancelToken`.
   */
  static source () {
    let cancel
    let token = new CancelToken(function executor (c) {
      cancel = c
    })
    return {
      token: token,
      cancel: cancel
    }
  }

  /**
   * Throws a `Cancel` if cancellation has been requested.
   */
  throwIfRequested () {
    if (this.reason) {
      throw this.reason
    }
  }
}
