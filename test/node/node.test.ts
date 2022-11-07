import TOS, { ACLType } from '../../src/browser-index';
import {
  deleteBucket,
  NEVER_TIMEOUT,
  sleepCache,
  testCheckErr,
} from '../utils';
import {
  testBucketName,
  isNeedDeleteBucket,
  tosOptions,
} from '../utils/options';
import https from 'https';
import fs from 'fs';
import http, {
  IncomingMessage,
  ServerResponse,
  Agent,
  OutgoingMessage,
  Server,
} from 'http';
import { AddressInfo } from 'net';
import path from 'path';
import { Readable } from 'stream';
import axios from 'axios';
import { DEFAULT_CONTENT_TYPE } from '../../src/methods/object/utils';
import FormData from 'form-data';
import { UploadPartOutput } from '../../src/methods/object/multipart';
import { Bucket, ListBucketOutput } from '../../src/methods/bucket/base';
import { safeAwait } from '../../src/utils';
import { BucketVersioningStatus } from '../../src/methods/bucket/versioning';

const testObjectName = '&%&%&%((()))#$U)_@@%%';

describe('nodejs connection params', () => {
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
  // afterAll(async done => {
  //   const client = new TOS(tosOptions);
  //   console.log('delete bucket.....');
  //   // delete bucket
  //   deleteBucket(client, testBucketName);
  //   done();
  // }, NEVER_TIMEOUT);

  it(
    'autoRecognizeContentType',
    async () => {
      const client = new TOS({
        ...tosOptions,
        autoRecognizeContentType: false,
      });

      const objectKey = 'c/d/a.png';
      await client.putObject({
        key: objectKey,
        body: new Readable({
          read() {
            this.push(Buffer.from('a'));
            this.push(null);
          },
        }),
      });
      const url = client.getPreSignedUrl(objectKey);
      const res = await axios(url);
      expect(res.headers['content-type']).toBe(DEFAULT_CONTENT_TYPE);
      await client.deleteObject(objectKey);
    },
    NEVER_TIMEOUT
  );

  it(
    'connection Timeout',
    async () => {
      const client = new TOS({ ...tosOptions, connectionTimeout: 1 });
      try {
        await client.listBuckets();
      } catch (_err) {
        const err = _err as any;
        expect(err.toString().includes('Connect timeout'));
      }
    },
    NEVER_TIMEOUT
  );

  it(
    'maxConnections',
    async () => {
      const taskNum = 10;
      const time1 = await runTest(1);
      const timeDefault = await runTest();
      console.log({ time1, timeDefault });
      expect(time1 > (timeDefault / taskNum) * 2).toBe(true);
      async function runTest(maxConnections?: number) {
        const client = new TOS({ ...tosOptions, maxConnections });
        const startTime = +new Date();
        const promises: Promise<unknown>[] = [];
        for (let i = 0; i < taskNum; ++i) {
          promises.push(client.listBuckets());
        }
        await Promise.all(promises);
        return +new Date() - startTime;
      }
    },
    NEVER_TIMEOUT
  );

  it(
    'enableVerifySSL',
    async () => {
      const server = await startServer();
      const address = server.address() as AddressInfo;
      const endpoint = `${address.address}:${address.port}`;
      const clientVerify = new TOS({ ...tosOptions, endpoint });
      const clientNoVerify = new TOS({
        ...tosOptions,
        endpoint,
        enableVerifySSL: false,
      });

      testCheckErr(() => clientVerify.listBuckets());

      const { data } = await clientNoVerify.listBuckets();
      expect(data.Buckets.length).toEqual(0);
      server.close();

      function startServer(): Promise<Server> {
        const options = {
          key: fs.readFileSync(
            path.resolve(__dirname, './self-signed-cert/server.key')
          ),
          cert: fs.readFileSync(
            path.resolve(__dirname, './self-signed-cert/server.crt')
          ),
        };

        return new Promise(res => {
          https
            .createServer(options, (_req: unknown, res: OutgoingMessage) => {
              res.end('{}');
            })
            .listen(function(this: Server) {
              res(this);
            });
        });
      }
    },
    NEVER_TIMEOUT
  );

  it(
    'requestTimeout',
    async () => {
      testCheckErr(
        async () => {
          const client = new TOS({ ...tosOptions, requestTimeout: 50 });
          await client.listBuckets();
        },
        msg => msg.toLowerCase().includes('timeout')
      );

      const client = new TOS({ ...tosOptions, requestTimeout: 2000 });
      const { data } = await client.listBuckets();
      expect(data.Buckets).toBeTruthy();
    },
    NEVER_TIMEOUT
  );

  it(
    'idleConnectionTime',
    async () => {
      const taskNum = 10;
      const idleConnectionTime = 3000;
      const client = new TOS({ ...tosOptions, idleConnectionTime });
      const promises: Promise<unknown>[] = [];
      for (let i = 0; i < taskNum; ++i) {
        promises.push(client.listBuckets());
      }
      const agent: Agent = (client as any).httpsAgent;
      await Promise.all(promises);
      expect(Object.values(agent.freeSockets).flat().length).toEqual(taskNum);

      await new Promise(r => setTimeout(r, idleConnectionTime + 500));
      expect(Object.values(agent.freeSockets).flat().length).toEqual(0);
    },
    NEVER_TIMEOUT
  );

  it(
    'ensure http header encode/decode',
    async () => {
      const headerKey = 'x-test-header-key';
      const requestReceiveHeader = 'abc%09中文&';
      const sendHeader = 'abc%09中%E6%96%87&';
      const receiveHeader = 'abc%09%E4%B8%AD%E6%96%87&';
      const server = await startServer();
      const address = server.address() as AddressInfo;
      const endpoint = `${address.address}:${address.port}`;
      const client = new TOS({
        ...tosOptions,
        endpoint,
        secure: false,
      });

      const { headers } = await client.getObjectV2({
        key: 'aa',
        headers: {
          [headerKey]: sendHeader,
        },
      });
      expect(headers[headerKey]).toBe(requestReceiveHeader);

      server.close();

      function startServer(): Promise<Server> {
        return new Promise(res => {
          http
            .createServer((req: IncomingMessage, res: ServerResponse) => {
              if (req.headers[headerKey] === receiveHeader) {
                res.setHeader(headerKey, receiveHeader);
                res.end();
                return;
              }
              res.statusCode = 400;
            })

            .listen(function(this: Server) {
              res(this);
            });
        });
      }
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

      const { data } = await client.getObjectV2({ key, dataType: 'buffer' });
      expect(data.etag).not.toEqual('');
      expect(data.lastModified).not.toEqual('');
      expect(data.hashCrc64ecma).not.toEqual('');
      expect(data.content.toString()).toEqual(content);
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

        const createPromise = (i: number, progressFn: any) => {
          const size =
            (i + 1) * PART_LENGTH > TOTAL ? TOTAL % PART_LENGTH : PART_LENGTH;
          const promise = client.uploadPart({
            body: Buffer.from(new Array(size).fill(0)),
            key: testObjectName,
            progress: progressFn,
            partNumber: i + 1,
            uploadId: UploadId,
          });
          return promise;
        };

        let uploadPartRes: UploadPartOutput[] = [];
        uploadPartRes = [];
        for (let i = 0; i * PART_LENGTH < TOTAL; ++i) {
          const progressFn = jest.fn();
          uploadPartRes[i] = (await createPromise(i, progressFn)).data;

          expect(progressFn.mock.calls[0][0]).toEqual(0);
          expect(
            progressFn.mock.calls.filter(it => it[0] === 1).length
          ).toEqual(1);
          const lastCall = progressFn.mock.calls.slice(-1)[0];
          expect(lastCall[0]).toEqual(1);
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
        const { headers } = await client.getObjectV2({
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
    'test proxy',
    async () => {
      const server = await startServer();
      const resHeaderKey = 'x-test-proxy';

      const address = server.address() as AddressInfo;
      const client = new TOS({
        ...tosOptions,
        proxyHost: address.address,
        proxyPort: address.port,
      });
      const { headers } = await client.listBuckets();
      expect(headers[resHeaderKey]).toBeTruthy();

      server.close();
      function startServer(): Promise<Server> {
        return new Promise(res => {
          http
            .createServer((_req: unknown, res: OutgoingMessage) => {
              res.setHeader(resHeaderKey, '1');
              res.end('{}');
            })
            .listen(function(this: Server) {
              res(this);
            });
        });
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
    'test-redirect',
    async () => {
      const server = await startServer();
      const address = server.address() as AddressInfo;
      const endpoint = `${address.address}:${address.port}`;
      const client = new TOS({ ...tosOptions, endpoint, secure: false });
      const [err] = await safeAwait(client.listBuckets());
      expect(err).not.toBeNull();
      server.close();

      function startServer(): Promise<Server> {
        return new Promise(res => {
          http
            .createServer((req: IncomingMessage, res: ServerResponse) => {
              let data: ListBucketOutput = { Buckets: [] };
              if (req.url?.includes('redirected')) {
                data = { Buckets: [] };
              } else {
                data = { Buckets: [{} as Bucket] };
                res.setHeader('Location', '/redirected');
                res.statusCode = 307;
              }
              res.setHeader('content-type', 'application/json');
              res.setHeader('x-tos-request-id', 'id');
              res.end(JSON.stringify(data));
            })
            .listen(undefined, '0.0.0.0', function(this: Server) {
              res(this);
            });
        });
      }
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

  it('ensure-userAgent', async () => {
    const server = await startServer();
    const address = server.address() as AddressInfo;
    const endpoint = `${address.address}:${address.port}`;
    const client = new TOS({ ...tosOptions, endpoint, secure: false });
    const [err] = await safeAwait(client.listBuckets());
    expect(err).toBeNull();

    server.close();

    function startServer(): Promise<Server> {
      return new Promise(res => {
        http
          .createServer((req: IncomingMessage, res: ServerResponse) => {
            if (req.headers['user-agent']?.includes('tos')) {
              res.statusCode = 200;
            } else {
              res.statusCode = 400;
            }
            res.end();
          })
          .listen(function(this: Server) {
            res(this);
          });
      });
    }
  });

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
    'bucket versioning',
    async () => {
      const client = new TOS({
        ...tosOptions,
        bucket: testBucketName,
      });

      {
        const { data } = await client.getBucketVersioning();
        expect(data.Status).toEqual(BucketVersioningStatus.Disable);
      }

      {
        await client.putBucketVersioning({
          status: BucketVersioningStatus.Enable,
        });
        await sleepCache();
        const { data } = await client.getBucketVersioning();
        expect(data.Status).toEqual(BucketVersioningStatus.Enable);
      }

      {
        // more wait, maybe cache
        await sleepCache();
        await sleepCache();
        await sleepCache();
        await sleepCache();
        await sleepCache();
        await client.putBucketVersioning({
          status: BucketVersioningStatus.Suspended,
        });
        await sleepCache();
        const { data } = await client.getBucketVersioning();
        expect(data.Status).toEqual(BucketVersioningStatus.Suspended);
      }
    },
    NEVER_TIMEOUT
  );
});
