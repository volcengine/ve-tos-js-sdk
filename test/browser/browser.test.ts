import axios from 'axios';
import TOS from '../../src/browser-index';
import { UploadPartOutput } from '../../src/methods/object/multipart';
import { Readable } from 'stream';
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
import FormData from 'form-data';
import { ACLType } from '../../src/TosExportEnum';

const testObjectName = '&%&%&%((()))#$U)_@@%%';

describe('TOS', () => {
  beforeAll(async done => {
    const client = new TOS(tosOptions);

    // clear all bucket
    const { data: buckets } = await client.listBuckets();
    for (const bucket of buckets.Buckets) {
      if (isNeedDeleteBucket(bucket.Name)) {
        try {
          await deleteBucket(client, bucket.Name);
        } catch (err) {
          console.log('a: ', err);
        }
      }
    }

    // create bucket
    await client.createBucket({
      bucket: testBucketName,
    });
    await sleepCache();
    done();
  }, NEVER_TIMEOUT);

  afterAll(async done => {
    const client = new TOS(tosOptions);
    // delete bucket
    deleteBucket(client, testBucketName);
    done();
  }, NEVER_TIMEOUT);

  it(
    'check bucket name',
    async () => {
      const client = new TOS(tosOptions);
      testCheckErr(() => client.createBucket({ bucket: 'a' }), 'length');
      testCheckErr(
        () => client.createBucket({ bucket: 'a'.repeat(64) }),
        'length'
      );
      testCheckErr(() => client.createBucket({ bucket: 'ab@cd' }), 'character');
      testCheckErr(() => client.createBucket({ bucket: 'ab!cd' }), 'character');
      testCheckErr(() => client.createBucket({ bucket: '-abcd' }), '-');
      testCheckErr(() => client.createBucket({ bucket: 'abcd-' }), '-');
    },
    NEVER_TIMEOUT
  );

  it(
    'check object name',
    async () => {
      const client = new TOS(tosOptions);
      // 测试中文名不报错
      await client.putObject('控制台.png');
      await client.deleteObject('控制台.png');
      testCheckErr(() => client.putObject('/abcd'), '/');
      testCheckErr(() => client.putObject('\\abcd'), '\\');
      testCheckErr(() => client.putObject('\t'), 'name');
      testCheckErr(() => client.putObject(''), 'length');
      testCheckErr(() => client.putObject('a'.repeat(700)), 'length');

      // ensure these methods execute the validating logic
      testCheckErr(() => client.appendObject('/abcd'), '/');
      testCheckErr(
        () => client.uploadFile({ key: '/abcd', file: Buffer.from([]) }),
        '/'
      );
      testCheckErr(() => client.createMultipartUpload({ key: '/abcd' }), '/');
      testCheckErr(() => client.getPreSignedUrl('/abcd'), '/');
      testCheckErr(() => client.calculatePostSignature('/abcd'), '/');
    },
    NEVER_TIMEOUT
  );

  it(
    'list bucket',
    async () => {
      const client = new TOS(tosOptions);
      const { data } = await client.listBuckets();
      const found = data.Buckets.find(it => it.Name === testBucketName);
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
        await sleepCache();
        const { data } = await client.getBucketAcl(testBucketName);
        expect(data.Grants[0].Grantee.Canned).toBe('AllUsers');
      }
    },
    NEVER_TIMEOUT
  );

  // how to split multiple
  it(
    'upload/list/acl object',
    async () => {
      const client = new TOS(tosOptions);
      await client.putObject({
        bucket: testBucketName,
        key: testObjectName,
        body: new Readable({
          read() {
            this.push(Buffer.from([0, 0]));
            this.push(null);
          },
        }),
      });

      {
        const { data } = await client.listObjects({
          prefix: testObjectName,
        });
        expect(data.Contents.length).toEqual(1);
        expect(data.Contents[0].Size).toEqual(2);
      }

      {
        const { data } = await client.headObject(testObjectName);
        const { data: data2 } = await client.headObject({
          key: testObjectName,
        });

        expect(data['content-length']).toEqual('2');
        expect(data2['content-length']).toEqual('2');
      }

      {
        const { data } = await client.getObjectAcl(testObjectName);
        // private
        expect(data.Grants[0].Grantee.Canned).toBeUndefined();
      }
      {
        const { data } = await client.getObjectAcl({
          key: testObjectName,
        });
        // private
        expect(data.Grants[0].Grantee.Canned).toBeUndefined();
      }

      await client.putObjectAcl({
        bucket: testBucketName,
        key: testObjectName,
        acl: ACLType.ACLPublicReadWrite,
      });

      {
        const { data } = await client.getObjectAcl({
          bucket: testBucketName,
          key: testObjectName,
        });
        expect(data.Grants[0].Grantee.Canned).toBe('AllUsers');
      }

      {
        const url = client.getPreSignedUrl({
          bucket: testBucketName,
          key: testObjectName,
        });

        const res = await axios(url, { responseType: 'arraybuffer' });
        expect(res.headers['content-length']).toEqual('2');
        expect(res.data).toEqual(Buffer.from([0, 0]));
      }

      await client.deleteObject({
        key: testObjectName,
      });

      {
        const { data } = await client.listObjects();
        expect(data.Contents.length).toEqual(0);
      }
    },
    NEVER_TIMEOUT
  );

  it(
    'object name includes dot',
    async () => {
      await runTest('./aa/bb/cc');
      await runTest('.');

      async function runTest(testObjectName: string) {
        const client = new TOS(tosOptions);
        await client.putObject({
          bucket: testBucketName,
          key: testObjectName,
          body: new Readable({
            read() {
              this.push(Buffer.from([0, 0]));
              this.push(null);
            },
          }),
        });

        {
          const { data } = await client.listObjects({
            prefix: testObjectName,
          });
          expect(data.Contents.length).toEqual(1);
          expect(data.Contents[0].Size).toEqual(2);
        }

        await client.deleteObject(testObjectName);
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
        const object = objects.Contents.find(it => it.Key === folderName);
        expect(object).toBeTruthy();
        expect(object?.Size).toEqual(0);

        {
          // list objects in folder
          const { data: objects } = await client.listObjects({
            prefix: folderName,
          });
          const object = objects.Contents.find(it => it.Key === folderName);
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
    'object multipart',
    async () => {
      const testObjectName = 'test-multipart-ddddd.png';
      const client = new TOS({
        ...tosOptions,
        bucket: testBucketName,
      });
      const PART_LENGTH = 5 * 1024 * 1024;
      const TOTAL = 2 * PART_LENGTH + 1234;

      {
        // multi upload
        const {
          data: { UploadId },
        } = await client.createMultipartUpload({
          key: testObjectName,
          headers: {
            'x-tos-acl': ACLType.ACLPrivate,
          },
        });

        const createPromise = (i: number) => {
          const size =
            (i + 1) * PART_LENGTH > TOTAL ? TOTAL % PART_LENGTH : PART_LENGTH;
          const promise = client.uploadPart({
            body: Buffer.from(new Array(size).fill(0)),
            key: testObjectName,
            partNumber: i + 1,
            uploadId: UploadId,
          });
          return promise;
        };

        let uploadPartRes: UploadPartOutput[] = [];
        uploadPartRes = [];
        for (let i = 0; i * PART_LENGTH < TOTAL; ++i) {
          uploadPartRes[i] = (await createPromise(i)).data;
        }

        const res = await client.completeMultipartUpload({
          key: testObjectName,
          uploadId: UploadId,
          parts: uploadPartRes.map((it, idx) => ({
            eTag: it.ETag,
            partNumber: idx + 1,
          })),
        });

        expect(res.data.Location.includes(client.opts.endpoint)).toBeTruthy();
        expect(res.data.Location.includes(testObjectName)).toBeTruthy();
      }

      {
        const url = client.getPreSignedUrl({
          bucket: testBucketName,
          key: testObjectName,
        });

        const res = await axios(url, { responseType: 'arraybuffer' });
        expect(res.headers['content-length']).toEqual(TOTAL.toString());
      }

      {
        const url = client.getPreSignedUrl({
          // no bucket param
          key: testObjectName,
        });

        const res = await axios(url, { responseType: 'arraybuffer' });
        expect(res.headers['content-length']).toEqual(TOTAL.toString());
        expect(res.headers['content-type']).toBe('image/png');
      }

      {
        const { headers } = await client.getObject({
          key: testObjectName,
          headers: {
            Range: 'bytes=0-9',
          },
          response: {
            'content-type': 'application/octet-stream',
          },
        });
        expect(+headers['content-length']!).toBe(10);
        expect(headers['content-type']).toBe('application/octet-stream');
      }
    },
    NEVER_TIMEOUT
  );

  it(
    'auto add content-type for uploading object',
    async () => {
      const client = new TOS(tosOptions);

      {
        const objectKey = 'c/d/a.png';
        await client.putObject({
          bucket: testBucketName,
          key: objectKey,
          body: new Readable({
            read() {
              this.push(Buffer.from([0, 0]));
              this.push(null);
            },
          }),
        });
        const url = client.getPreSignedUrl(objectKey);
        const res = await axios(url);
        expect(res.headers['content-type']).toBe('image/png');
        await client.deleteObject(objectKey);
      }

      {
        const objectKey = 'c/d/a.png';
        await client.putObject({
          bucket: testBucketName,
          key: objectKey,
          body: new Readable({
            read() {
              this.push(Buffer.from([0, 0]));
              this.push(null);
            },
          }),
          headers: {
            // @ts-ignore validate key is can ignore case
            'Content-type': 'image/jpeg',
          },
        });
        const url = client.getPreSignedUrl(objectKey);
        const res = await axios(url);
        expect(res.headers['content-type']).toBe('image/jpeg');

        await client.deleteObject(objectKey);
      }

      {
        // create a directory
        const objectKey = 'c/d/a.png/';
        await client.putObject({
          bucket: testBucketName,
          key: objectKey,
        });
        const url = client.getPreSignedUrl(objectKey);
        const res = await axios(url);
        expect(res.headers['content-type']).not.toBe('image/png');
      }

      {
        const objectKey = 'audio.WAV';
        await client.putObject({
          key: objectKey,
        });
        const url = client.getPreSignedUrl({
          key: objectKey,
        });

        const res = await axios(url);
        expect(res.headers['content-type']).toBe('audio/wav');
      }

      {
        const objectKey = 'audio';
        await client.putObject({
          key: objectKey,
        });
        const url = client.getPreSignedUrl({
          key: objectKey,
        });

        const res = await axios(url);
        expect(res.headers['content-type']).toBe('application/octet-stream');
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
        objects: [...objectKeys, '__not_exist__'].map(it => ({ key: it })),
      });

      expect(res.data.Deleted.length).toBe(4);
      expect(res.data.Error.length).toBe(0);
    },
    NEVER_TIMEOUT
  );

  it(
    'post object',
    async () => {
      const client = new TOS(tosOptions);

      const key = 'post-object-key';
      const content = 'abcd';
      const form = await client.calculatePostSignature({ key });
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, value);
      });
      formData.append('file', content, {
        filename: 'test.abcd',
      });

      await axios.post(
        `https://${client.opts.bucket!}.${client.opts.endpoint}`,
        formData,
        {
          headers: {
            'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`,
          },
        }
      );

      const { data } = await client.getObject(key);
      expect((data as Buffer).toString()).toEqual(content);
    },
    NEVER_TIMEOUT
  );
});
