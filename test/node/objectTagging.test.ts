import TOS from '../../src/browser-index';
import { NEVER_TIMEOUT } from '../utils';
import { tosOptions, testBucketName } from '../utils/options';
import { objectKey1K } from './utils';
const CommonTestCasePrefix = 'tagging';

const key = `object-tagging-${objectKey1K}`;

describe(`nodejs object ${CommonTestCasePrefix}`, () => {
  it(
    `${CommonTestCasePrefix} get/set/delete`,
    async () => {
      const client = new TOS(tosOptions);
      await client.putObject(key);

      {
        // there is no tagging
        const result = await client.getObjectTagging({
          bucket: testBucketName,
          key,
        });
        expect(result.data.TagSet.Tags.length).toBe(0);
      }

      await client.putObjectTagging({
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

      {
        const result = await client.getObjectTagging({
          bucket: testBucketName,
          key,
        });

        expect(result.data.TagSet.Tags.length).toBe(2);
        expect(result.data.TagSet.Tags.at(0)?.Key).toBe('aa');
      }

      await client.deleteObjectTagging({
        bucket: testBucketName,
        key,
      });

      {
        // there is no tagging
        const result = await client.getObjectTagging({
          bucket: testBucketName,
          key,
        });
        expect(result.data.TagSet.Tags.length).toBe(0);
      }
    },
    NEVER_TIMEOUT
  );
});
