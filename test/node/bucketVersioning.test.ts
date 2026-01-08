import { VersioningStatusType } from '../../src/TosExportEnum';
import TOS from '../../src/browser-index';
import { BucketVersioningStatus } from '../../src/methods/bucket/versioning';
import { NEVER_TIMEOUT, deleteBucket, sleepCache } from '../utils';
import { tosOptions } from '../utils/options';

const TEST_BUCKET = 'version-' + Date.now();
const client = new TOS(tosOptions);

describe(`bucket versioning methods`, () => {
  beforeAll(async (done) => {
    await client.createBucket({ bucket: TEST_BUCKET });
    done();
  }, NEVER_TIMEOUT);

  afterAll(async (done) => {
    await client.deleteBucket(TEST_BUCKET);
    done();
  }, NEVER_TIMEOUT);

  it(
    'bucket versioning',
    async () => {
      const res1 = await client.getBucketVersioning(TEST_BUCKET);
      expect(res1.data.Status).toEqual(BucketVersioningStatus.NotSet);

      let putRes = await client.putBucketVersioning({
        bucket: TEST_BUCKET,
        status: BucketVersioningStatus.Enabled,
      });
      expect(putRes.statusCode).toEqual(200);

      const res2 = await client.getBucketVersioning(TEST_BUCKET);
      expect(res2.data.Status).toEqual(BucketVersioningStatus.Enabled);

      // wait for the status to be updated
      while (true) {
        try {
          putRes = await client.putBucketVersioning({
            bucket: TEST_BUCKET,
            status: BucketVersioningStatus.Suspended,
          });
          expect(putRes.statusCode).toEqual(200);
          break;
        } catch (e) {
          await sleepCache(1000);
        }
      }

      const res3 = await client.getBucketVersioning(TEST_BUCKET);
      expect(res3.data.Status).toEqual(BucketVersioningStatus.Suspended);
    },
    NEVER_TIMEOUT
  );
});
