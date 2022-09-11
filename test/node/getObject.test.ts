import path from 'path';
import fs from 'fs';
import TOS from '../../src/browser-index';
import { deleteBucket, sleepCache, NEVER_TIMEOUT } from '../utils';
import {
  testBucketName,
  isNeedDeleteBucket,
  tosOptions,
} from '../utils/options';
import { tmpDir } from './utils';
import { promisify } from 'util';

describe('getObject data transfer in node.js environment', () => {
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
    await sleepCache();
    done();
  }, NEVER_TIMEOUT);

  it(
    'getObjectToFile',
    async () => {
      const client = new TOS(tosOptions);
      const key = 'getObjectToFile-putObject';
      const content = 'abc'.repeat(1000);
      await client.putObject({
        body: Buffer.from(content),
        key,
      });

      const filePath = path.resolve(tmpDir, 'abc');
      await fs.unlink(filePath, () => {});
      await client.getObjectToFile({
        key,
        filePath: path.resolve(tmpDir, 'abc'),
      });
      const stats = await promisify(fs.stat)(filePath);
      expect(stats.size).toEqual(content.length);
    },
    NEVER_TIMEOUT
  );
});
