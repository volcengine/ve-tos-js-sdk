const execa = require('execa');

async function getBranch() {
  const { stdout: branch } = await execa('git', [
    'rev-parse',
    '--abbrev-ref',
    'HEAD',
  ]);

  return branch;
}

module.exports = {
  getBranch,
};
