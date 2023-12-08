const path = require('path');

/** @type {import('jest').Config} */
const config = {
  verbose: true,
  rootDir: path.resolve(__dirname, '../../'),
  globalSetup: path.resolve(__dirname, './jest.setup.ts'),
};

module.exports = config;
