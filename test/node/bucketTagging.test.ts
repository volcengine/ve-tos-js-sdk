import TOS from '../../src/browser-index';
import { NEVER_TIMEOUT, sleepCache } from '../utils';
import { testBucketName, tosOptions } from '../utils/options';
const CommonTestCasePrefix = 'tagging';

describe(`bucket tagging methods`, () => {
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

  it('create bucket with tagging', async () => {
    const bucketName = `js-sdk-tagging` + Date.now();
    const client = new TOS({
      ...tosOptions,
    });
    const result = await client.createBucket({
      bucket: bucketName,
      tagging: 'k1=v1&k2=v2',
    });
    expect(result.statusCode).toBe(200);

    const taggingResult = await client.getBucketTagging({
      bucket: bucketName,
    });
    expect(taggingResult.data.TagSet.Tags.length).toBe(2);
    expect(taggingResult.data.TagSet.Tags?.[0].Key).toBe('k1');
    expect(taggingResult.data.TagSet.Tags?.[0].Value).toBe('v1');
    expect(taggingResult.data.TagSet.Tags?.[1].Key).toBe('k2');
    expect(taggingResult.data.TagSet.Tags?.[1].Value).toBe('v2');
    await client.deleteBucket(bucketName);
  });
});
