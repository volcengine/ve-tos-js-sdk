import { VersioningStatusType } from '../../src/TosExportEnum';
import TOS from '../../src/browser-index';
import { BucketVersioningStatus } from '../../src/methods/bucket/versioning';
import { NEVER_TIMEOUT, sleepCache } from '../utils';
import { testBucketName, tosOptions } from '../utils/options';
const CommonTestCasePrefix = 'versioning';

describe(`bucket ${CommonTestCasePrefix} methods`, () => {
  it(
    'bucket versioning',
    async () => {
      const client = new TOS({
        ...tosOptions,
        bucket: testBucketName,
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
