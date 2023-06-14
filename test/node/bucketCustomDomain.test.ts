import TOS from '../../src/browser-index';
import { NEVER_TIMEOUT, sleepCache } from '../utils';
import { testBucketName, tosOptions } from '../utils/options';
import { clearAllTestBucket } from './utils';
const CommonTestCasePrefix = 'CustomDomain';

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
    `${CommonTestCasePrefix} getBucketCustomDomain empty error`,
    async () => {
      const client = new TOS({
        ...tosOptions,
      });

      try {
        const result = await client.getBucketCustomDomain({
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
    `${CommonTestCasePrefix} putBucketCustomDomain`,
    async () => {
      const client = new TOS({
        ...tosOptions,
      });

      const result = await client.putBucketCustomDomain({
        bucket: testBucketName,
        customDomainRule: {
          Domain: 'douyin.com',
        },
      });

      expect(result.data).toBe('');
    },
    NEVER_TIMEOUT
  );

  it(
    `${CommonTestCasePrefix} getBucketCustomDomain`,
    async () => {
      const client = new TOS({
        ...tosOptions,
      });

      const result = await client.getBucketCustomDomain({
        bucket: testBucketName,
      });

      expect(result.data.CustomDomainRules).toBeTruthy();
      expect(result.data.CustomDomainRules.at(0)?.Domain).toBe('douyin.com');
      // expect(result.data.IndexDocument?.Suffix).toBe('index.html');
      // expect(result.data.RoutingRules?.length).toBe(1);
    },
    NEVER_TIMEOUT
  );

  it(
    `${CommonTestCasePrefix} deleteBucketCustomDomain`,
    async () => {
      const client = new TOS({
        ...tosOptions,
      });

      const result = await client.deleteBucketCustomDomain({
        bucket: testBucketName,
        customDomain: 'douyin.com',
      });

      expect(result.data).toBe('');
    },
    NEVER_TIMEOUT
  );
});
