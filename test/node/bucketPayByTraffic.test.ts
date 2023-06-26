import TOS from '../../src/browser-index';
import { NEVER_TIMEOUT, sleepCache } from '../utils';
import { testBucketName, tosOptions } from '../utils/options';
import { clearAllTestBucket } from './utils';
const CommonTestCasePrefix = 'traffic';

// FIXME: server not support PayByTraffic feature
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

  // it(
  //   `${CommonTestCasePrefix} putBucketPayByTraffic`,
  //   async () => {
  //     const client = new TOS({
  //       ...tosOptions,
  //     });

  //     const result = await client.putBucketPayByTraffic({
  //       bucket: testBucketName,
  //       payByTraffic: {
  //         ChargeType: 'Bandwidth',
  //         ActiveType: 'NextMonth',
  //       },
  //     });

  //     expect(result.data).toBe('');
  //   },
  //   NEVER_TIMEOUT
  // );

  it(
    `${CommonTestCasePrefix} getBucketPayByTraffic`,
    async () => {
      const client = new TOS({
        ...tosOptions,
      });

      const result = await client.getBucketPayByTraffic({
        bucket: testBucketName,
      });

      expect(result.data).toBe(undefined);

      // expect(result.data).toBe('Bandwidth');
      // expect(result.data.ChargeType).toBe('Bandwidth');
      // expect(result.data.ActiveType).toBe('NextMonth');
    },
    NEVER_TIMEOUT
  );
});
