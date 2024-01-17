import TOS from '../../src/browser-index';
import { NEVER_TIMEOUT } from '../utils';
import { testBucketName, tosOptions } from '../utils/options';
import { objectKey1K, objectPath1K } from './utils';

const key = `getObject-${objectKey1K}`;

describe('customDomain test environment', () => {
  beforeAll(async (done) => {
    const client = new TOS(tosOptions);
    await client.putObjectFromFile({
      key,
      filePath: objectPath1K,
    });

    done();
  }, NEVER_TIMEOUT);

  it(
    'headObject by default',
    async () => {
      const client = new TOS(tosOptions);

      const res = await client.headObject({
        key,
      });

      expect(+res.data['content-length']).toBe(1024);
    },
    NEVER_TIMEOUT
  );

  it(
    'headObject by CustomDomain without bucket',
    async () => {
      const client = new TOS({ ...tosOptions, isCustomDomain: true });
      let errCount = 0;
      let successCount = 0;
      try {
        const res = await client.headObject({
          key,
        });
        successCount++;
      } catch (error) {
        errCount++;
      }
      expect(errCount).toBe(1);
      expect(successCount).toBe(0);
    },
    NEVER_TIMEOUT
  );

  it(
    'headObject CustomDomain with bucket prefix',
    async () => {
      const oriClient = new TOS(tosOptions);

      const client = new TOS({
        ...tosOptions,
        isCustomDomain: true,
        endpoint: `${testBucketName}.${oriClient.opts.endpoint}`,
      });

      const res = await client.headObject({
        key,
      });

      expect(+res.data['content-length']).toBe(1024);
    },
    NEVER_TIMEOUT
  );
});
