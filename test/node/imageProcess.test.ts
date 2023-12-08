import path from 'path';
import fsp from 'fs/promises';
import TOS from '../../src/browser-index';
import { NEVER_TIMEOUT, testCheckErr } from '../utils';
import { tosOptions } from '../utils/options';
import { assetsPath, tmpDir } from './utils';

const client = new TOS(tosOptions);
const imageFilePath = path.resolve(assetsPath, 'imageProcessFile.png');
const abnormalImageFilePath = path.resolve(
  assetsPath,
  'imageProcessAbnormal.png'
);
const key = 'image-process-test.png';
const abnormalKey = 'image-process-abnormal-test.png';

describe(`nodejs image process`, () => {
  beforeAll(async (done) => {
    await client.putObjectFromFile({
      key,
      filePath: imageFilePath,
    });
    await client.putObjectFromFile({
      key: abnormalKey,
      filePath: abnormalImageFilePath,
    });
    done();
  }, NEVER_TIMEOUT);

  it(
    `image resize and format`,
    async () => {
      const { data, headers } = await client.getObjectV2({
        key,
        dataType: 'buffer',
        process: 'image/resize,h_10/format,jpg',
      });
      expect(data.content.length).toBeLessThan(10_000);
      expect(headers['content-type']).toBe('image/jpeg');
    },
    NEVER_TIMEOUT
  );

  it(
    `image resize, format and save to local`,
    async () => {
      const filePath = path.resolve(tmpDir, 'image-process-resize-format.jpg');
      const { headers } = await client.getObjectToFile({
        key,
        process: 'image/resize,h_10/format,jpg',
        filePath,
      });
      expect(headers['content-type']).toBe('image/jpeg');
      const stat = await fsp.stat(filePath);
      expect(stat.size).toBeLessThan(10_000);
    },
    NEVER_TIMEOUT
  );

  it(
    `image info`,
    async () => {
      const { data } = await client.getObjectV2({
        key,
        dataType: 'buffer',
        process: 'image/info',
      });
      const info = JSON.parse(data.content.toString());
      expect(info.Format.value).toBe('png');
      expect(info.ImageWidth.value).toBe('1023');
      expect(info.ImageHeight.value).toBe('683');
      expect(info.FileSize.value).toBe('438212');
    },
    NEVER_TIMEOUT
  );

  it(
    `image inspect`,
    async () => {
      {
        const { data } = await client.getObjectV2({
          key,
          dataType: 'buffer',
          process: 'image/inspect',
        });
        const info = JSON.parse(data.content.toString());
        expect(info.picSize).toBe(438212);
        expect(info.picType).toBe('png');
        expect(info.suspicious).toBe(false);
      }

      {
        const { data } = await client.getObjectV2({
          key: abnormalKey,
          dataType: 'buffer',
          process: 'image/inspect',
        });
        const info = JSON.parse(data.content.toString());
        expect(info.picSize).toBe(3055377);
        expect(info.picType).toBe('png');
        expect(info.suspicious).toBe(true);
        expect(info.suspiciousType).toBe('MPEG-TS');
      }
    },
    NEVER_TIMEOUT
  );

  it(
    `image sava as`,
    async () => {
      const newKey = 'new/image-process-test-save-as.jpg';
      {
        const { data } = await client.getObjectV2({
          key,
          dataType: 'buffer',
          process: 'image/resize,h_10/format,jpg',
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
              process: 'image/resize,h_10/format,jpg',
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
