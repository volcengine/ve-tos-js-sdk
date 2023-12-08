import path from 'path';
import fs from 'fs';
import TOS from '../../src/browser-index';
import { deleteBucket, sleepCache, NEVER_TIMEOUT } from '../utils';
import {
  testBucketName,
  isNeedDeleteBucket,
  tosOptions,
} from '../utils/options';
import { objectKey10M, objectPath10M, tmpDir } from './utils';
import { promisify } from 'util';
import http, { IncomingMessage, ServerResponse, Server } from 'http';
import { safeAwait } from '../../src/utils';
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
      const client = new TOS({ ...tosOptions, endpoint, secure: false });

      // check stream
      const [err] = await safeAwait(
        client.getObjectV2({ key: 'aa', dataType: 'buffer' })
      );
      expect(err).toBeTruthy();

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
            Range: 'bytes=0-1',
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
              const actualCnt = 8;
              const totalLength = cnt * perLength;
              const actualLength = actualCnt * perLength;
              if (req.headers['range'] != null) {
                // content-range will not be send alone,
                // content-length will be send too by tos server
                res.setHeader(
                  'content-range',
                  `bytes ${0}-${actualLength - 1}/${totalLength}`
                );
                res.setHeader('content-length', totalLength);
              } else {
                res.setHeader('content-length', totalLength);
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
});
