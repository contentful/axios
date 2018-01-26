import { isArray, forEach, isFunction } from 'lodash'
import { AxiosTransformer } from '../interfaces'
/**
 * Transform the data for a request or a response
 *
 * @param {Object|String} data The data to be transformed
 * @param {Array} headers The headers for the request or response
 * @param {Array|Function} fns A single function or Array of functions
 * @returns {*} The resulting transformed data
 */
export default function transformData (data, headers, fns: AxiosTransformer | AxiosTransformer[]) {
  let transformers = fns

  if (!isArray(fns)) {
    transformers = [fns]
  }

  forEach(transformers, function transform (fn) {
    // TODO: allow only transformer in fns
    if (isFunction(fn)) {
      data = fn(data, headers)
    }
  })

  return data
}
