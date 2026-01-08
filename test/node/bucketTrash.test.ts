import TOS from '../../src/browser-index';
import { NEVER_TIMEOUT } from '../utils';
import { tosHNSOptions } from '../utils/options';
// 线上的桶
describe('bucketTrash', () => {
  it.skip(
    'open trash',
    async () => {
      const client = new TOS(tosHNSOptions);
      await client.putBucketTrash({
        Trash: {
          TrashPath: '/.Trash-666',
          CleanInterval: 8,
          Status: 'Enabled',
        },
      });
      const trash = await client.getBucketTrash({});
      expect(trash).toBeDefined();
      expect(trash.data.Trash.Status).toBe('Enabled');
      expect(trash.data.Trash.TrashPath).toBe('/.Trash-666');
      expect(trash.data.Trash.CleanInterval).toBe(8);
    },
    NEVER_TIMEOUT
  );
  it.skip(
    'close trash',
    async () => {
      const client = new TOS(tosHNSOptions);
      await client.putBucketTrash({
        Trash: {
          TrashPath: '/.Trash-666',
          CleanInterval: 5,
          Status: 'Disabled',
        },
      });
      const trash = await client.getBucketTrash({});
      expect(trash).toBeDefined();
      expect(trash.data.Trash.Status).toBe('Disabled');
      expect(trash.data.Trash.TrashPath).toBe('/.Trash-666');
      expect(trash.data.Trash.CleanInterval).toBe(8);
    },
    NEVER_TIMEOUT
  );
});
