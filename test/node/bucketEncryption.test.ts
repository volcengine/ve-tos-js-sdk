import TOS, { StorageClassType } from '../../src/browser-index';
import { deleteBucket, sleepCache, NEVER_TIMEOUT } from './utils';
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
      'lifecycle putBucketEncryption',
      async () => {
        const client = new TOS({
          ...tosOptions,
        });

        const result = await client.putBucketEncryption({
          bucket: testBucketName,
          Rule:{
            ApplyServerSideEncryptionByDefault:{
              SSEAlgorithm:'string',
              KMSMasterKeyID:'string',
            }
          }
        });

        expect(result.data).toBe('');
      },
      NEVER_TIMEOUT
  );

  it(
      'lifecycle getBucketEncryption',
      async () => {
        const client = new TOS({
          ...tosOptions,
        });

        const result = await client.getBucketEncryption({
          bucket: testBucketName,
        });

        expect(result.data.Rule).toBe(Object);
      },
      NEVER_TIMEOUT
  );
  it(
      'lifecycle deleteBucketEncryption',
      async () => {
        const client = new TOS({
          ...tosOptions,
        });

        const result = await client.deleteBucketEncryption({
          bucket: testBucketName,
        });

        expect(result.data).toBe('');
      },
      NEVER_TIMEOUT
  );

  it(
      'lifecycle deleteBucketLifecycle',
      async () => {
        const client = new TOS({
          ...tosOptions,
        });

        const result = await client.deleteBucketLifecycle({
          bucket: testBucketName,
        });

        expect(result.data).toBe('');
      },
      NEVER_TIMEOUT
  );
});
