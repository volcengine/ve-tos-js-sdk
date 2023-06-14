import TOS from '../../src/browser-index';
import { NEVER_TIMEOUT, sleepCache } from '../utils';
import { testBucketName, tosOptions } from '../utils/options';
import { clearAllTestBucket } from './utils';
const CommonTestCasePrefix = 'RealTimeLog';

describe(`bucket ${CommonTestCasePrefix} methods`, () => {
  beforeAll(async done => {
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
    `${CommonTestCasePrefix} getBucketRealTimeLog empty error`,
    async () => {
      const client = new TOS({
        ...tosOptions,
      });

      try {
        const result = await client.getBucketRealTimeLog({
          bucket: testBucketName,
        });
        console.log(result);
      } catch (error) {
        expect(error).toBeTruthy();
      }
    },
    NEVER_TIMEOUT
  );
  it(
    `${CommonTestCasePrefix} putBucketRealTimeLog`,
    async () => {
      const client = new TOS({
        ...tosOptions,
      });

      const result = await client.putBucketRealTimeLog({
        bucket: testBucketName,
        realTimeLogConfiguration: {
          Role: 'TOSLogArchiveTLSRole',
          AccessLogConfiguration: {
            UseServiceTopic: true,
          },
        },
      });

      expect(result.data).toBe('');
    },
    NEVER_TIMEOUT
  );

  it(
    `${CommonTestCasePrefix} getBucketRealTimeLog`,
    async () => {
      const client = new TOS({
        ...tosOptions,
      });

      const result = await client.getBucketRealTimeLog({
        bucket: testBucketName,
      });

      expect(result.data.RealTimeLogConfiguration).toBeTruthy();
      expect(result.data.RealTimeLogConfiguration.Role).toBe(
        'TOSLogArchiveTLSRole'
      );
      // expect(result.data.IndexDocument?.Suffix).toBe('index.html');
      // expect(result.data.RoutingRules?.length).toBe(1);
    },
    NEVER_TIMEOUT
  );

  it(
    `${CommonTestCasePrefix} deleteBucketRealTimeLog`,
    async () => {
      const client = new TOS({
        ...tosOptions,
      });

      const result = await client.deleteBucketRealTimeLog({
        bucket: testBucketName,
      });

      expect(result.data).toBe('');
    },
    NEVER_TIMEOUT
  );
});
