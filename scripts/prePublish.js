const execa = require('execa');

require('dotenv').config();

async function prePublish() {
  if (!process.env.SKIP_BUILD) {
    console.log('prePublish: skip build');
    return;
  }

  const { stdout: branch } = await execa(
    'git',
    ['rev-parse', '--abbrev-ref', 'HEAD'],
    { stdio: 'inherit' }
  );

  if (branch !== 'main') {
    throw new Error('Must publish on main branch');
  }

  await execa('yarn', ['build'], { stdio: 'inherit' });

  if (process.env.LOCAL_NPM_REGISTRY) {
    console.log('publish to local npm registry');
    await execa(
      'yarn',
      [`--registry=${process.env.LOCAL_NPM_REGISTRY}`, 'publish'],
      { stdio: 'inherit', env: { SKIP_BUILD: 'true' } }
    );
  }
}

prePublish();
