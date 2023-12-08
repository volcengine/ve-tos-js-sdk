import TOS, {
  StorageClassType,
  TierType,
  TosServerCode,
  TosServerError,
} from '../../src/browser-index';
import { NEVER_TIMEOUT, sleepCache } from '../utils';
import { tosOptions } from '../utils/options';

describe(`nodejs object restore`, () => {
  it(
    `archive storage class restore`,
    async () => {
      const client = new TOS(tosOptions);
      const key = 'archive-storage-class-restore';
      await client.putObject({
        key,
        storageClass: StorageClassType.StorageClassArchive,
      });

      // 1. 202
      // 2. 409
      // 3. 200
      {
        const res = await client.restoreObject({
          key,
          days: 1,
        });
        expect(res.statusCode).toBe(202);
      }

      for (;;) {
        try {
          const res = await client.restoreObject({
            key,
            days: 1,
          });
          expect(res.statusCode).toBe(200);
          break;
        } catch (err) {
          if (err instanceof TosServerError) {
            if (err.statusCode === 409) {
              await sleepCache(1_000);
              continue;
            }
          }
          throw err;
        }
      }
    },
    NEVER_TIMEOUT
  );

  it(
    `cold archive storage class restore`,
    async () => {
      const client = new TOS(tosOptions);
      const key = 'cold-archive-storage-class-restore';
      await client.putObject({
        key,
        storageClass: StorageClassType.StorageClassColdArchive,
      });

      // 1. 202
      // 2. 409
      // 3. 200
      {
        const res = await client.restoreObject({
          key,
          days: 1,
          restoreJobParameters: {
            Tier: TierType.TierExpedited,
          },
        });
        expect(res.statusCode).toBe(202);
      }

      for (;;) {
        try {
          const res = await client.restoreObject({
            key,
            days: 1,
          });
          expect(res.statusCode).toBe(200);
          break;
        } catch (err) {
          if (err instanceof TosServerError) {
            if (err.statusCode === 409) {
              await sleepCache(1_000);
              continue;
            }
          }
          throw err;
        }
      }
    },
    NEVER_TIMEOUT
  );
});
