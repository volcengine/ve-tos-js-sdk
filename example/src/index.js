import axios from 'axios';
import TOS, { DataTransferType } from '../../';

const bucket = 'cg-beijing';
const client = new TOS({
  accessKeyId: process.env.ACCESS_KEY_ID,
  accessKeySecret: process.env.ACCESS_KEY_SECRET,
  region: process.env.REGION || 'cn-beijing',
  endpoint: process.env.ENDPOINT || '',
  proxy: {
    url: `${window.location.protocol}//${window.location.host}/api/proxy-tos/`,
    needProxyParams: true,
  },
  requestTimeout: -1,
  bucket,
});

const listBucketsDom = document.querySelector('#list-buckets');
const jsonDom = document.querySelector('#json');
listBucketsDom.addEventListener('click', async () => {
  const res = await client.listBuckets({
    projectName: 'default',
  });
  jsonDom.innerHTML = JSON.stringify(res, null, 2);
});

const uploadObjectDom = document.querySelector('#upload-object');
const fileDom = document.querySelector('input[type="file"]');
uploadObjectDom.addEventListener('click', async () => {
  const file = fileDom.files[0];
  await client.putObject({ key: 'aaa', body: file });

  // const url = client.getPreSignedUrl({ key: 'aaa' });
  // axios({
  //   method: 'PUT',
  //   url,
  //   body: file,
  // });
});

(function () {
  const inputDom = document.querySelector('#put-getPresignedUrl-file-input');
  const textDom = document.querySelector('#put-getPresignedUrl-url');
  const uploadDom = document.querySelector(
    '#put-getPresignedUrl-upload-object'
  );
  let url = null;
  let file = null;
  inputDom.addEventListener('change', () => {
    file = inputDom.files[0];
    console.log('file: ', file);
    const key = file.name;
    url = client.getPreSignedUrl({
      key,
      method: 'PUT',
    });
    textDom.innerHTML = url;
  });
  uploadDom.addEventListener('click', async () => {
    await axios.request({
      method: 'PUT',
      url,
      data: file,
    });
  });
})();

(function () {
  const inputDom = document.querySelector(
    '#put-getPresignedUrl-custom-domain-file-input'
  );
  const textDom = document.querySelector(
    '#put-getPresignedUrl-custom-domain-url'
  );
  const uploadDom = document.querySelector(
    '#put-getPresignedUrl-custom-domain-upload-object'
  );
  let url = null;
  let file = null;

  inputDom.addEventListener('change', () => {
    file = inputDom.files[0];
    console.log('file: ', file);
    const key = file.name;
    url = client.getPreSignedUrl({
      key,
      method: 'PUT',
      alternativeEndpoint: '123.baidu.com',
    });
    textDom.innerHTML = url;
  });
  uploadDom.addEventListener('click', async () => {
    await axios.request({
      method: 'PUT',
      url,
      data: file,
    });
  });
})();

(function () {
  let lastUploadKey = '';
  const inputDom = document.querySelector('#upload-progress-input');
  const textDom = document.querySelector('#upload-progress-text');
  const putObjectBtn = document.querySelector('#upload-progress-by-putObject');
  const uploadFileBtn = document.querySelector(
    '#upload-progress-by-uploadFile'
  );
  const resumableCopyBtn = document.querySelector(
    '#resumeCopy-progress-by-uploadFile'
  );

  putObjectBtn.addEventListener('click', async () => {
    textDom.innerHTML = '';
    let content = '';
    const addContent = (line) => {
      content += line + '\n';
      textDom.innerHTML = content;
    };

    const file = inputDom.files[0];
    const key = file.name;
    lastUploadKey = key;
    client.putObject({
      key,
      body: file,
      dataTransferStatusChange: (status) => {
        addContent(
          `type: ${status.type}, rwOnceBytes: ${status.rwOnceBytes}, consumedBytes: ${status.consumedBytes}, totalBytes: ${status.totalBytes}`
        );
      },
      progress: (p) => {
        addContent(`progress: ${p}`);
      },
    });
  });

  uploadFileBtn.addEventListener('click', async () => {
    textDom.innerHTML = '';
    let content = '';
    const addContent = (line) => {
      content += line + '\n';
      textDom.innerHTML = content;
    };

    const file = inputDom.files[0];
    const key = file.name;
    lastUploadKey = key;
    client.uploadFile({
      key,
      file,
      taskNum: 3,
      dataTransferStatusChange: (status) => {
        addContent(
          `type: ${status.type}, rwOnceBytes: ${status.rwOnceBytes}, consumedBytes: ${status.consumedBytes}, totalBytes: ${status.totalBytes}`
        );
      },
      progress: (p) => {
        addContent(`progress: ${p}`);
      },
    });
  });

  resumableCopyBtn.addEventListener('click', () => {
    textDom.innerHTML = '';
    let content = '';
    const addContent = (line) => {
      content += line + '\n';
      textDom.innerHTML = content;
    };

    client.resumableCopyObject({
      srcBucket: bucket,
      srcKey: lastUploadKey,
      key: `copy_${lastUploadKey}`,
      progress: (p) => {
        addContent(`progress: ${p}`);
      },
    });
  });
})();

(function () {
  const getObjectBtn = document.querySelector('#getObject-btn');
  const key = 'a (1).txt';
  const [start, end] = [0, 5];

  getObjectBtn.addEventListener('click', async () => {
    client
      .getObjectV2({
        key,
        dataType: 'blob',
        headers: {
          // Range: `bytes=${start}-${end}`,
        },
        dataTransferStatusChange: (event) => {
          if (event.type === DataTransferType.Started) {
            console.log('Data Transfer Started');
          } else if (event.type === DataTransferType.Rw) {
            const percent = (
              (event.consumedBytes / event.totalBytes) *
              100
            ).toFixed(2);
            console.log(
              `Once Read:${event.rwOnceBytes},ConsumerBytes/TotalBytes: ${event.consumedBytes}/${event.totalBytes},${percent}%`
            );
          } else if (event.type === DataTransferType.Succeed) {
            const percent = (
              (event.consumedBytes / event.totalBytes) *
              100
            ).toFixed(2);
            console.log(
              `Data Transfer Succeed, ConsumerBytes/TotalBytes:${event.consumedBytes}/${event.totalBytes},${percent}%`
            );
          } else if (event.type === DataTransferType.Failed) {
            console.log('Data Transfer Failed');
          }
        },
        progress: (v) => {
          console.log('getObjectV2 progress:', v);
        },
      })
      .then((r) => {
        const blob = r.data.content;
        // 创建标签。
        const link = document.createElement('a');
        // 将标签绑定 href 属性。
        link.href = window.URL.createObjectURL(blob);
        // 指定下载后的本地文件名称。
        link.download = 'exampleobject.txt';
        // 下载Object。
        link.click();
        // 移除绑定的 URL。
        window.URL.revokeObjectURL(link.href);
      });
  });
})();

(function () {
  const btnEle = document.querySelector('#preSignedPolicyURL-btn');
  btnEle.addEventListener('click', () => {
    const prefix = `（!-_.*()/&$@=;:+ ,?\{^}%\`]>[~<#|'"）! ~ * ' ( )%2`;
    const ret = client.preSignedPolicyURL({
      conditions: [
        {
          key: 'key',
          value: prefix,
          operator: 'starts-with',
        },
      ],
    });

    const url = ret.getSignedURLForList({ prefix });
    axios(url);
  });
})();
