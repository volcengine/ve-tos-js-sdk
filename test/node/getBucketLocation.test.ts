import TOS from '../../src/browser-index';
import { deleteBucket, sleepCache, NEVER_TIMEOUT } from '../utils';
import {
  tosOptions,
  isNeedDeleteBucket,
  testBucketName,
} from '../utils/options';

describe('nodejs bucket location', () => {
  it(
    'getBucketLocation',
    async () => {
      const client = new TOS({
        ...tosOptions,
        autoRecognizeContentType: false,
      });

      const result = await client.getBucketLocation({
        bucket: testBucketName,
      });

      expect(result.data.ExtranetEndpoint).toBeTruthy();
    },
    NEVER_TIMEOUT
  );
});
