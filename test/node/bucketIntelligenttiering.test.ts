import TOS from '../../src/browser-index';
import { deleteBucket, sleepCache, NEVER_TIMEOUT } from '../utils';
import {
  tosOptions,
  isNeedDeleteBucket,
  testBucketName,
} from '../utils/options';

describe('nodejs bucket Intelligenttiering', () => {
  it(
    'Intelligenttiering getBucketIntelligenttiering',
    async () => {
      const client = new TOS({
        ...tosOptions,
      });

      const result = await client.getBucketIntelligenttiering(testBucketName);

      expect(result.data.Status).toBe(undefined);
    },
    NEVER_TIMEOUT
  );
});
