import TOS from '../../src/browser-index';
import { tosOptions } from '../utils/options';
import { NEVER_TIMEOUT } from '../utils';

describe('doesBucketExist', () => {
  it(
    'basic',
    async () => {
      const client = new TOS({
        ...tosOptions,
      });

      const bucketName = `js-sdk-bucket-exist-${Date.now()}`;
      await client.createBucket({
        bucket: bucketName,
      });
      const res = await client.doesBucketExist({
        bucket: bucketName,
      });
      expect(res).toBe(true);

      const res2 = await client.doesBucketExist({
        bucket: `js-sdk-bucket-not-exist-${Date.now()}`,
      });
      expect(res2).toBe(false);
      await client.deleteBucket(bucketName);
    },
    NEVER_TIMEOUT
  );
});
