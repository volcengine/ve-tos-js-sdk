import path from 'path';
import fs from 'fs';
import TOS, { DataTransferType } from '../../src/browser-index';
import { deleteBucket, sleepCache, NEVER_TIMEOUT } from '../utils';
import {
  testBucketName,
  isNeedDeleteBucket,
  tosOptions,
} from '../utils/options';
import { objectKey10M, objectPath10M, tmpDir } from './utils';
import { promisify } from 'util';
import http, { IncomingMessage, ServerResponse, Server } from 'http';
import { isReadable, safeAwait, streamToBuf } from '../../src/utils';
import { AddressInfo } from 'net';

const key = `getObject-${objectKey10M}`;

describe('getObject data transfer in node.js environment', () => {
  beforeAll(async (done) => {
    const client = new TOS(tosOptions);
    await client.putObjectFromFile({ key, filePath: objectPath10M });
    done();
  }, NEVER_TIMEOUT);

  it(
    'getObject range',
    async () => {
      const client = new TOS(tosOptions);
      const res = await client.getObjectV2({
        key,
        headers: {
          Range: 'bytes=0-100',
        },
        dataType: 'buffer',
      });

      expect(+res.headers['content-length']!).toBe(101);
    },
    NEVER_TIMEOUT
  );

  it(
    'getObjectToFile',
    async () => {
      const client = new TOS(tosOptions);
      const key = 'getObjectToFile-putObject';
      const content = 'abc'.repeat(1000);
      await client.putObject({
        body: Buffer.from(content),
        key,
      });

      const filePath = path.resolve(tmpDir, 'abc');
      await fs.unlink(filePath, () => {});
      await client.getObjectToFile({
        key,
        filePath: path.resolve(tmpDir, 'abc'),
      });
      const stats = await promisify(fs.stat)(filePath);
      expect(stats.size).toEqual(content.length);
    },
    NEVER_TIMEOUT
  );

  it(
    'getObject unexpected EOF',
    async () => {
      // TODO: maybe need to test it in browser environment
      const server = await startServer();
      const address = server.address() as AddressInfo;
      const endpoint = `${address.address}:${address.port}`;
      const client = new TOS({
        ...tosOptions,
        endpoint,
        secure: false,
        requestTimeout: 2_000,
      });

      // check stream
      const [err, res] = await safeAwait(
        client.getObjectV2({ key: 'aa', dataType: 'stream' })
      );
      expect(err).toBeNull();
      const content = res?.data?.content;
      if (isReadable(content)) {
        const [err] = await safeAwait(streamToBuf(content));
        expect(err).toBeTruthy();
      }

      // check buffer
      const [err2] = await safeAwait(
        client.getObjectV2({ key: 'aa', dataType: 'buffer' })
      );
      expect(err2).toBeTruthy();
      const [err3] = await safeAwait(
        client.getObjectV2({
          key: 'aa',
          dataType: 'buffer',
          headers: {
            Range: 'bytes=0-10239',
          },
        })
      );
      expect(err3).toBeTruthy();

      server.close();
      function startServer(): Promise<Server> {
        return new Promise((res) => {
          http
            .createServer(async (req: IncomingMessage, res: ServerResponse) => {
              const perLength = 10 * 1024;
              const cnt = 10;
              let actualCnt = 10;
              const totalLength = cnt * perLength;
              if (req.headers['range'] != null) {
                actualCnt = 1;
                const actualLength = actualCnt * perLength;
                // content-range will not be send alone,
                // content-length will be send too by tos server
                res.setHeader(
                  'content-range',
                  `bytes ${0}-${actualLength - 1}/${totalLength}`
                );
                res.setHeader('content-length', actualLength + 1);
              } else {
                res.setHeader('content-length', totalLength + 1);
              }

              for (let i = 0; i < actualCnt; ++i) {
                await new Promise((r) => setTimeout(r, 100));
                res.write(Buffer.alloc(perLength, 'a'));
              }
              res.end();
            })
            .listen(undefined, '0.0.0.0', function (this: Server) {
              res(this);
            });
        });
      }
    },
    NEVER_TIMEOUT
  );

  it(
    'getObjectToFile unexpected EOF',
    async () => {
      // TODO: maybe need to test it in browser environment
      const server = await startServer();
      const address = server.address() as AddressInfo;
      const endpoint = `${address.address}:${address.port}`;
      const client = new TOS({
        ...tosOptions,
        endpoint,
        secure: false,
        requestTimeout: 2_000,
      });

      const baseFilename = 'getObjectToFile-unexpected-EOF';
      const [err] = await safeAwait(
        client.getObjectToFile({
          key: 'aa',
          filePath: path.resolve(tmpDir, `${baseFilename}-1.txt`),
        })
      );
      expect(err).toBeTruthy();

      const [err3] = await safeAwait(
        client.getObjectToFile({
          key: 'aa',
          headers: {
            Range: 'bytes=0-10239',
          },
          filePath: path.resolve(tmpDir, `${baseFilename}-2.txt`),
        })
      );
      expect(err3).toBeTruthy();

      server.close();
      function startServer(): Promise<Server> {
        return new Promise((res) => {
          http
            .createServer(async (req: IncomingMessage, res: ServerResponse) => {
              const perLength = 10 * 1024;
              const cnt = 10;
              let actualCnt = 10;
              const totalLength = cnt * perLength;
              if (req.headers['range'] != null) {
                actualCnt = 1;
                const actualLength = actualCnt * perLength;
                // content-range will not be send alone,
                // content-length will be send too by tos server
                res.setHeader(
                  'content-range',
                  `bytes ${0}-${actualLength - 1}/${totalLength}`
                );
                res.setHeader('content-length', actualLength + 1);
              } else {
                res.setHeader('content-length', totalLength + 1);
              }

              for (let i = 0; i < actualCnt; ++i) {
                await new Promise((r) => setTimeout(r, 100));
                res.write(Buffer.alloc(perLength, 'a'));
              }
              res.end();
            })
            .listen(undefined, '0.0.0.0', function (this: Server) {
              res(this);
            });
        });
      }
    },
    NEVER_TIMEOUT
  );

  it(
    'getObject dataTransfer and progress',
    async () => {
      const client = new TOS(tosOptions);
      const progressFn = jest.fn();
      const dataTransferFn = jest.fn();
      await client.getObjectV2({
        key,
        dataType: 'buffer',
        dataTransferStatusChange: dataTransferFn,
        progress: progressFn,
      });

      expect(progressFn.mock.calls[0][0]).toEqual(0);
      expect(dataTransferFn.mock.calls[0][0].totalBytes).toEqual(-1);
      expect(progressFn.mock.calls.filter((it) => it[0] === 1).length).toEqual(
        1
      );
      const lastCall = progressFn.mock.calls.slice(-1)[0];
      expect(lastCall[0]).toEqual(1);

      expect(
        dataTransferFn.mock.calls[0][0].type === DataTransferType.Started
      ).toBe(true);
      expect(
        dataTransferFn.mock.calls[2][0].consumedBytes ===
          dataTransferFn.mock.calls[2][0].rwOnceBytes +
            dataTransferFn.mock.calls[1][0].consumedBytes
      ).toBe(true);

      const lastData =
        dataTransferFn.mock.calls[dataTransferFn.mock.calls.length - 2][0];
      expect(
        lastData.type === DataTransferType.Rw &&
          lastData.consumedBytes === lastData.totalBytes
      ).toBe(true);

      expect(
        dataTransferFn.mock.calls[dataTransferFn.mock.calls.length - 1][0]
          .type === DataTransferType.Succeed
      ).toBe(true);
    },
    NEVER_TIMEOUT
  );

  it(
    'getObject with setting response options',
    async () => {
      const client = new TOS(tosOptions);
      const contentLanguage = 'contentLanguage';
      const { headers } = await client.getObjectV2({
        key,
        response: {
          'content-language': contentLanguage,
        },
        dataType: 'buffer',
      });
      expect(headers['content-language']).toBe(contentLanguage);

      const contentLanguage2 = 'contentLanguage2';
      const { headers: header2 } = await client.getObjectV2({
        key,
        responseContentLanguage: contentLanguage2,
        dataType: 'buffer',
      });
      expect(header2['content-language']).toBe(contentLanguage2);

      const contentLanguage3 = 'contentLanguage3';
      const { headers: header3 } = await client.getObjectV2({
        key,
        responseContentLanguage: contentLanguage2,
        response: {
          'content-language': contentLanguage3,
          dataType: 'buffer',
        },
      });
      expect(header3['content-language']).toBe(contentLanguage3);
    },
    NEVER_TIMEOUT
  );

  it(
    'getObject with range',
    async () => {
      const client = new TOS(tosOptions);
      const start = 32;
      const end = 64;
      const { data } = await client.getObjectV2({
        key,
        dataType: 'buffer',
        rangeStart: start,
        rangeEnd: end,
      });
      expect(data.content.length).toEqual(end - start + 1);

      const start2 = 32;
      const end2 = 32;
      const { data: data2 } = await client.getObjectV2({
        key,
        dataType: 'buffer',
        range: `bytes=${start2}-${end2}`,
        rangeStart: start,
        rangeEnd: end,
      });
      expect(data2.content.length).toEqual(end2 - start2 + 1);
    },
    NEVER_TIMEOUT
  );
});
