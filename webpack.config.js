const {
  addPlugins,
  createConfig,
  defineConstants,
  entryPoint,
  env,
  setOutput,
  sourceMaps,
  resolve
} = require('@webpack-blocks/webpack')
const typescript = require('@webpack-blocks/typescript')
const uglify = require('@webpack-blocks/uglify')

const path = require('path')

module.exports = createConfig([
  entryPoint('./src/axios.ts'),
  setOutput({
    path: path.resolve(__dirname, 'dist/browser'),
    filename: 'bundle.js',
    library: 'axios',
    libraryTarget: 'var'
  }),
  defineConstants({
    'process.env.NODE_ENV': process.env.NODE_ENV || 'development',
    'process.env.TARGET_ENV': 'browser'
  }),
  typescript({
    useCache: true,
    useBabel: true,
    babelOptions: {
      babelrc: false,
      presets: [
        ['@babel/env', { targets: 'last 2 versions, ie 11', modules: false }]
      ]
    },
    babelCore: '@babel/core',
  }),
  env('production', [
    setOutput({
      filename: 'bundle.min.js'
    }),
    uglify()
  ]),
  env('development', [
    uglify({
      uglifyOptions: {
        output: {
          beautify: false,
          preserve_line: true
        },
        mangle: false
      }
    })
  ]),
  // Axios foo replaces adapter file
  resolve({
    alias: {
      './adapters/http': path.resolve(__dirname, 'src/adapters/xhr')
    }
  })
])
