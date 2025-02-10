import TOS from '../../src/browser-index';
import { NEVER_TIMEOUT } from '../utils';
import { tosOptions } from '../utils/options';
import { objectPath10M, objectKey10M } from './utils';

const key = `source-${objectKey10M}`;
const encodeKey = 'source-中文-2Mfile.txt';
const symlinkKey = `symlink-${objectKey10M}`;
const targetBucket = 'symlink-target-bucket';

describe('putSymlink', () => {
  beforeAll(async (done) => {
    const client = new TOS(tosOptions);
    await client.putObjectFromFile({ key, filePath: objectPath10M });
    await client.putObjectFromFile({ key: encodeKey, filePath: objectPath10M });
    await client.createBucket({ bucket: targetBucket });
    done();
  }, NEVER_TIMEOUT);

  it(
    'putSymlink current bucket',
    async () => {
      const client = new TOS(tosOptions);
      await client.putSymlink({
        key: symlinkKey,
        symLinkTargetKey: key,
      });
      const { data } = await client.headObject({ key: symlinkKey });
      expect(data).toBeDefined();
    },
    NEVER_TIMEOUT
  );

  it(
    'putSymlink other bucket',
    async () => {
      const client = new TOS(tosOptions);
      await client.putSymlink({
        key: symlinkKey,
        bucket: targetBucket,
        symLinkTargetKey: key,
        symLinkTargetBucket: tosOptions.bucket,
      });
      const { data } = await client.headObject({
        key: symlinkKey,
        bucket: targetBucket,
      });
      expect(data).toBeDefined();
    },
    NEVER_TIMEOUT
  );

  it(
    'putSymlink encode',
    async () => {
      const client = new TOS(tosOptions);
      await client.putSymlink({
        key: 'putSymlink-link-encode',
        symLinkTargetKey: encodeKey,
      });
      const { data } = await client.headObject({
        key: 'putSymlink-link-encode',
      });
      expect(data).toBeDefined();
    },
    NEVER_TIMEOUT
  );
});
