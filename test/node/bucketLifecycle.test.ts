import TOS, { StorageClassType } from '../../src/browser-index';
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
