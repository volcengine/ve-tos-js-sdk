import TOS from '../../src/browser-index';
import { NEVER_TIMEOUT, sleepCache } from '../utils';
import { testBucketName, tosOptions } from '../utils/options';
const CommonTestCasePrefix = 'traffic';

// FIXME: server not support PayByTraffic feature
describe(`bucket ${CommonTestCasePrefix} methods`, () => {
  it(
    `${CommonTestCasePrefix} getBucketPayByTraffic`,
    async () => {
      const client = new TOS({
        ...tosOptions,
      });

      const result = await client.getBucketPayByTraffic({
        bucket: testBucketName,
      });

      // expect(result.data).toBe(undefined);

      // expect(result.data).toBe('Bandwidth');
      // expect(result.data.ChargeType).toBe('Bandwidth');
      // expect(result.data.ActiveType).toBe('NextMonth');
    },
    NEVER_TIMEOUT
  );
});
