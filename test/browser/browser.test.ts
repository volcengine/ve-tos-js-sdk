import TOS from '../../src/browser-index';
import {
  deleteBucket,
  sleepCache,
  NEVER_TIMEOUT,
  testCheckErr,
} from '../utils';
import {
  testBucketName,
  isNeedDeleteBucket,
  tosOptions,
} from '../utils/options';
import { ACLType } from '../../src/TosExportEnum';

describe('TOS', () => {
  it(
    'check bucket name',
    async () => {
      const client = new TOS(tosOptions);
      await testCheckErr(() => client.createBucket({ bucket: 'a' }), 'length');
      await testCheckErr(
        () => client.createBucket({ bucket: 'a'.repeat(64) }),
        'length'
      );
      await testCheckErr(
        () => client.createBucket({ bucket: 'ab@cd' }),
        'character'
      );
      await testCheckErr(
        () => client.createBucket({ bucket: 'ab!cd' }),
        'character'
      );
      await testCheckErr(() => client.createBucket({ bucket: '-abcd' }), '-');
      await testCheckErr(() => client.createBucket({ bucket: 'abcd-' }), '-');
    },
    NEVER_TIMEOUT
  );

  it(
    'list bucket',
    async () => {
      const client = new TOS(tosOptions);
      const { data } = await client.listBuckets();
      const found = data.Buckets.find((it) => it.Name === testBucketName);
      expect(found).not.toBeUndefined();
    },
    NEVER_TIMEOUT
  );

  it(
    'bucket acl',
    async () => {
      const client = new TOS(tosOptions);
      {
        const { data } = await client.getBucketAcl(testBucketName);
        // private
        expect(data.Grants[0].Grantee.Canned).toBeUndefined();
      }

      await client.putBucketAcl({
        bucket: testBucketName,
        acl: ACLType.ACLPublicReadWrite,
      });

      {
        await sleepCache(30_000);
        const { data } = await client.getBucketAcl(testBucketName);
        expect(data.Grants[0].Grantee.Canned).toBe('AllUsers');
      }
    },
    NEVER_TIMEOUT
  );

  it(
    'create/list folder',
    async () => {
      const client = new TOS(tosOptions);
      {
        const folderName =
          '            thisIsALongNamedFolderWithSpace_thisIsALongNamedFolderWithSpace/';
        await client.putObject({ key: folderName });
        const { data: objects } = await client.listObjects();
        const object = objects.Contents.find((it) => it.Key === folderName);
        expect(object).toBeTruthy();
        expect(object?.Size).toEqual(0);

        {
          // list objects in folder
          const { data: objects } = await client.listObjects({
            prefix: folderName,
          });
          const object = objects.Contents.find((it) => it.Key === folderName);
          expect(object).toBeTruthy();
          expect(object?.Size).toEqual(0);
        }
      }

      {
        // '/' in the object name of getPreSignedUrl can't be encoded
        const testObjectName = 'abc/bb';
        await client.putObject({
          bucket: testBucketName,
          key: testObjectName,
        });

        {
          const url = client.getPreSignedUrl({
            bucket: testBucketName,
            key: testObjectName,
          });

          expect(url.includes(`/${testObjectName}`)).toBeTruthy();
        }

        await client.deleteObject({
          key: testObjectName,
        });
      }
    },
    NEVER_TIMEOUT
  );

  it(
    'delete multi objects',
    async () => {
      const client = new TOS(tosOptions);

      const objectKeys = ['a', 'b', 'c'];
      for (const key of objectKeys) {
        await client.putObject(key);
      }

      const res = await client.deleteMultiObjects({
        quiet: false,
        objects: [...objectKeys, '__not_exist__'].map((it) => ({ key: it })),
      });

      expect(res.data.Deleted.length).toBe(4);
      expect(res.data.Error.length).toBe(0);
    },
    NEVER_TIMEOUT
  );
});
