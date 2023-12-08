import TOS from '../../src/browser-index';
import { deleteBucket, sleepCache, NEVER_TIMEOUT } from '../utils';
import {
  tosOptions,
  isNeedDeleteBucket,
  testBucketName,
} from '../utils/options';

describe('nodejs listObjectsType2', () => {
  it(
    'listObjectsType2',
    async () => {
      const client = new TOS({
        ...tosOptions,
      });

      const key = 'listObjectsType2-test';
      for (let index = 0; index < 50; index++) {
        await client.putObject({
          bucket: testBucketName,
          key: key + index,
          body: Buffer.from('hello world'),
        });
      }

      const resultOnce = await client.listObjectsType2({
        bucket: testBucketName,
        prefix: key,
        listOnlyOnce: true,
        maxKeys: 100,
      });
      console.log(
        '%c [ resultOnce ]-76',
        'font-size:13px; background:pink; color:#bf2c9f;',
        resultOnce.data.KeyCount
      );
      expect(resultOnce.data.KeyCount).toBe(50);

      const result = await client.listObjectsType2({
        bucket: testBucketName,
        prefix: key,
        listOnlyOnce: false,
        maxKeys: 10,
      });
      console.log(
        '%c [ result.data ]-83',
        'font-size:13px; background:pink; color:#bf2c9f;',
        result.data
      );

      expect(result.data.KeyCount).toBe(10);
      expect(result.data.Contents.length).toBe(10);
    },
    NEVER_TIMEOUT
  );
});
