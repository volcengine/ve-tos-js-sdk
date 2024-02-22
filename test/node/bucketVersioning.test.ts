import { VersioningStatusType } from '../../src/TosExportEnum';
import TOS from '../../src/browser-index';
import { BucketVersioningStatus } from '../../src/methods/bucket/versioning';
import { NEVER_TIMEOUT, deleteBucket, sleepCache } from '../utils';
import {
  tosOptions as commonTosOptions,
  testBucketNameBase,
} from '../utils/options';
const CommonTestCasePrefix = 'versioning';

const bucketNamePrefix = `${testBucketNameBase}-test-bucket-versioning`;
const bucketName = `${bucketNamePrefix}-${new Date().valueOf()}`;
const tosOptions = {
  ...commonTosOptions,
  bucket: bucketName,
};

describe(`bucket ${CommonTestCasePrefix} methods`, () => {
  beforeAll(async (done) => {
    const client = new TOS(tosOptions);
    const { data: buckets } = await client.listBuckets();
    for (const bucket of buckets.Buckets) {
      if (bucket.Name.startsWith(bucketNamePrefix)) {
        await deleteBucket(bucket);
      }
    }
    await client.createBucket({ bucket: bucketName });
    done();
  }, NEVER_TIMEOUT);

  it(
    'bucket versioning',
    async () => {
      // wait bucket exist
      await sleepCache(60_000);

      const client = new TOS({
        ...tosOptions,
      });

      {
        const { data } = await client.getBucketVersioning();
        expect(data.Status).toEqual(BucketVersioningStatus.Disable);
        expect(data.Status).toEqual(BucketVersioningStatus.NotSet);
      }

      {
        await client.putBucketVersioning({
          status: BucketVersioningStatus.Enable,
        });
        await sleepCache();
        const { data } = await client.getBucketVersioning();
        expect(data.Status).toEqual(BucketVersioningStatus.Enable);
        expect(data.Status).toEqual(BucketVersioningStatus.Enabled);
      }

      {
        // more wait, maybe cache
        await sleepCache(60_000);
        await client.putBucketVersioning({
          status: BucketVersioningStatus.Suspended,
        });
        await sleepCache();
        const { data } = await client.getBucketVersioning();
        expect(data.Status).toEqual(BucketVersioningStatus.Suspended);
      }
    },
    NEVER_TIMEOUT
  );
});
