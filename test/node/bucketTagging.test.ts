import TOS from '../../src/browser-index';
import { NEVER_TIMEOUT, sleepCache } from '../utils';
import { testBucketName, tosOptions } from '../utils/options';
import { clearAllTestBucket } from './utils';
const CommonTestCasePrefix = 'tagging';

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

  it(
    `${CommonTestCasePrefix} getBucketTagging empty error`,
    async () => {
      const client = new TOS({
        ...tosOptions,
      });

      try {
        const result = await client.getBucketTagging({
          bucket: testBucketName,
        });
        expect(result.data.TagSet.Tags.length).toBe(0);
      } catch (error) {
        expect(error).toBeTruthy();
      }
    },
    NEVER_TIMEOUT
  );
  it(
    `${CommonTestCasePrefix} putBucketTagging`,
    async () => {
      const client = new TOS({
        ...tosOptions,
      });

      const result = await client.putBucketTagging({
        bucket: testBucketName,
        tagging: {
          TagSet: {
            Tags: [
              {
                Key: 'aa',
                Value: 'bb',
              },
              {
                Key: 'bb',
                Value: 'cc',
              },
            ],
          },
        },
      });

      expect(result.data).toBe('');
    },
    NEVER_TIMEOUT
  );

  it(
    `${CommonTestCasePrefix} getBucketTagging`,
    async () => {
      const client = new TOS({
        ...tosOptions,
      });

      const result = await client.getBucketTagging({
        bucket: testBucketName,
      });

      expect(result.data.TagSet).toBeTruthy();
      expect(result.data.TagSet.Tags.at(0)?.Key).toBe('aa');
    },
    NEVER_TIMEOUT
  );

  it(
    `${CommonTestCasePrefix} deleteBucketTagging`,
    async () => {
      const client = new TOS({
        ...tosOptions,
      });

      const result = await client.deleteBucketTagging({
        bucket: testBucketName,
      });

      expect(result.data).toBe('');
    },
    NEVER_TIMEOUT
  );
});
