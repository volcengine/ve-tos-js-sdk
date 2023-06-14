import TOS from '../../src/browser-index';
import { deleteBucket, sleepCache, NEVER_TIMEOUT } from '../utils';
import {
  tosOptions,
  isNeedDeleteBucket,
  testBucketName,
} from '../utils/options';

describe('nodejs listObjectsType2', () => {
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
    await sleepCache(100);
    done();
  }, NEVER_TIMEOUT);

  it(
    'listObjectsType2',
    async () => {
      const client = new TOS({
        ...tosOptions,
      });

      const key = 'listObjectsType2-test';
      await client.putObject({
        bucket: testBucketName,
        key: key,
        body: Buffer.from('hello world'),
      });

      const result = await client.listObjectsType2({
        bucket: testBucketName,
        prefix: key,
      });

      expect(result.data.Contents?.[0].Key).toBe(key);
      expect(result.data.Contents?.[0].Size).toBe(11);
      expect(result.data.Contents?.[0].HashCrc64ecma).toBe(
        '5981764153023615706'
      );
    },
    NEVER_TIMEOUT
  );
});
