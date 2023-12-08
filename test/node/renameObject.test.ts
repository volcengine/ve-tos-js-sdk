import { TOS } from '../../src/index';
import { safeAwait } from '../../src/utils';
import { NEVER_TIMEOUT, sleepCache } from '../utils';
import {
  tosOptions as commonTosOptions,
  testBucketRenameBucketName,
} from '../utils/options';
import { objectPath1K } from './utils';

const tosOptions = {
  ...commonTosOptions,
  bucket: testBucketRenameBucketName,
};

describe('renameObject in node.js environment', () => {
  it(
    'renameObject',
    async () => {
      const client = new TOS(tosOptions);
      const oldKey = 'test-rename-object-old-key';
      const newKey = 'test-rename-object-new-key';
      await client.putBucketRename({ renameEnable: true });
      await sleepCache(60_000);
      await safeAwait(client.deleteObject(newKey));

      await client.putObjectFromFile({ key: oldKey, filePath: objectPath1K });
      const { data: headData } = await client.headObject(oldKey);
      expect(headData['content-length']).not.toEqual(0);

      await client.renameObject({ key: oldKey, newKey });
      await client.putObjectFromFile({ key: oldKey, filePath: objectPath1K });
      const { data: headData2 } = await client.headObject(oldKey);
      expect(headData2['content-length']).not.toEqual(0);
    },
    NEVER_TIMEOUT
  );
});
