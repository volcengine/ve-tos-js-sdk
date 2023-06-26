import TOS from '../../src/browser-index';
import {
  InventoryOptionalFields,
  ScheduleFrequency,
} from '../../src/methods/bucket/inventory';
import { NEVER_TIMEOUT, sleepCache } from '../utils';
import {
  testAccountId,
  testBucketName,
  testTargetBucketName,
  tosOptions,
} from '../utils/options';
import { clearAllTestBucket } from './utils';
const CommonTestCasePrefix = 'Inventory';

describe(`bucket ${CommonTestCasePrefix} methods`, () => {
  beforeAll(async done => {
    const client = new TOS(tosOptions);
    // clear all bucket
    await clearAllTestBucket(client);

    // create bucket
    await client.createBucket({
      bucket: testBucketName,
    });
    await client.createBucket({
      bucket: testTargetBucketName,
    });
    await sleepCache(100);
    done();
  }, NEVER_TIMEOUT);

  it(
    `${CommonTestCasePrefix} getBucketInventory empty`,
    async () => {
      const client = new TOS({
        ...tosOptions,
      });

      try {
        const result = await client.getBucketInventory({
          bucket: testBucketName,
          id: 'test',
        });

        expect(result.data).toBe(undefined);
      } catch (error) {
        expect(error).toBeTruthy();
      }
    },
    NEVER_TIMEOUT
  );

  it(
    `${CommonTestCasePrefix} putBucketInventory`,
    async () => {
      const client = new TOS({
        ...tosOptions,
      });

      const result = await client.putBucketInventory({
        bucket: testBucketName,

        inventoryConfiguration: {
          Id: 'test',
          IsEnabled: false,
          Destination: {
            TOSBucketDestination: {
              Format: 'CSV',
              AccountId: testAccountId,
              Role: 'TosArchiveTOSInventory',
              Bucket: testTargetBucketName,
              Prefix: 'tos_bucket_inventory',
            },
          },
          Schedule: {
            Frequency: ScheduleFrequency.Weekly,
          },
          IncludedObjectVersions: 'Current',
          OptionalFields: {
            Field: [InventoryOptionalFields.Size],
          },
        },
      });

      expect(result.data).toBe('');
    },
    NEVER_TIMEOUT
  );

  it(
    `${CommonTestCasePrefix} listBucketInventory get one`,
    async () => {
      const client = new TOS({
        ...tosOptions,
      });

      const result = await client.listBucketInventory({
        bucket: testBucketName,
      });

      expect(result.data.InventoryConfigurations).toBeTruthy();
      expect(result.data.InventoryConfigurations.length).toBe(1);
      expect(result.data.InventoryConfigurations?.[0].Id).toBe('test');

      // expect(result.data.IndexDocument?.Suffix).toBe('index.html');
      // expect(result.data.RoutingRules?.length).toBe(1);
    },
    NEVER_TIMEOUT
  );
  it(
    `${CommonTestCasePrefix} getBucketInventory`,
    async () => {
      const client = new TOS({
        ...tosOptions,
      });

      const result = await client.getBucketInventory({
        bucket: testBucketName,
        id: 'test',
      });

      expect(result.data?.Id).toBe('test');
    },
    NEVER_TIMEOUT
  );

  it(
    `${CommonTestCasePrefix} deleteBucketInventory`,
    async () => {
      const client = new TOS({
        ...tosOptions,
      });

      const result = await client.deleteBucketInventory({
        bucket: testBucketName,
        id: 'test',
      });

      expect(result.data).toBe('');
    },
    NEVER_TIMEOUT
  );
});
