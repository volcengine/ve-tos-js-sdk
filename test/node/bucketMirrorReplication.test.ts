import { StorageClassInheritDirectiveType } from '../../src/TosExportEnum';
import TOS, { StorageClassType } from '../../src/browser-index';
import { deleteBucket, sleepCache, NEVER_TIMEOUT } from '../utils';
import {
  tosOptions,
  isNeedDeleteBucket,
  testBucketName,
  testTargetBucketName,
  testTargetRegionGuangZhou,
} from '../utils/options';
const CommonTestCasePrefix = 'replication';

describe('nodejs connection params', () => {
  beforeAll(async done => {
    const client = new TOS(tosOptions);
    const guangzhouClient = new TOS({
      ...tosOptions,
      region: testTargetRegionGuangZhou,
    });
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

    const { data: targetBuckets } = await guangzhouClient.listBuckets();
    for (const bucket of targetBuckets.Buckets) {
      if (isNeedDeleteBucket(bucket.Name)) {
        try {
          await deleteBucket(guangzhouClient, bucket.Name);
        } catch (err) {
          console.log('a: ', err);
        }
      }
    }

    // create bucket
    await client.createBucket({
      bucket: testBucketName,
    });

    await guangzhouClient.createBucket({
      bucket: testTargetBucketName,
    });
    await sleepCache(100);
    done();
  }, NEVER_TIMEOUT);

  it(
    `${CommonTestCasePrefix} getBucketReplication empty case`,
    async () => {
      const client = new TOS({
        ...tosOptions,
      });

      try {
        const result = await client.getBucketReplication({
          bucket: testBucketName,
        });
        expect(result.data.Rules.length).toBe(0);
      } catch (error) {
        expect(error).toBeFalsy();
      }
    },
    NEVER_TIMEOUT
  );

  it(
    `${CommonTestCasePrefix} putBucketReplication`,
    async () => {
      const client = new TOS({
        ...tosOptions,
      });

      const result = await client.putBucketReplication({
        bucket: testBucketName,
        role: 'ServiceRoleforReplicationAccessTOS',
        rules: [
          {
            ID: '1',
            Status: 'Enabled',
            PrefixSet: ['prefix_1', 'prefix_2'],
            Destination: {
              Bucket: testTargetBucketName,
              Location: testTargetRegionGuangZhou,
              StorageClass: StorageClassType.StorageClassStandard,
              StorageClassInheritDirective:
                StorageClassInheritDirectiveType.StorageClassInheritDirectiveDestinationBucket,
            },
            HistoricalObjectReplication: 'Enabled',
          },
        ],
      });

      expect(result.data).toBe('');
    },
    NEVER_TIMEOUT
  );

  it(
    `${CommonTestCasePrefix} getBucketReplication`,
    async () => {
      const client = new TOS({
        ...tosOptions,
      });

      const result = await client.getBucketReplication({
        bucket: testBucketName,
        ruleId: '1',
      });

      expect(result.data.Rules.length).toBe(1);
      expect(result.data.Rules.at(0)?.ID).toBe('1');
    },
    NEVER_TIMEOUT
  );

  it(
    `${CommonTestCasePrefix} deleteBucketReplication`,
    async () => {
      const client = new TOS({
        ...tosOptions,
      });

      const result = await client.deleteBucketReplication({
        bucket: testBucketName,
      });

      expect(result.data).toBe('');
    },
    NEVER_TIMEOUT
  );
});
