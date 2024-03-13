import { ACLType, TOS } from '../../src/index';
import { hashMd5 } from '../../src/universal/crypto';
import { safeAwait } from '../../src/utils';
import {
  NEVER_TIMEOUT,
  deleteBucket,
  sleepCache,
  testCheckErr,
} from '../utils';
import {
  isNeedDeleteBucket,
  testBucketName,
  testCallBackUrl,
  tosOptions,
} from '../utils/options';
import { objectPath1K } from './utils';

describe('fetch object in node.js environment', () => {
  it(
    'fetchObject simple',
    async () => {
      const oldKey = `fetchObject-oldKey`;
      const key = `fetchObject-${Math.random()}`;
      const content = Math.random().toFixed(100);
      const client = new TOS(tosOptions);
      await client.putObject({
        key: oldKey,
        body: Buffer.from(content),
      });
      const url = client.getPreSignedUrl(oldKey);
      const { data } = await client.fetchObject({
        url,
        key,
        acl: ACLType.ACLPublicRead,
        meta: {
          abc: '123',
        },
      });
      expect(data.Etag).not.toEqual('');

      const { data: aclData } = await client.getObjectAcl(key);
      expect(JSON.stringify(aclData).includes('AllUsers')).toBeTruthy();
      const { data: headData } = await client.headObject(key);
      expect(headData['x-tos-meta-abc']).toBe('123');
    },
    NEVER_TIMEOUT
  );

  it(
    'fetchObject with MD5',
    async () => {
      const oldKey = `fetchObject-oldKey`;
      const key = `fetchObject-${Math.random()}`;
      const content = Math.random().toFixed(100);
      const md5 = Buffer.from(hashMd5(content)).toString('base64');
      const client = new TOS(tosOptions);
      await client.putObject({
        key: oldKey,
        body: Buffer.from(content),
      });
      const url = client.getPreSignedUrl(oldKey);

      const { data } = await client.fetchObject({
        url,
        key,
        contentMD5: md5,
      });
      expect(data.Etag).not.toEqual('');
    },
    NEVER_TIMEOUT
  );

  it(
    'fetchObject with wrong MD5',
    async () => {
      const oldKey = `fetchObject-oldKey`;
      const key = `fetchObject-${Math.random()}`;
      const content = Math.random().toFixed(100);
      const md5 = Buffer.from(hashMd5('any wrong content')).toString('base64');
      const client = new TOS(tosOptions);
      await client.putObject({
        key: oldKey,
        body: Buffer.from(content),
      });
      const url = client.getPreSignedUrl(oldKey);

      await testCheckErr(
        async () => {
          await client.fetchObject({
            url,
            key,
            contentMD5: md5,
          });
        },
        (err) => err.toString().toLowerCase().includes('content-md5')
      );
    },
    NEVER_TIMEOUT
  );

  it(
    'fetchObject the exist key',
    async () => {
      const oldKey = `fetchObject-oldKey`;
      const existKey = `fetchObject-exist-${Math.random()}`;
      const content = Math.random().toFixed(100);
      const md5 = Buffer.from(hashMd5(content)).toString('base64');
      const client = new TOS(tosOptions);
      await client.putObject({
        key: oldKey,
        body: Buffer.from(content),
      });
      await client.putObject({
        key: existKey,
        body: Buffer.from(content),
      });
      const url = client.getPreSignedUrl(oldKey);
      await sleepCache(60_000);

      await testCheckErr(
        async () => {
          await client.fetchObject({
            url,
            key: existKey,
            contentMD5: md5,
          });
        },
        (err) => err.toString().toLowerCase().includes('already exist')
      );

      await client.fetchObject({
        url,
        key: existKey,
        contentMD5: md5,
        ignoreSameKey: true,
      });
    },
    NEVER_TIMEOUT
  );

  it(
    'putFetchTask simple',
    async () => {
      const oldKey = `putFetchTask-oldKey`;
      const key = `putFetchTask-${Math.random()}`;
      const content = Math.random().toFixed(100);
      const client = new TOS(tosOptions);
      await client.putObject({
        key: oldKey,
        body: Buffer.from(content),
      });
      const url = client.getPreSignedUrl(oldKey);
      const putOnce = () =>
        client.putFetchTask({
          url,
          key,
          acl: ACLType.ACLPublicRead,
          meta: {
            abc: '123',
          },
        });
      // 多执行几次，增加 30s 任务被执行一次的可能性
      const { data } = await putOnce();
      await putOnce();
      await putOnce();
      expect(data.TaskId).not.toEqual('');
      await sleepCache(30_000);

      const { data: aclData } = await client.getObjectAcl(key);
      expect(JSON.stringify(aclData).includes('AllUsers')).toBeTruthy();
      const { data: headData } = await client.headObject(key);
      expect(headData['x-tos-meta-abc']).toBe('123');
    },
    NEVER_TIMEOUT
  );

  it(
    'putFetchTask with MD5',
    async () => {
      const oldKey = `putFetchTask-oldKey`;
      const key = `putFetchTask-${Math.random()}`;
      const content = Math.random().toFixed(100);
      const md5 = Buffer.from(hashMd5(content)).toString('base64');
      const client = new TOS(tosOptions);
      await client.putObject({
        key: oldKey,
        body: Buffer.from(content),
      });
      const url = client.getPreSignedUrl(oldKey);

      const putOnce = () =>
        client.putFetchTask({
          url,
          key,
          contentMD5: md5,
        });
      // 多执行几次，增加 30s 任务被执行一次的可能性
      const { data } = await putOnce();
      await putOnce();
      await putOnce();
      expect(data.TaskId).not.toEqual('');
      await sleepCache(30_000);
      const { data: headData } = await client.headObject(key);
      expect(+headData['content-length']).toBe(content.length);
    },
    NEVER_TIMEOUT
  );

  it(
    'putFetchTask with wrong MD5',
    async () => {
      const oldKey = `putFetchTask-oldKey`;
      const key = `putFetchTask-${Math.random()}`;
      const content = Math.random().toFixed(100);
      const md5 = Buffer.from(hashMd5('any wrong content')).toString('base64');
      const client = new TOS(tosOptions);
      await client.putObject({
        key: oldKey,
        body: Buffer.from(content),
      });
      const url = client.getPreSignedUrl(oldKey);
      const putOnce = () =>
        client.putFetchTask({
          url,
          key,
          contentMD5: md5,
        });
      // 多执行几次，增加 30s 任务被执行一次的可能性
      await putOnce();
      await putOnce();
      await putOnce();
      await sleepCache(30_000);
      await testCheckErr(() => client.headObject(key));
    },
    NEVER_TIMEOUT
  );

  it(
    'putFetchTask the exist key',
    async () => {
      const oldKey = `putFetchTask-oldKey`;
      const existKey = `putFetchTask-exist-${Math.random()}`;
      const content = Math.random().toFixed(100);
      const existContent = 'I am exist';
      const md5 = Buffer.from(hashMd5(content)).toString('base64');
      const client = new TOS(tosOptions);
      await client.putObject({
        key: oldKey,
        body: Buffer.from(content),
      });
      await client.putObject({
        key: existKey,
        body: Buffer.from(existContent),
      });
      const url = client.getPreSignedUrl(oldKey);

      const putOnce1 = () =>
        client.putFetchTask({
          url,
          key: existKey,
          contentMD5: md5,
          ignoreSameKey: true,
        });
      // 多执行几次，增加 30s 任务被执行一次的可能性
      await putOnce1();
      await putOnce1();
      await putOnce1();
      await sleepCache(30_000);
      const { data: data1 } = await client.headObject(existKey);
      expect(+data1['content-length']).toBe(existContent.length);

      const putOnce = () =>
        client.putFetchTask({
          url,
          key: existKey,
          contentMD5: md5,
        });

      // 多执行几次，增加 30s 任务被执行一次的可能性
      await putOnce();
      await putOnce();
      await putOnce();
      await sleepCache(30_000);
      const { data: headData } = await client.headObject(existKey);
      expect(+headData['content-length']).toBe(content.length);
    },
    NEVER_TIMEOUT
  );
});
