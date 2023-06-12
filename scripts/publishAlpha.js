const execa = require('execa');
const packageJson = require('../package.json');

async function publishAlpha() {
  const verison = process.env.VERISON.split('_')[0];
  const release = verison.split('-')[0];
  const { stdout } = await execa('npm', ['view', packageJson.name, 'versions']);
  console.log('stdout', stdout);
  const index = stdout
    .replaceAll(',', '\n')
    .split('\n')
    .filter(item => item.includes(release)).length;
  await execa(
    'yarn',
    [
      `--registry=${process.env.LOCAL_NPM_REGISTRY}`,
      'publish',
      `--new-version=${verison}-alpha.${index}`,
    ],
    {
      stdio: 'inherit',
    }
  );
}

publishAlpha();
