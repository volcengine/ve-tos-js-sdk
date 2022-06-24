const execa = require('execa');
const packageJson = require('../package.json');

async function postPublish() {
  if (process.env.SKIP_BUILD) {
    console.log('postPublish: skip build');
    return;
  }

  const version = `v${packageJson.version}`;

  try {
    // 忽略 commit 时出错
    await execa('git', ['add', '.']);
    await execa('git', [
      'commit',
      '-am',
      `${version}. auto commit when publish`,
    ]);
  } catch (err) {}

  await execa('git', ['tag', version]);
  await execa('git', ['push', 'origin', version]);
  await execa('git', ['push', 'origin', 'main']);
}

postPublish();
