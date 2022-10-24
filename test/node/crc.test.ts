import TOS from '../../src/browser-index';
import { deleteBucket, NEVER_TIMEOUT, sleepCache } from '../utils';
import {
  isNeedDeleteBucket,
  testBucketName,
  tosOptions,
} from '../utils/options';
import { objectKey10M, objectPath10M } from './utils';

describe('test crc64', () => {
  beforeAll(async done => {
    const client = new TOS(tosOptions);
    // clear all bucket
    const { data: buckets } = await client.listBuckets();
    for (const bucket of buckets.Buckets) {
      if (isNeedDeleteBucket(bucket.Name)) {
        try {
          await deleteBucket(client, bucket.Name);
        } catch (err) {
          console.log('a: ', err);
        }
      }
    }
    // create bucket
    await client.createBucket({
      bucket: testBucketName,
    });
    await sleepCache();
    done();
  }, NEVER_TIMEOUT);
  // afterAll(async done => {
  //   const client = new TOS(tosOptions);
  //   console.log('delete bucket.....');
  //   // delete bucket
  //   deleteBucket(client, testBucketName);
  //   done();
  // }, NEVER_TIMEOUT);

  it('case 1', async () => {});

  it(
    'putObject with crc',
    async () => {
      const key = `${objectKey10M}-put-with-crc`;
      const client = new TOS({ ...tosOptions, enableCRC: true });

      await client.putObjectFromFile({
        filePath: objectPath10M,
        key,
      });

      const { data } = await client.headObject(key);
      expect(+data['content-length'] === 10 * 1024 * 1024).toBeTruthy();
    },
    NEVER_TIMEOUT
  );

  it(
    'uploadFile with crc',
    async () => {
      const key = `${objectKey10M}-uploadFile-with-crc`;
      const client = new TOS({ ...tosOptions, enableCRC: true });

      await client.uploadFile({
        file: objectPath10M,
        key,
      });

      const { data } = await client.headObject(key);
      expect(+data['content-length'] === 10 * 1024 * 1024).toBeTruthy();
    },
    NEVER_TIMEOUT
  );
});
