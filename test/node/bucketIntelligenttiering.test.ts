import TOS from '../../src/browser-index';
import { deleteBucket, sleepCache, NEVER_TIMEOUT } from '../utils';
import {
  tosOptions,
  isNeedDeleteBucket,
  testBucketName,
} from '../utils/options';

describe('nodejs connection params', () => {
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
    'Intelligenttiering getBucketIntelligenttiering',
    async () => {
      const client = new TOS({
        ...tosOptions,
      });

      const result = await client.getBucketIntelligenttiering(testBucketName);

      expect(result.data.Status).toBe(undefined);
    },
    NEVER_TIMEOUT
  );
});
