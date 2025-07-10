import { tosOptions } from '../utils/options';
import TOS from '../../src/browser-index';
import http from 'http';
import { Server } from 'http';
import { IncomingMessage } from 'http';
import { ServerResponse } from 'http';
import { AddressInfo } from 'net';
import { safeAwait } from '../../src/utils';
import axios, { Method } from 'axios';
import { NEVER_TIMEOUT, sleepCache } from '../utils';

describe('test retry', () => {
  it(
    'signature before retry',
    async () => {
      console.log('signature before retry');
      const key = `sigature-before-retry`;
      let xTOSDate1 = '';
      let xTOSDate2 = '';
      let authorization1 = '';
      let authorization2 = '';
      const server = await startServer();
      const address = server.address() as AddressInfo;
      const client = new TOS({
        ...tosOptions,
        proxyHost: address.address,
        proxyPort: address.port,
        secure: false,
      });
      const [err, res] = await safeAwait(
        client.putObject({
          key,
          body: Buffer.from('0'),
        })
      );
      expect(res?.statusCode).toBe(200);
      expect(xTOSDate1).not.toBe(xTOSDate2);
      expect(authorization1).not.toBe(authorization2);
      expect(xTOSDate1.length > 0).toBe(true);
      expect(xTOSDate2.length > 0).toBe(true);
      expect(xTOSDate2 > xTOSDate1).toBe(true);
      expect(authorization1.length > 0).toBe(true);
      expect(authorization2.length > 0).toBe(true);

      function startServer(): Promise<Server> {
        let count = 0;
        return new Promise((res) => {
          http
            .createServer(async (req: IncomingMessage, res: ServerResponse) => {
              if (count === 0) {
                res.statusCode = 502;
                count++;
                xTOSDate1 = req.headers['x-tos-date'] as string;
                authorization1 = req.headers['authorization'] as string;
                await sleepCache(2000);
                res.end();
              } else {
                const { method, url, headers } = req;
                xTOSDate2 = req.headers['x-tos-date'] as string;
                authorization2 = req.headers['authorization'] as string;
                const response = await axios.request({
                  method: method as Method,
                  url, // 修改目标地址到你想要转发的目标URL
                  data: req,
                  headers: headers,
                });
                res.writeHead(response.status, response.headers);
                res.end(response.data);
              }
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
    'signature before retry upload part',
    async () => {
      console.log('signature before retry part');
      const key = `sigature-before-retry-part`;
      const client2 = new TOS({
        ...tosOptions,
      });
      const partRes = await client2.createMultipartUpload({
        key,
      });
      let xTOSDate1 = '';
      let xTOSDate2 = '';
      let authorization1 = '';
      let authorization2 = '';

      const server = await startServer();
      const address = server.address() as AddressInfo;
      const client = new TOS({
        ...tosOptions,
        proxyHost: address.address,
        proxyPort: address.port,
        secure: false,
      });
      const [err, res] = await safeAwait(
        client.uploadPart({
          key,
          body: Buffer.alloc(1024 * 1024 * 4),
          uploadId: partRes.data.UploadId,
          partNumber: 1,
        })
      );
      expect(res?.statusCode).toBe(200);

      function startServer(): Promise<Server> {
        let count = 0;
        return new Promise((res) => {
          http
            .createServer(async (req: IncomingMessage, res: ServerResponse) => {
              if (count === 0) {
                res.statusCode = 502;
                count++;
                await sleepCache(2000);
                xTOSDate1 = req.headers['x-tos-date'] as string;
                authorization1 = req.headers['authorization'] as string;
                res.end();
              } else {
                const { method, url, headers } = req;
                xTOSDate2 = req.headers['x-tos-date'] as string;
                authorization2 = req.headers['authorization'] as string;
                const response = await axios.request({
                  method: method as Method,
                  url, // 修改目标地址到你想要转发的目标URL
                  data: req,
                  headers: headers,
                  //params: req.query,
                });
                res.writeHead(response.status, response.headers);
                res.end(response.data);
              }
            })
            .listen(undefined, '0.0.0.0', function (this: Server) {
              res(this);
            });
        });
      }

      await client2.completeMultipartUpload({
        key,
        uploadId: partRes.data.UploadId,
        parts: [
          {
            partNumber: 1,
            eTag: res?.data.ETag as string,
          },
        ],
      });

      const headRes = await client2.headObject({
        key,
      });
      expect(Number(headRes.data['content-length'])).toBe(4 * 1024 * 1024);
      expect(xTOSDate1).not.toBe(xTOSDate2);
      expect(authorization1).not.toBe(authorization2);
      expect(xTOSDate1.length > 0).toBe(true);
      expect(xTOSDate2.length > 0).toBe(true);
      expect(xTOSDate2 > xTOSDate1).toBe(true);
      expect(authorization1.length > 0).toBe(true);
      expect(authorization2.length > 0).toBe(true);
      //expect(authorization2.length === 0).toBe(true)
    },
    NEVER_TIMEOUT
  );

  it(
    'signature before retry list objects',
    async () => {
      console.log('signature before retry list objects');
      let xTOSDate1 = '';
      let xTOSDate2 = '';
      let authorization1 = '';
      let authorization2 = '';
      const server = await startServer();
      const address = server.address() as AddressInfo;
      const client = new TOS({
        ...tosOptions,
        proxyHost: address.address,
        proxyPort: address.port,
        secure: false,
      });
      const [err, res] = await safeAwait(
        client.listObjectsType2({
          prefix: 'abc',
          delimiter: '/',
        })
      );
      expect(res?.statusCode).toBe(200);
      expect(res?.data.Prefix).toBe('abc');
      expect(res?.data.Delimiter).toBe('/');

      expect(xTOSDate1).not.toBe(xTOSDate2);
      expect(authorization1).not.toBe(authorization2);
      expect(xTOSDate1.length > 0).toBe(true);
      expect(xTOSDate2.length > 0).toBe(true);
      expect(xTOSDate2 > xTOSDate1).toBe(true);
      expect(authorization1.length > 0).toBe(true);
      expect(authorization2.length > 0).toBe(true);

      function startServer(): Promise<Server> {
        let count = 0;
        return new Promise((res) => {
          http
            .createServer(async (req: IncomingMessage, res: ServerResponse) => {
              if (count === 0) {
                res.statusCode = 502;
                xTOSDate1 = req.headers['x-tos-date'] as string;
                authorization1 = req.headers['authorization'] as string;
                count++;
                await sleepCache(2000);
                res.end();
              } else {
                const { method, url, headers } = req;
                const response = await axios.request({
                  method: method as Method,
                  url, // 修改目标地址到你想要转发的目标URL
                  headers: headers,
                  //params: req.query,
                });
                xTOSDate2 = req.headers['x-tos-date'] as string;
                authorization2 = req.headers['authorization'] as string;
                res.writeHead(response.status, response.headers);
                res.end(JSON.stringify(response.data));
              }
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
