import { isStandardBrowserEnv } from './../utils'
import { isNumber, isString } from 'lodash'

export interface BrowserEnvCookie {
  read: (name) => string,
  write: (...args: any[]) => void
  remove: (name: string) => void
}

export default function getCookiesForEnv (): BrowserEnvCookie {
  if (isStandardBrowserEnv()) {
    return standardBrowserEnv()
  } else {
    return nonStandardBrowserEnv()
  }
}

// Standard browser envs support document.cookie
function standardBrowserEnv (): BrowserEnvCookie {
  return {
    write: function write (name, value, expires, path, domain, secure) {
      let cookie = []
      cookie.push(name + '=' + encodeURIComponent(value))

      if (isNumber(expires)) {
        cookie.push('expires=' + (new Date(expires)).toUTCString())
      }

      if (isString(path)) {
        cookie.push('path=' + path)
      }

      if (isString(domain)) {
        cookie.push('domain=' + domain)
      }

      if (secure === true) {
        cookie.push('secure')
      }

      document.cookie = cookie.join('; ')
    },

    read: function read (name) {
      let match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'))
      return (match ? decodeURIComponent(match[3]) : null)
    },

    remove: function remove (name) {
      this.write(name, '', Date.now() - 86400000)
    }
  }
}

// Non standard browser env (web workers, react-native) lack needed support.
function nonStandardBrowserEnv (): BrowserEnvCookie {
  return {
    write: function write () {
      return undefined
    },
    read: function read () { return null },
    remove: function remove () {
      return undefined
    }
  }
}
