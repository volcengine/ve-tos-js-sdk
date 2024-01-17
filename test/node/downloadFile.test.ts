import TOS from '../../src/browser-index';
import { deleteBucket, NEVER_TIMEOUT, sleepCache } from '../utils';
import {
  isNeedDeleteBucket,
  testBucketName,
  tosOptions,
} from '../utils/options';
import {
  objectKey100M,
  objectKey10M,
  objectKey1K,
  objectKeyEmpty,
  objectPath100M,
  objectPath10M,
  objectPath1K,
  objectPathEmpty,
} from './utils';

describe('downloadFile', () => {
  beforeAll(async (done) => {
    const client = new TOS(tosOptions);

    await Promise.all([
      client.uploadFile({ file: objectPathEmpty, key: objectKeyEmpty }),
      client.uploadFile({ file: objectPath1K, key: objectKey1K }),
      client.uploadFile({ file: objectPath10M, key: objectKey10M }),
      client.uploadFile({ file: objectPath100M, key: objectKey100M }),
    ]);
    await sleepCache();
    done();
  }, NEVER_TIMEOUT);

  it(
    'download empty file',
    async () => {
      const client = new TOS(tosOptions);
      await client.downloadFile({
        filePath: './test/node/tmp/downloadFile/',
        key: objectKeyEmpty,
      });
    },
    NEVER_TIMEOUT
  );

  it(
    'download 100M file',
    async () => {
      const client = new TOS(tosOptions);
      await client.downloadFile({
        filePath: './test/node/tmp/downloadFile/',
        key: objectKey100M,
        taskNum: 5,
      });
      // const client = new TOS({
      //   ...tosOptions,
      //   bucket: 'cg-beijing',
      // });
      // await client.downloadFile({
      //   filePath: './test/node/tmp/downloadFile/',
      //   key: 'mysql-workbench-community-8.0.29-macos-x86_64.dmg',
      //   taskNum: 5,
      // });
    },
    NEVER_TIMEOUT
  );
});
