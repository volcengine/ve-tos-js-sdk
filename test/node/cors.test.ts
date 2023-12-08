import TOS, { HttpMethodType } from '../../src/browser-index';
import { deleteBucket, sleepCache, NEVER_TIMEOUT } from '../utils';
import {
  tosOptions,
  isNeedDeleteBucket,
  testBucketName,
} from '../utils/options';

describe('nodejs bucket CORS', () => {
  it(
    'cors putBucketCORS',
    async () => {
      const client = new TOS({
        ...tosOptions,
      });

      const result = await client.putBucketCORS({
        bucket: testBucketName,
        CORSRules: [
          {
            AllowedOrigins: ['*'],
            AllowedMethods: [
              HttpMethodType.HttpMethodPut,
              HttpMethodType.HttpMethodGet,
              HttpMethodType.HttpMethodDelete,
              HttpMethodType.HttpMethodPost,
              HttpMethodType.HttpMethodHead,
            ],
            AllowedHeaders: ['Authorization'],
            ExposeHeaders: ['x-tos-test'],
            MaxAgeSeconds: 1024,
          },
        ],
      });

      expect(result.data).toBe('');
    },
    NEVER_TIMEOUT
  );

  it(
    'cors getBucketCORS',
    async () => {
      const client = new TOS({
        ...tosOptions,
      });

      const result = await client.getBucketCORS({
        bucket: testBucketName,
      });

      expect(result.data.CORSRules.length).toBeGreaterThan(0);
    },
    NEVER_TIMEOUT
  );

  it(
    'cors deleteBucketCORS',
    async () => {
      const client = new TOS({
        ...tosOptions,
      });

      const result = await client.deleteBucketCORS({
        bucket: testBucketName,
      });

      expect(result.data).toBe('');
    },
    NEVER_TIMEOUT
  );
});
