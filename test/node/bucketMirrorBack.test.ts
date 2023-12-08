import TOS from '../../src/browser-index';
import { deleteBucket, sleepCache, NEVER_TIMEOUT } from '../utils';
import {
  tosOptions,
  isNeedDeleteBucket,
  testBucketName,
} from '../utils/options';
const CommonTestCasePrefix = 'mirror';

describe('nodejs bucket MirrorBack', () => {
  it(
    `${CommonTestCasePrefix} getBucketMirrorBack empty case`,
    async () => {
      const client = new TOS({
        ...tosOptions,
      });

      try {
        const result = await client.getBucketMirrorBack({
          bucket: testBucketName,
        });

        expect(result.data.Rules?.length).toBe(0);
      } catch (error) {
        expect(error).toBeTruthy();
      }
    },
    NEVER_TIMEOUT
  );
  it(
    `${CommonTestCasePrefix} putBucketMirrorBack`,
    async () => {
      const client = new TOS({
        ...tosOptions,
      });

      const result = await client.putBucketMirrorBack({
        bucket: testBucketName,
        rules: [
          {
            ID: '1',
            Condition: {
              HttpCode: 404,
              KeyPrefix: 'object-key-prefix',
              KeySuffix: 'object-key-suffix',
            },
            Redirect: {
              RedirectType: 'Mirror',
              FetchSourceOnRedirect: false,
              PublicSource: {
                SourceEndpoint: {
                  Primary: ['http://abc.123/'],
                },
              },
              PassQuery: true,
              FollowRedirect: true,
              MirrorHeader: {
                PassAll: true,
                Pass: ['aaa', 'bbb'],
                Remove: ['xxx', 'yyy'],
              },
              Transform: {
                WithKeyPrefix: 'addtional-key-prefix',
                WithKeySuffix: 'addtional-key-suffix',
                ReplaceKeyPrefix: {
                  KeyPrefix: 'key-prefix',
                  ReplaceWith: 'replace-with',
                },
              },
            },
          },
        ],
      });

      expect(result.data).toBe('');
    },
    NEVER_TIMEOUT
  );

  it(
    `${CommonTestCasePrefix} getBucketMirrorBack`,
    async () => {
      const client = new TOS({
        ...tosOptions,
      });

      await client.putBucketMirrorBack({
        bucket: testBucketName,
        rules: [
          {
            ID: '1',
            Condition: {
              HttpCode: 404,
              KeyPrefix: 'object-key-prefix',
              KeySuffix: 'object-key-suffix',
            },
            Redirect: {
              RedirectType: 'Mirror',
              FetchSourceOnRedirect: false,
              PublicSource: {
                SourceEndpoint: {
                  Primary: ['http://abc.123/'],
                },
              },
              PassQuery: true,
              FollowRedirect: true,
              MirrorHeader: {
                PassAll: true,
                Pass: ['aaa', 'bbb'],
                Remove: ['xxx', 'yyy'],
              },
              Transform: {
                WithKeyPrefix: 'addtional-key-prefix',
                WithKeySuffix: 'addtional-key-suffix',
                ReplaceKeyPrefix: {
                  KeyPrefix: 'key-prefix',
                  ReplaceWith: 'replace-with',
                },
              },
            },
          },
        ],
      });

      const result = await client.getBucketMirrorBack({
        bucket: testBucketName,
      });

      expect(result.data.Rules.length).toBe(1);
      expect(result.data.Rules.at(0)?.ID).toBe('1');
    },
    NEVER_TIMEOUT
  );

  it(
    `${CommonTestCasePrefix} deleteBucketMirrorBack`,
    async () => {
      const client = new TOS({
        ...tosOptions,
      });

      const result = await client.deleteBucketMirrorBack({
        bucket: testBucketName,
      });

      expect(result.data).toBe('');
    },
    NEVER_TIMEOUT
  );
});
