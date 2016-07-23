var webpack = require('webpack')

module.exports = {
  entry: './frontend/index.js',

  output: {
    filename: 'bundle.js',
    path: 'frontend/public',
    publicPath: ''
  },

 plugins: process.env.NODE_ENV === 'production' ? [
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.optimize.UglifyJsPlugin()
  ] : [],

  module: {
    loaders: [
      { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader?presets[]=es2015&presets[]=react' }
    ]
  }
}