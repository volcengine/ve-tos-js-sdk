const execa = require('execa');
const packageJson = require('../package.json');

async function publish() {
  const version = `v${packageJson.version}`;

  await execa('git', ['add', '.']);
  await execa('git', ['commit', '-am', `${version}. auto commit when publish`]);
  await execa('git', ['tag', version]);
  await execa('git', ['push', 'origin', version]);
  await execa('git', ['push', 'origin', 'master']);
}

publish();
