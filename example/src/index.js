import axios from 'axios';
import TOS from '../../';

const client = new TOS({
  accessKeyId: process.env.ACCESS_KEY_ID,
  accessKeySecret: process.env.ACCESS_KEY_SECRET,
  region: 'cn-beijing',
  proxy: {
    url: `${window.location.protocol}//${window.location.host}/api/proxy-tos/`,
    needProxyParams: true,
  },
  maxRetryCount: 1,
  requestTimeout: 1000,
});

const listBucketsDom = document.querySelector('#list-buckets');
const jsonDom = document.querySelector('#json');
listBucketsDom.addEventListener('click', async () => {
  const res = await client.listBuckets();
  jsonDom.innerHTML = JSON.stringify(res, null, 2);
});

const uploadObjectDom = document.querySelector('#upload-object');
const fileDom = document.querySelector('input[type="file"]');
uploadObjectDom.addEventListener('click', async () => {
  const file = fileDom.files[0];
  await client.putObject({ key: 'aaa', body: file, bucket: 'cg-beijing' });

  // const url = client.getPreSignedUrl({ key: 'aaa', bucket: 'cg-beijing' });
  // axios({
  //   method: 'PUT',
  //   url,
  //   body: file,
  // });
});

(function() {
  const inputDom = document.querySelector('#put-getPresignedUrl-file-input');
  const textDom = document.querySelector('#put-getPresignedUrl-url');
  const uploadDom = document.querySelector(
    '#put-getPresignedUrl-upload-object'
  );
  let url = null;
  inputDom.addEventListener('change', () => {
    const file = inputDom.files[0];
    console.log('file: ', file);
    const key = file.name;
    url = client.getPreSignedUrl({
      bucket: 'cg-beijing',
      key,
      method: 'PUT',
    });
    textDom.innerHTML = url;
  });
  uploadDom.addEventListener('click', async () => {
    await axios.request({
      method: 'PUT',
      url,
    });
  });
})();

(function() {
  const inputDom = document.querySelector('#upload-progress-input');
  const textDom = document.querySelector('#upload-progress-text');
  const putObjectBtn = document.querySelector('#upload-progress-by-putObject');

  putObjectBtn.addEventListener('click', async () => {
    textDom.innerHTML = '';
    let content = '';
    const addContent = line => {
      content += line + '\n';
      textDom.innerHTML = content;
    };

    const file = inputDom.files[0];
    const key = file.name;
    client.putObject({
      bucket: 'cg-beijing',
      key,
      body: file,
      dataTransferStatusChange: status => {
        addContent(
          `type: ${status.type}, rwOnceBytes: ${status.rwOnceBytes}, consumedBytes: ${status.consumedBytes}, totalBytes: ${status.totalBytes}`
        );
      },
      progress: p => {
        addContent(`progress: ${p}`);
      },
    });
  });
})();
