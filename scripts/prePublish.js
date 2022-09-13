const execa = require('execa');
const packageJson = require('../package.json');
const { updateChangelog } = require('./updateChangelog');
const { getBranch } = require('./utils');

require('dotenv').config();

async function prePublish() {
  if (process.env.SKIP_BUILD) {
    console.log('prePublish: skip build');
    return;
  }

  const branch = await getBranch();

  if (branch !== 'main' && packageJson.version.match(/^\d+\.\d+\.\d+$/)) {
    throw new Error(
      'Must publish release version on main branch, you can publish beta version.'
    );
  }

  await execa('yarn', ['build'], { stdio: 'inherit' });
  await updateChangelog();
  await execa('git', ['add', '.']);

  if (process.env.LOCAL_NPM_REGISTRY) {
    console.log('publish to local npm registry');
    await execa(
      'yarn',
      [
        `--registry=${process.env.LOCAL_NPM_REGISTRY}`,
        'publish',
        `--new-version=${packageJson.version}`,
      ],
      { stdio: 'inherit', env: { SKIP_BUILD: 'true' } }
    );
  }
}

prePublish();
