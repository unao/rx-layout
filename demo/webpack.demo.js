// const fs = require('fs')
const path = require('path')

const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  entry: {
    demo: path.join(__dirname, `demo.ts`)
  },
  output: {
    publicPath: '/',
    path: path.resolve(__dirname, `dist`),
    filename: '[name].[hash].bundle.js'
  },
  resolve: {
    // Add `.ts` and `.tsx` as a resolvable extension.
    extensions: ['.ts', '.tsx', '.js'] // note if using webpack 1 you'd also need a '' in the array as well
  },
  module: {
    rules: [
      { test: /\.tsx?$/, use: ['ts-loader'] }
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'demo.tmp.html')
      // chunks: ['vendor', 'main']
    })
  ],
  devtool: 'eval-source-map',
  devServer: {
    port: 7777,
    historyApiFallback: true
  }
}
