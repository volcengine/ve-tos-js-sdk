import TOS, { VersioningStatusType } from '../../src/browser-index';
import { NEVER_TIMEOUT, sleepCache } from '../utils';
import { tosOptions } from '../utils/options';
import { objectKey1M, objectPath1M } from './utils';

const key = `${objectKey1M}-putSymLink-${new Date().getTime()}`;
const symLinkKey = `${key}-symlink`;

const file1 = `${objectKey1M}-file2`;
const file2 = `${objectKey1M}-file3`;

const symLinkMulTargetKey = `test-symlink`;

describe('getSymlink', () => {
  beforeAll(async (done) => {
    const client = new TOS(tosOptions);
    await client.putObjectFromFile({ key, filePath: objectPath1M });
    await client.putObjectFromFile({ key: file1, filePath: objectPath1M });
    await client.putObjectFromFile({ key: file2, filePath: objectPath1M });
    done();
  }, NEVER_TIMEOUT);

  it(
    'getSymlink',
    async () => {
      const client = new TOS(tosOptions);
      await client.putSymlink({ key: symLinkKey, symLinkTargetKey: key });
      const { data } = await client.getSymlink({
        key: symLinkKey,
      });
      expect(data.SymlinkTargetKey).toBe(key);
    },
    NEVER_TIMEOUT
  );

  it(
    'getSymlink mul version',
    async () => {
      const client = new TOS(tosOptions);
      await client.putBucketVersioning({
        status: VersioningStatusType.Enabled,
      });
      // 等着多版本开启并生效
      await sleepCache(60_000);

      const symlink1 = await client.putSymlink({
        key: symLinkKey,
        symLinkTargetKey: file1,
      });
      const symlin2 = await client.putSymlink({
        key: symLinkKey,
        symLinkTargetKey: file2,
      });
      const linkInfo1 = await client.getSymlink({
        key: symLinkKey,
        versionId: symlink1.data.VersionID,
      });
      const linkInfo2 = await client.getSymlink({
        key: symLinkKey,
        versionId: symlin2.data.VersionID,
      });
      expect(linkInfo1.data.SymlinkTargetKey).toBe(file1);
      expect(linkInfo2.data.SymlinkTargetKey).toBe(file2);
    },
    NEVER_TIMEOUT
  );
});
