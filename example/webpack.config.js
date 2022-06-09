const path = require('path');
const { createTosProxyMiddleware } = require('../dist/proxy');
const { DefinePlugin } = require('webpack');

require('dotenv').config({ path: '../.env' });

module.exports = {
  mode: 'development',
  devtool: 'source-map',
  module: {
    rules: [
      {
        enforce: 'pre',
        include: path.resolve(__dirname, '../browser'),
        test: /\.(js|mjs|jsx|ts|tsx|css)$/,
        use: 'source-map-loader',
      },
    ],
  },
  plugins: [
    new DefinePlugin({
      'process.env.ACCESS_KEY_ID': JSON.stringify(process.env.ACCESS_KEY_ID),
      'process.env.ACCESS_KEY_SECRET': JSON.stringify(
        process.env.ACCESS_KEY_SECRET
      ),
    }),
  ],

  devServer: {
    open: true,
    historyApiFallback: true,
    port: 8081,
    // no CORS error by proxy
    before: devServer => {
      devServer.use(createTosProxyMiddleware('/api/proxy-tos/', {}));
    },
  },
};
