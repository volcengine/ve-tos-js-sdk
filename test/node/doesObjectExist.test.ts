
import TOS from '../../src/browser-index';
import { NEVER_TIMEOUT } from '../utils';
import { tosOptions } from '../utils/options';

describe('doesObjectExist', () => {
  const client = new TOS(tosOptions);
  const bucket = `test-does-object-exist-${Date.now()}`;

  beforeAll(async () => {
    await client.createBucket({ bucket });
  }, NEVER_TIMEOUT);

  afterAll(async () => {
    await client.deleteBucket(bucket);
  }, NEVER_TIMEOUT);

  it(
    'doesObjectExist',
    async () => {
      const key = 'test-does-object-exist';
      const content = 'hello world';
      await client.putObject({
        bucket,
        key,
        body: Buffer.from(content),
      });

      const exist = await client.doesObjectExist({
        bucket,
        key,
      });
      expect(exist).toBe(true);

      const notExist = await client.doesObjectExist({
        bucket,
        key: 'test-does-not-exist',
      });
      expect(notExist).toBe(false);

      await client.deleteObject({
        bucket,
        key,
      });

      const existAfterDelete = await client.doesObjectExist({
        bucket,
        key,
      });
      expect(existAfterDelete).toBe(false);
    },
    NEVER_TIMEOUT
  );
});
