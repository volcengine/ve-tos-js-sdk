import TOS from '../../';

const client = new TOS({
  accessKeyId: process.env.ACCESS_KEY_ID,
  accessKeySecret: process.env.ACCESS_KEY_SECRET,
  region: 'cn-beijing',
  proxy: {
    url: `${window.location.protocol}//${window.location.host}/api/proxy-tos/`,
    needProxyParams: true,
  },
});

const listBucketsDom = document.querySelector('#list-buckets');
const jsonDom = document.querySelector('#json');
listBucketsDom.addEventListener('click', async () => {
  const res = await client.listBuckets();
  jsonDom.innerHTML = JSON.stringify(res, null, 2);
});
