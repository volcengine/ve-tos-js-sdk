import TOS from '../../src/browser-index';
import { NEVER_TIMEOUT, sleepCache } from '../utils';
import {
  testBucketName,
  testCloudFunctionId,
  tosOptions,
} from '../utils/options';
const CommonTestCasePrefix = 'notification';

describe(`bucket ${CommonTestCasePrefix} methods`, () => {
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
});
