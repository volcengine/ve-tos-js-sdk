const nodeConfig = require('./node/jest.config');

// Signing regression tests are offline and do not need test bucket setup.
module.exports = {
  ...nodeConfig,
  globalSetup: undefined,
  testMatch: ['<rootDir>/test/node/preSignedRegion.test.ts'],
};
