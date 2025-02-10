import { tosOptions } from '../utils/options';
import TOS from '../../src/browser-index';
import http from 'http';
import { Server } from 'http';
import { IncomingMessage } from 'http';
import { ServerResponse } from 'http';
import { AddressInfo } from 'net';
import { safeAwait } from '../../src/utils';
import axios, { Method } from 'axios';

describe('test retry', () => {
  it('signature before retry', async () => {
    console.log('signature before retry');
    const key = `sigature-before-retry`;
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

    function startServer(): Promise<Server> {
      let count = 0;
      return new Promise((res) => {
        http
          .createServer(async (req: IncomingMessage, res: ServerResponse) => {
            if (count === 0) {
              res.statusCode = 502;
              count++;
              res.end();
            } else {
              const { method, url, headers } = req;
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
  });

  it('signature before retry upload part', async () => {
    console.log('signature before retry part');
    const key = `sigature-before-retry-part`;
    const client2 = new TOS({
      ...tosOptions,
    });
    const partRes = await client2.createMultipartUpload({
      key,
    });

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
              res.end();
            } else {
              const { method, url, headers } = req;
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
  });

  it('signature before retry list objects', async () => {
    console.log('signature before retry list objects');
    const server = await startServer();
    const address = server.address() as AddressInfo;
    const client = new TOS({
      ...tosOptions,
      proxyHost: address.address,
      proxyPort: address.port,
      secure: false,
    });
    const [err, res] = await safeAwait(client.listObjectsType2({
      prefix: 'abc',
      delimiter: '/'
    }));
    expect(res?.statusCode).toBe(200);
    expect(res?.data.Prefix).toBe('abc');
    expect(res?.data.Delimiter).toBe('/');

    function startServer(): Promise<Server> {
      let count = 0;
      return new Promise((res) => {
        http
          .createServer(async (req: IncomingMessage, res: ServerResponse) => {
            if (count === 0) {
              res.statusCode = 502;
              count++;
              res.end();
            } else {
              const { method, url, headers } = req;
              const response = await axios.request({
                method: method as Method,
                url, // 修改目标地址到你想要转发的目标URL
                headers: headers,
                //params: req.query,
              });
              res.writeHead(response.status, response.headers);
              res.end(JSON.stringify(response.data));
            }
          })
          .listen(undefined, '0.0.0.0', function (this: Server) {
            res(this);
          });
      });
    }
  });
});
