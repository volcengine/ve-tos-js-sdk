import path from 'path';
import fsp from 'fs/promises';
import TOS from '../../src/browser-index';
import { NEVER_TIMEOUT, testCheckErr } from '../utils';
import { tosOptions } from '../utils/options';
import { assetsPath, tmpDir } from './utils';

const client = new TOS(tosOptions);
const videoFilePath = path.resolve(assetsPath, 'videoProcessFile.mp4');
const key = 'video-process-test.mp4';

describe(`nodejs video process`, () => {
  beforeAll(async (done) => {
    await client.putObjectFromFile({
      key,
      filePath: videoFilePath,
    });
    done();
  }, NEVER_TIMEOUT);

  it(
    `video snapshot`,
    async () => {
      const filePath = path.resolve(tmpDir, 'video-process-snapshot.jpg');
      const { headers } = await client.getObjectToFile({
        key,
        process: 'video/snapshot,t_300',
        filePath,
      });
      expect(headers['content-type']).toBe('image/jpeg');
      const stat = await fsp.stat(filePath);
      expect(stat.size).toBeGreaterThan(10_000);
    },
    NEVER_TIMEOUT
  );

  it(
    `video info`,
    async () => {
      const { data } = await client.getObjectV2({
        key,
        dataType: 'buffer',
        process: 'video/info',
      });
      const info = JSON.parse(data.content.toString());
      expect(info.format.size).toBe('17899516');
      expect(+info.format.duration).toBe(51.2);
      expect(info.streams.length).toBe(2);
    },
    NEVER_TIMEOUT
  );

  it(
    `video sava as`,
    async () => {
      const newKey = 'new/video-process-test-save-as.jpg';
      {
        const { data } = await client.getObjectV2({
          key,
          dataType: 'buffer',
          process: 'video/snapshot,t_300',
          saveObject: Buffer.from(newKey).toString('base64url'),
        });
        const info = JSON.parse(data.content.toString());
        expect(info.object).toBe(newKey);
      }

      {
        const { headers } = await client.headObject(newKey);
        expect(headers['content-type']).toBe('image/jpeg');
      }

      {
        // save to a non-exist bucket
        const newBucket = 'non-exist-bucket';
        testCheckErr(
          () =>
            client.getObjectV2({
              key,
              dataType: 'buffer',
              process: 'video/snapshot,t_300',
              saveBucket: Buffer.from(newBucket).toString('base64url'),
              saveObject: Buffer.from(newKey).toString('base64url'),
            }),
          (err) => err?.statusCode === 404
        );
      }
    },
    NEVER_TIMEOUT
  );
});
