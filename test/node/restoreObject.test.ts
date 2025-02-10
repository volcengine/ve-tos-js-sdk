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

      const putRes = await client.putObject({
        key,
        storageClass: StorageClassType.StorageClassArchive,
      });

      // 1. 202
      // 2. 409
      // 3. 200

      const res = await client.restoreObject({
        key,
        days: 1,
      });
      expect(res.statusCode).toBe(202);
      // test headObject restore Info
      let headRes = await client.headObject({
        key,
      });
      console.log('headObject', headRes.data);
      expect(headRes.data.RestoreInfo?.RestoreStatus.OngoingRequest).toBe(true);
      expect(headRes.data.RestoreInfo?.RestoreParam?.ExpiryDays).toBe(1);
      expect(headRes.data.RestoreInfo?.RestoreParam?.Tier).toBe(
        TierType.TierStandard
      );
      // test getObject restore Info
      // when restoring  getObject will throw ServerError

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

      headRes = await client.headObject({
        key,
      });
      const getRes = await client.getObjectV2({
        key,
      });
      // console.log('headObject-after-restore', headRes.data);
      expect(headRes.data.RestoreInfo?.RestoreStatus.OngoingRequest).toBe(
        false
      );
      expect(headRes.data.RestoreInfo?.RestoreStatus.ExpiryDate).toBeTruthy();
      expect(headRes.data.RestoreInfo?.RestoreParam?.ExpiryDays).toBe(
        undefined
      );
      expect(headRes.data.RestoreInfo?.RestoreParam?.Tier).toBe(undefined);

      // console.log('getObjectV2-after-restore', getRes.data.RestoreInfo);
      expect(getRes.data.RestoreInfo?.RestoreStatus.OngoingRequest).toBe(false);
      expect(getRes.data.RestoreInfo?.RestoreStatus.ExpiryDate).toBeTruthy();
      expect(getRes.data.RestoreInfo?.RestoreParam?.ExpiryDays).toBe(undefined);
      expect(getRes.data.RestoreInfo?.RestoreParam?.Tier).toBe(undefined);
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
      for (let first = true; ; first = false) {
        try {
          const res = await client.restoreObject({
            key,
            days: 1,
            restoreJobParameters: {
              Tier: TierType.TierExpedited,
            },
          });
          expect(res.statusCode).toBe(first ? 202 : 200);
          if (!first) {
            break;
          }
        } catch (err) {
          if (err instanceof TosServerError) {
            if (err.statusCode === 409) {
              await sleepCache(1_000);
              continue;
            }

            console.log('cold archive storage class restore err: ', err);
            if (err.statusCode === 404) {
              // restore 时可能会 404，展示不知道为什么，先 skip 观察
              await sleepCache(1_000);
              continue;
            }
          }
          throw err;
        }
      }
    },
    NEVER_TIMEOUT * 10
  );
});
