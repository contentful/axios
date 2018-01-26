# Axios 1.0.0-alpha.1 Changelog

* Remove `axios.spread`
* Remove `axios.all`
* Browser detection by `TARGET_ENV=browser` environment variable
  * sets default adapter to XHR
  * removes http adapter from bundle

## Browser
* Remove support for IE <11
* Cookie expiration date is now derived from UTC (previous: deprecated GMT)

## CommonJS
* default Axios instance is now under `require('axios').default`

## Tests
* rewrote unit tests to jasmin
  * redirect x times test now actually testing if redirected correctly
  * probably found a bug since `'123456789'` does not equals `123456789`
  * removed httpproxyheader test since it is actually testing nothing
