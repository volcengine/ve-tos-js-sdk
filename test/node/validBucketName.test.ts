import TOS from '../../src/browser-index';
import { safeAwait } from '../../src/utils';
import { NEVER_TIMEOUT } from '../utils';
import { tosOptions } from '../utils/options';
import { isValidBucketName } from '../../src/utils';

describe('valid bucket name', () => {
  it(
    `valid bucket name with different method`,
    async () => {
      const client = new TOS(tosOptions);
      const [err] = await safeAwait(client.getBucketAcl('-aaa'));
      expect(
        err
          .toString()
          .includes(
            `invalid bucket name, the bucket name can be neither starting with '-' nor ending with '-'`
          )
      ).toBeTruthy();

      const [err2] = await safeAwait(
        client.getBucketCustomDomain({ bucket: 'aaa-' })
      );
      expect(
        err2
          .toString()
          .includes(
            `invalid bucket name, the bucket name can be neither starting with '-' nor ending with '-'`
          )
      ).toBeTruthy();

      const [err3] = await safeAwait(
        client.getBucketCustomDomain({ bucket: 'aa' })
      );
      expect(
        err3
          .toString()
          .includes('invalid bucket name, the length must be [3, 63]')
      ).toBeTruthy();

      const [err4] = await safeAwait(
        client.getBucketCustomDomain({ bucket: 'a'.repeat(64) })
      );
      expect(
        err4
          .toString()
          .includes('invalid bucket name, the length must be [3, 63]')
      ).toBeTruthy();

      const [err5] = await safeAwait(
        client.getObjectAcl({
          bucket: 'aa#a',
          key: '123',
        })
      );
      expect(
        err5
          .toString()
          .includes('invalid bucket name, the character set is illegal')
      ).toBeTruthy();

      const [err6] = await safeAwait(client.listObjectsType2());
      expect(err6 === null).toBeTruthy();
    },
    NEVER_TIMEOUT
  );

  it('test isValidBucketName', async () => {
    let flag = true;
    try {
      isValidBucketName('aaa');
      isValidBucketName('a-a');
      isValidBucketName('12a-a3');
      isValidBucketName('1234567890-abcdefghijklmnopqrstuvwxyz');
      isValidBucketName('c'.repeat(63));
      isValidBucketName('1'.repeat(63));
      isValidBucketName('0abcdefghijklmnopqrstuvwx-yz0');
      isValidBucketName('--caa', true);
    } catch (e) {
      flag = false;
    }
    expect(flag).toBe(true);

    let flag2 = true;
    try {
      isValidBucketName('--caa');
    } catch (e) {
      flag2 = false;
    }
    expect(flag2).toBe(false);
  });
});
