import TOS from '../../src/browser-index';
import { NEVER_TIMEOUT, sleepCache } from '../utils';
import { testAccountId, testBucketName, tosOptions } from '../utils/options';
const CommonTestCasePrefix = 'jobs';

// FIXME: private methods for internal usage. Unit Test
describe(`batch ${CommonTestCasePrefix} methods`, () => {
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
