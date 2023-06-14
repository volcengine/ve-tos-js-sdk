import TOS from '../../src/browser-index';
import { deleteBucket, sleepCache, NEVER_TIMEOUT } from '../utils';
import {
  tosOptions,
  isNeedDeleteBucket,
  testBucketName,
} from '../utils/options';
import { objectKey1K, objectPath1K } from './utils';
const CommonTestCasePrefix = 'tagging';

const key = `getObject-${objectKey1K}`;

describe('nodejs connection params', () => {
  beforeAll(async done => {
    const client = new TOS(tosOptions);
    // clear all bucket
    const { data: buckets } = await client.listBuckets();
    for (const bucket of buckets.Buckets) {
      if (isNeedDeleteBucket(bucket.Name)) {
        try {
          await deleteBucket(client, bucket.Name);
        } catch (err) {
          console.log('a: ', err);
        }
      }
    }
    // create bucket
    await client.createBucket({
      bucket: testBucketName,
    });
    await sleepCache(100);
    await client.putObjectFromFile({ key, filePath: objectPath1K });

    done();
  }, NEVER_TIMEOUT);

  it(
    `${CommonTestCasePrefix} putObjectTagging`,
    async () => {
      const client = new TOS({
        ...tosOptions,
      });

      const result = await client.putObjectTagging({
        bucket: testBucketName,
        key,
        tagSet: {
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
      });

      expect(result.data).toBe('');
    },
    NEVER_TIMEOUT
  );

  it(
    `${CommonTestCasePrefix} getObjectTagging`,
    async () => {
      const client = new TOS({
        ...tosOptions,
      });

      const result = await client.getObjectTagging({
        bucket: testBucketName,
        key,
      });

      expect(result.data.TagSet.Tags.length).toBe(2);
      expect(result.data.TagSet.Tags.at(0)?.Key).toBe('aa');
    },
    NEVER_TIMEOUT
  );

  it(
    `${CommonTestCasePrefix} deleteObjectTagging`,
    async () => {
      const client = new TOS({
        ...tosOptions,
      });

      const result = await client.deleteObjectTagging({
        bucket: testBucketName,
        key,
      });

      expect(result.data).toBe('');
    },
    NEVER_TIMEOUT
  );
});
