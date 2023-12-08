import TOS from '../../src/browser-index';
import { NEVER_TIMEOUT } from '../utils';
import { tosOptions } from '../utils/options';
import { objectKey10M, objectPath10M, objectPath1M } from './utils';

describe('test crc64', () => {
  it('case 1', async () => {});

  it(
    'putObject with crc',
    async () => {
      const key = `${objectKey10M}-put-with-crc`;
      const client = new TOS({ ...tosOptions, enableCRC: true });

      await client.putObjectFromFile({
        filePath: objectPath10M,
        key,
      });

      const { data } = await client.headObject(key);
      expect(+data['content-length'] === 10 * 1024 * 1024).toBeTruthy();
    },
    NEVER_TIMEOUT
  );

  it(
    'uploadFile with crc',
    async () => {
      const key = `${objectKey10M}-uploadFile-with-crc`;
      const client = new TOS({ ...tosOptions, enableCRC: true });

      await client.uploadFile({
        file: objectPath10M,
        key,
      });

      const { data } = await client.headObject(key);
      expect(+data['content-length'] === 10 * 1024 * 1024).toBeTruthy();
    },
    NEVER_TIMEOUT
  );

  it(
    'downLoadFile with crc',
    async () => {
      const key = `${objectPath1M}-put-with-crc`;
      const client = new TOS({ ...tosOptions });

      await client.putObjectFromFile({
        filePath: objectPath1M,
        key,
      });

      const downloadClient = new TOS({ ...tosOptions, enableCRC: true });

      await downloadClient.downloadFile({
        key,
        filePath: './test/node/tmp/downloadFile/',
        partSize: 100 * 1024,
      });

      const { data } = await client.headObject(key);
      expect(+data['content-length'] === 1 * 1024 * 1024).toBeTruthy();
    },
    NEVER_TIMEOUT
  );
});
