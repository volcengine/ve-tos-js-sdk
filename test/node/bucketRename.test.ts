import TOS from '../../src/browser-index';
import { NEVER_TIMEOUT, sleepCache } from '../utils';
import { testBucketName, tosOptions } from '../utils/options';
import { clearAllTestBucket } from './utils';
const CommonTestCasePrefix = 'Rename';

describe(`bucket ${CommonTestCasePrefix} methods`, () => {
  beforeAll(async (done) => {
    const client = new TOS(tosOptions);
    // clear all bucket
    await clearAllTestBucket(client);

    // create bucket
    await client.createBucket({
      bucket: testBucketName,
    });
    await sleepCache(100);
    done();
  }, NEVER_TIMEOUT);

  it(
    `${CommonTestCasePrefix} getBucketRename empty case`,
    async () => {
      const client = new TOS({
        ...tosOptions,
      });

      const result = await client.getBucketRename({
        bucket: testBucketName,
      });

      expect(result.data.RenameEnable).toBe(false);
    },
    NEVER_TIMEOUT
  );
  it(
    `${CommonTestCasePrefix} putBucketRename`,
    async () => {
      const client = new TOS({
        ...tosOptions,
      });

      const result = await client.putBucketRename({
        bucket: testBucketName,
        renameEnable: true,
      });

      expect(result.data).toBe('');
    },
    NEVER_TIMEOUT
  );

  it(
    `${CommonTestCasePrefix} getBucketRename`,
    async () => {
      const client = new TOS({
        ...tosOptions,
      });

      const result = await client.getBucketRename({
        bucket: testBucketName,
      });

      expect(result.data.RenameEnable).toBeTruthy();
    },
    NEVER_TIMEOUT
  );

  it(
    `${CommonTestCasePrefix} deleteBucketRename`,
    async () => {
      const client = new TOS({
        ...tosOptions,
      });

      const result = await client.deleteBucketRename({
        bucket: testBucketName,
      });

      expect(result.data).toBe('');

      const getResult = await client.getBucketRename({
        bucket: testBucketName,
      });

      expect(getResult.data.RenameEnable).toBe(false);
    },
    NEVER_TIMEOUT
  );
});
