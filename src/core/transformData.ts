import { isArray, forEach } from 'lodash'
/**
 * Transform the data for a request or a response
 *
 * @param {Object|String} data The data to be transformed
 * @param {Array} headers The headers for the request or response
 * @param {Array|Function} fns A single function or Array of functions
 * @returns {*} The resulting transformed data
 */
export default function transformData (data, headers, fns) {
  let transformers = fns

  if (!isArray(fns)) {
    transformers = [fns]
  }

  forEach(transformers, function transform (fn) {
    data = fn(data, headers)
  })

  return data
}
