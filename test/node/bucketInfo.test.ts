import TOS, { TosServerError } from '../../src/browser-index';
import { tosOptions } from '../utils/options';
import { NEVER_TIMEOUT, testCheckErr } from '../utils';

describe('nodejs bucket basic api', () => {
  it(
    'if bucket exist',
    async () => {
      const client = new TOS(tosOptions);
      await testCheckErr(
        () => client.headBucket('not-exist-bucket'),
        (error: any) => {
          if (error instanceof TosServerError) {
            if (error.statusCode === 404) {
              return true;
            }
          }
          return false;
        }
      );
    },
    NEVER_TIMEOUT
  );

  it(
    'bucket information',
    async () => {
      const client = new TOS(tosOptions);
      const { data } = await client.headBucket();
      expect(data['x-tos-bucket-region']).toBe(tosOptions.region);
      expect(data['x-tos-storage-class']).toBeTruthy();
    },
    NEVER_TIMEOUT
  );
});
