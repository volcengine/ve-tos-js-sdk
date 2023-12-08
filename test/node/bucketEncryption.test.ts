import TOS from '../../src/browser-index';
import { testBucketName, tosOptions } from '../utils/options';
import { NEVER_TIMEOUT, testCheckErr } from '../utils';

describe('nodejs bucket encryption', () => {
  it(
    'encryption putBucketEncryption',
    async () => {
      const client = new TOS({
        ...tosOptions,
      });

      await client.putBucketEncryption({
        rule: {
          ApplyServerSideEncryptionByDefault: {
            SSEAlgorithm: 'AES256',
          },
        },
      });
    },
    NEVER_TIMEOUT
  );

  it(
    'encryption getBucketEncryption',
    async () => {
      const client = new TOS({
        ...tosOptions,
      });

      await client.putBucketEncryption({
        rule: {
          ApplyServerSideEncryptionByDefault: {
            SSEAlgorithm: 'AES256',
          },
        },
      });

      const result = await client.getBucketEncryption({
        bucket: testBucketName,
      });

      expect(JSON.stringify(result.data).includes('AES256')).toBeTruthy();
    },
    NEVER_TIMEOUT
  );
  it(
    'encryption deleteBucketEncryption',
    async () => {
      const client = new TOS({
        ...tosOptions,
      });

      await client.putBucketEncryption({
        rule: {
          ApplyServerSideEncryptionByDefault: {
            SSEAlgorithm: 'AES256',
          },
        },
      });

      await client.deleteBucketEncryption({});

      await testCheckErr(() => client.getBucketEncryption({}));
    },
    NEVER_TIMEOUT
  );
});
