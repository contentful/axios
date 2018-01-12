/**
 * A `Cancel` is an object that is thrown when an operation is canceled.
 *
 * @class
 * @param {string=} message The message.
 */
export default class Cancel {
  public __CANCEL__ = true
  private message: string

  constructor (message: string) {
    this.message = message
  }

  toString () {
    return 'Cancel' + (this.message ? ': ' + this.message : '')
  }
}
