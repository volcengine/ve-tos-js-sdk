import TOS, { StorageClassType } from '../../src/browser-index';
import { safeAwait } from '../../src/utils';
import { deleteBucket, sleepCache, NEVER_TIMEOUT } from '../utils';
import {
  tosOptions,
  isNeedDeleteBucket,
  testBucketName,
} from '../utils/options';

describe('nodejs lifecycle', () => {
  it(
    'lifecycle putBucketLifecycle',
    async () => {
      const client = new TOS({
        ...tosOptions,
      });

      const result = await client.putBucketLifecycle({
        bucket: testBucketName,
        rules: [
          {
            ID: 'id',
            Prefix: 'prefix',
            Status: 'Enabled',
            Expiration: { Days: 120 },
            NoncurrentVersionExpiration: { NoncurrentDays: 120 },
            AbortIncompleteMultipartUpload: { DaysAfterInitiation: 10 },
            Transitions: [
              {
                StorageClass: StorageClassType.StorageClassIa,
                Days: 30,
              },
              {
                StorageClass: StorageClassType.StorageClassArchiveFr,
                Days: 60,
              },
            ],
            NoncurrentVersionTransitions: [
              {
                StorageClass: StorageClassType.StorageClassIa,
                NoncurrentDays: 30,
              },
            ],
          },
          {
            ID: 'test',
            Prefix: 'test-prefix',
            Status: 'Enabled',
            Expiration: { Days: 120 },
            NoncurrentVersionExpiration: { NoncurrentDays: 120 },
            AbortIncompleteMultipartUpload: { DaysAfterInitiation: 10 },
            Transitions: [
              {
                StorageClass: StorageClassType.StorageClassIa,
                Days: 30,
              },
              {
                StorageClass: StorageClassType.StorageClassArchiveFr,
                Days: 60,
              },
            ],
            NoncurrentVersionTransitions: [
              {
                StorageClass: StorageClassType.StorageClassIa,
                NoncurrentDays: 30,
              },
            ],
          },
        ],
      });

      expect(result.data).toBe('');
    },
    NEVER_TIMEOUT
  );

  it(
    'lifecycle getBucketLifecycle',
    async () => {
      const client = new TOS({
        ...tosOptions,
      });

      const result = await client.getBucketLifecycle({
        bucket: testBucketName,
      });

      expect(result.data.Rules.length).toBe(2);
    },
    NEVER_TIMEOUT
  );

  it(
    'test allowSameActionOverlap',
    async () => {
      const client = new TOS({
        ...tosOptions,
      });

      const [err] = await safeAwait(
        client.putBucketLifecycle({
          bucket: testBucketName,
          rules: [
            {
              ID: 'a',
              Prefix: 'a',
              Status: 'Enabled',
              Transitions: [
                { StorageClass: StorageClassType.StorageClassIa, Days: 30 },
              ],
            },
            {
              ID: 'a/b',
              Status: 'Enabled',
              Prefix: 'a/b',
              Transitions: [
                { Days: 30, StorageClass: StorageClassType.StorageClassIa },
              ],
            },
          ],
        })
      );
      expect(err.toString().includes('same prefix'));

      await client.putBucketLifecycle({
        bucket: testBucketName,
        allowSameActionOverlap: true,
        rules: [
          {
            ID: 'a',
            Prefix: 'a',
            Status: 'Enabled',
            Transitions: [
              { StorageClass: StorageClassType.StorageClassIa, Days: 30 },
            ],
          },
          {
            ID: 'a/b',
            Status: 'Enabled',
            Prefix: 'a/b',
            Transitions: [
              { Days: 30, StorageClass: StorageClassType.StorageClassIa },
            ],
          },
          {
            ID: 'a/b/c',
            Status: 'Enabled',
            Prefix: 'a/b/c',
            Transitions: [
              { Days: 30, StorageClass: StorageClassType.StorageClassIa },
            ],
          },
        ],
      });

      const result = await client.getBucketLifecycle({
        bucket: testBucketName,
      });

      expect(result.data.Rules.length).toBe(3);
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
