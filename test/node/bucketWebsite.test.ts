import TOS from '../../src/browser-index';
import { NEVER_TIMEOUT, sleepCache } from '../utils';
import { testBucketName, tosOptions } from '../utils/options';
import { clearAllTestBucket } from './utils';
const CommonTestCasePrefix = 'website';

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
    `${CommonTestCasePrefix} getBucketWebsite empty case`,
    async () => {
      const client = new TOS({
        ...tosOptions,
      });

      try {
        const result = await client.getBucketWebsite({
          bucket: testBucketName,
        });

        expect(result.data.RoutingRules?.length).toBe(0);
        expect(result.data.ErrorDocument).toBe(undefined);
      } catch (error) {
        expect(error).toBeTruthy();
      }
    },
    NEVER_TIMEOUT
  );
  it(
    `${CommonTestCasePrefix} putBucketWebsite`,
    async () => {
      const client = new TOS({
        ...tosOptions,
      });

      const result = await client.putBucketWebsite({
        bucket: testBucketName,
        // redirectAllRequestsTo: {
        //   HostName: 'example.com',
        //   Protocol: 'https',
        // },
        indexDocument: {
          Suffix: 'index.html',
          ForbiddenSubDir: false,
        },
        errorDocument: {
          Key: 'error.html',
        },
        routingRules: [
          {
            Condition: {
              HttpErrorCodeReturnedEquals: 404,
              KeyPrefixEquals: 'red/',
            },
            Redirect: {
              HostName: 'example.com',
              HttpRedirectCode: 301,
              Protocol: 'http',
              ReplaceKeyPrefixWith: 'redirect/',
              // ReplaceKeyWith: 'redirect.html',
            },
          },
        ],
      });

      expect(result.data).toBe('');
    },
    NEVER_TIMEOUT
  );

  it(
    `${CommonTestCasePrefix} getBucketWebsite`,
    async () => {
      const client = new TOS({
        ...tosOptions,
      });

      const result = await client.getBucketWebsite({
        bucket: testBucketName,
      });

      expect(result.data.RedirectAllRequestsTo).toBeFalsy();
      expect(result.data.ErrorDocument?.Key).toBe('error.html');
      expect(result.data.IndexDocument?.Suffix).toBe('index.html');
      expect(result.data.RoutingRules?.length).toBe(1);
    },
    NEVER_TIMEOUT
  );

  it(
    `${CommonTestCasePrefix} deleteBucketWebsite`,
    async () => {
      const client = new TOS({
        ...tosOptions,
      });

      const result = await client.deleteBucketWebsite({
        bucket: testBucketName,
      });

      expect(result.data).toBe('');
    },
    NEVER_TIMEOUT
  );
});
