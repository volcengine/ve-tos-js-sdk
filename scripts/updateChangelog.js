const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const changelogFilepath = path.resolve(__dirname, '../CHANGELOG.md');
async function updateChangelog() {
  const version = require('../package.json').version;
  const content = await promisify(fs.readFile)(changelogFilepath, 'utf-8');

  let isFound = false;
  const newContent = content.replace(
    /^\s*(#*)\s*\[?\s*Unreleased\s*\]?\s*/m,
    ($0, $1) => {
      isFound = true;
      const startCh = $0.startsWith('\n') ? '\n' : '';
      const date = new Date().toISOString().split('T')[0];
      return `${startCh}## [${version}] - ${date}\n\n`;
    }
  );

  if (!isFound) {
    const msg = 'No `[Unreleased]` section in CHANGELOG.md file';
    console.error(msg);
    throw Error(msg);
  }

  promisify(fs.writeFile)(changelogFilepath, newContent);
}

module.exports = {
  updateChangelog,
};

if (require.main === module) {
  updateChangelog();
}
