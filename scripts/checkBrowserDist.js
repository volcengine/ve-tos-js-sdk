const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const umdPath = path.resolve(__dirname, '../browser/tos.umd.development.js');
const requireDepReg = /(?:^|(?:[^.]))\brequire\('.+'\)/;

async function checkBrowserDist() {
  const content = await promisify(fs.readFile)(umdPath, 'utf-8');
  if (requireDepReg.test(content)) {
    const msg = `\`require()\` exists in ${umdPath}, please check code in browser environment`;
    throw Error(msg);
  }
}

module.exports = {
  checkBrowserDist,
};

if (require.main === module) {
  checkBrowserDist();
}
