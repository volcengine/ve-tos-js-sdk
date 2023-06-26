import TOS from '../../src/browser-index';
import { NEVER_TIMEOUT, sleepCache } from '../utils';
import {
  testBucketName,
  testCloudFunctionId,
  tosOptions,
} from '../utils/options';
import { clearAllTestBucket } from './utils';
const CommonTestCasePrefix = 'notification';

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
    `${CommonTestCasePrefix} getBucketNotification empty case`,
    async () => {
      const client = new TOS({
        ...tosOptions,
      });

      try {
        const result = await client.getBucketNotification({
          bucket: testBucketName,
        });
        expect(result.data.CloudFunctionConfigurations.length).toBe(0);
      } catch (error) {
        expect(error).toBeTruthy();
      }
    },
    NEVER_TIMEOUT
  );
  it(
    `${CommonTestCasePrefix} putBucketNotification`,
    async () => {
      const client = new TOS({
        ...tosOptions,
      });

      const result = await client.putBucketNotification({
        bucket: testBucketName,
        cloudFunctionConfigurations: [
          {
            RuleId: 'TestNotification',
            Events: ['tos:ObjectCreated:Put'],
            Filter: {
              TOSKey: {
                FilterRules: [
                  {
                    Name: 'prefix',
                    Value: 'test-',
                  },
                  {
                    Name: 'suffix',
                    Value: '-ci',
                  },
                ],
              },
            },
            CloudFunction: testCloudFunctionId,
          },
        ],
      });

      expect(result.data).toBe('');
    },
    NEVER_TIMEOUT
  );

  it(
    `${CommonTestCasePrefix} getBucketNotification`,
    async () => {
      const client = new TOS({
        ...tosOptions,
      });

      const result = await client.getBucketNotification({
        bucket: testBucketName,
      });

      expect(result.data.CloudFunctionConfigurations).toBeTruthy();
      expect(result.data.CloudFunctionConfigurations.at(0)?.CloudFunction).toBe(
        testCloudFunctionId
      );
      expect(result.data.CloudFunctionConfigurations.at(0)?.RuleId).toBe(
        'TestNotification'
      );
    },
    NEVER_TIMEOUT
  );
});
