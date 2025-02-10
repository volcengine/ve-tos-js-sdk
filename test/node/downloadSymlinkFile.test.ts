import fsp from 'fs/promises';
import path from 'path';
import TOS from '../../src/browser-index';
import { NEVER_TIMEOUT, sleepCache } from '../utils';
import { tosSymlinkOptions } from '../utils/options';
import { downloadFileDir, objectKey10M, objectPath10M } from './utils';

describe('downloadSymlinkFile', () => {
  beforeAll(async (done) => {
    const client = new TOS(tosSymlinkOptions);
    await client.uploadFile({
      file: objectPath10M,
      key: objectKey10M,
      taskNum: 10,
    });
    await sleepCache(3 * 1000);
    await client.putSymlink({
      symLinkTargetKey: objectKey10M,
      key: 'symlink' + objectKey10M,
    });
    done();
  }, NEVER_TIMEOUT);

  it(
    'download symlink file',
    async () => {
      const client = new TOS({ ...tosSymlinkOptions, enableCRC: true });
      const symlinkKey = 'symlink' + objectKey10M;
      await client.downloadFile({
        filePath: downloadFileDir,
        key: symlinkKey,
        taskNum: 5,
      });
      const { size } = await fsp.stat(
        path.resolve(downloadFileDir, symlinkKey)
      );
      expect(size).toEqual(10 * 1024 * 1024);
    },
    NEVER_TIMEOUT
  );
});
