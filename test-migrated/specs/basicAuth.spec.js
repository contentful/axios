import setupBasicAuthTest from '../helpers/setupBasicAuthTest'

// TODO: inline tests, we don't polyfill ourselves anymore
describe('basicAuth without btoa polyfill', function () {
  setupBasicAuthTest()
})
