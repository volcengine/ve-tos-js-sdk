import TOS from '../../src/browser-index';
import { NEVER_TIMEOUT, sleepCache } from '../utils';
import {
  testAccountId,
  testBucketName,
  testTargetBucketName,
  tosOptions,
} from '../utils/options';
import { clearAllTestBucket } from './utils';
const CommonTestCasePrefix = 'jobs';

// FIXME: private methods for internal usage. Unit Test
describe(`batch ${CommonTestCasePrefix} methods`, () => {
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
    `${CommonTestCasePrefix} listJobs empty error`,
    async () => {
      const client = new TOS({
        ...tosOptions,
      });

      try {
        const result = await client.listJobs({
          accountId: testAccountId,
        });
        console.log(result);
      } catch (error) {
        expect(error).toBeTruthy();
      }
    },
    NEVER_TIMEOUT
  );
});
