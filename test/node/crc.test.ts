import path, { resolve } from 'path';
import fs from 'fs';
import fsp from 'fs/promises';
import http from 'http';
import TOS, {
  CancelToken,
  DownloadEventType,
  StorageClassType,
  UploadEventType,
} from '../../src/browser-index';
import { CRC } from '../../src/nodejs/crc.node';
import { NEVER_TIMEOUT } from '../utils';
import { tosOptions } from '../utils/options';
import {
  checkpointsDir,
  downloadFileDir,
  objectKey100M,
  objectKey10M,
  objectPath100M,
  objectPath10M,
  objectPath1M,
} from './utils';
import { safeAwait } from '../../src/utils';
import { CheckpointRecord } from '../../src/methods/object/multipart/uploadFile';
import { Server } from 'http';
import { IncomingMessage } from 'http';
import { ServerResponse } from 'http';
import { AddressInfo } from 'net';
import { crc64 } from 'tos-crc64-js';
import { DownloadFileCheckpointRecord } from '../../src/methods/object/downloadFile';

describe('test crc64', () => {
  it(
    'putObjectFromFile with crc',
    async () => {
      const key = `${objectKey10M}-putObjectFromFile-with-crc`;
      const client = new TOS({ ...tosOptions, enableCRC: true });

      await client.putObjectFromFile({
        filePath: objectPath10M,
        key,
      });

      const { data } = await client.headObject(key);
      expect(+data['content-length'] === 10 * 1024 * 1024).toBeTruthy();
    },
    NEVER_TIMEOUT
  );

  it(
    'putObject with crc error',
    async () => {
      const key = `putObject with crc error`;
      const server = await startServer();
      const address = server.address() as AddressInfo;
      const endpoint = `${address.address}:${address.port}`;
      const client = new TOS({
        ...tosOptions,
        endpoint,
        secure: false,
        enableCRC: true,
      });

      const [err] = await safeAwait(
        client.putObject({
          key,
          body: Buffer.from('0'),
        })
      );
      expect(err.toString().includes('crc'));

      server.close();
      function startServer(): Promise<Server> {
        return new Promise((res) => {
          http
            .createServer(
              async (_req: IncomingMessage, res: ServerResponse) => {
                res.setHeader(
                  'x-tos-hash-crc64ecma',
                  'invalid crc value in test environment'
                );
                res.end();
              }
            )
            .listen(undefined, '0.0.0.0', function (this: Server) {
              res(this);
            });
        });
      }
    },
    NEVER_TIMEOUT
  );

  it(
    'putObject with Buffer with crc64',
    async () => {
      const key = `putObject with Buffer with crc64`;
      const body = Buffer.from('123456789'.repeat(1111997));
      const client = new TOS({ ...tosOptions, enableCRC: true });
      await client.putObject({ key, body });
      const { data } = await client.headObject(key);
      expect(+data['content-length']).toBe(body.length);
    },
    NEVER_TIMEOUT
  );

  it(
    'uploadFile with crc',
    async () => {
      const key = `${objectKey100M}-uploadFile with crc`;
      const client = new TOS({ ...tosOptions, enableCRC: true });
      const partSize = 6972593;
      const cancelTokenSource = CancelToken.source();
      const modifyPartNumber = 3;
      const checkpointPath = path.resolve(
        checkpointsDir,
        `${key}.checkpoint.json`
      );

      const [err] = await safeAwait(
        client.uploadFile({
          file: objectPath100M,
          checkpoint: checkpointPath,
          key,
          partSize,
          taskNum: 2,
          uploadEventChange: function (e) {
            if (e.type === UploadEventType.UploadPartSucceed) {
              if (e.uploadPartInfo?.partNumber === modifyPartNumber) {
                cancelTokenSource.cancel();
              }
            }
          },
          cancelToken: cancelTokenSource.token,
        })
      );
      expect(err.toString().includes('cancel')).toBeTruthy();

      await client.uploadFile({
        file: objectPath100M,
        checkpoint: checkpointPath,
        key,
        partSize,
        taskNum: 3,
      });

      const { data } = await client.headObject(key);
      expect(+data['content-length'] === 100 * 1024 * 1024).toBeTruthy();
    },
    NEVER_TIMEOUT
  );

  it(
    'uploadFile with crc error',
    async () => {
      const key = `${objectKey100M}-uploadFile-with-crc-error`;
      const client = new TOS({ ...tosOptions, enableCRC: true });
      const partSize = 6972593;
      const cancelTokenSource = CancelToken.source();
      const modifyPartNumber = 3;
      const checkpointPath = path.resolve(
        checkpointsDir,
        `${key}.checkpoint.json`
      );

      const [err] = await safeAwait(
        client.uploadFile({
          file: objectPath100M,
          checkpoint: checkpointPath,
          key,
          partSize,
          taskNum: 2,
          uploadEventChange: function (e) {
            if (e.type === UploadEventType.UploadPartSucceed) {
              if (e.uploadPartInfo?.partNumber === modifyPartNumber) {
                cancelTokenSource.cancel();
              }
            }
          },
          cancelToken: cancelTokenSource.token,
        })
      );
      expect(err.toString().includes('cancel')).toBeTruthy();

      const cpJson: CheckpointRecord = require(checkpointPath);
      const modifyPart = cpJson.parts_info!.find(
        (it: any) => it.part_number === modifyPartNumber
      );
      modifyPart!.hash_crc64ecma = '123';
      await fsp.writeFile(checkpointPath, JSON.stringify(cpJson, null, 2));

      const [err2] = await safeAwait(
        client.uploadFile({
          file: objectPath100M,
          checkpoint: checkpointPath,
          key,
          partSize,
          taskNum: 3,
        })
      );
      expect(err2.toString().includes('crc')).toBeTruthy();
    },
    NEVER_TIMEOUT
  );

  it(
    'uploadPart with error crc',
    async () => {
      const key = `uploadPart with error crc`;
      const server = await startServer();
      const address = server.address() as AddressInfo;
      const endpoint = `${address.address}:${address.port}`;
      const client = new TOS({
        ...tosOptions,
        endpoint,
        secure: false,
        enableCRC: true,
      });

      const [err] = await safeAwait(
        client.uploadPart({
          key,
          body: Buffer.from('0'),
          partNumber: 1,
          uploadId: '1',
        })
      );
      expect(err.toString().includes('crc'));

      server.close();
      function startServer(): Promise<Server> {
        return new Promise((res) => {
          http
            .createServer(
              async (_req: IncomingMessage, res: ServerResponse) => {
                res.setHeader(
                  'x-tos-hash-crc64ecma',
                  'invalid crc value in test environment'
                );
                res.end();
              }
            )
            .listen(undefined, '0.0.0.0', function (this: Server) {
              res(this);
            });
        });
      }
    },
    NEVER_TIMEOUT
  );

  it(
    'appendObject with Buffer with crc',
    async () => {
      const key = `appendObject with Buffer with crc64`;
      const body1 = '01234'.repeat(111997);
      const body2 = '56789'.repeat(111997);
      const client = new TOS({ ...tosOptions, enableCRC: true });
      const res = await client.appendObject({
        key,
        body: Buffer.from(body1),
        offset: 0,
        storageClass: StorageClassType.StorageClassStandard,
      });
      await client.appendObject({
        key,
        body: Buffer.from(body2),
        offset: res.data.nextAppendOffset,
        preHashCrc64ecma: res.data.hashCrc64ecma,
        storageClass: StorageClassType.StorageClassStandard,
      });
      const { data } = await client.headObject(key);
      expect(+data['content-length']).toBe(body1.length + body2.length);
    },
    NEVER_TIMEOUT
  );

  it(
    'appendObject with error crc',
    async () => {
      const key = `appendObject with error crc`;
      const server = await startServer();
      const address = server.address() as AddressInfo;
      const endpoint = `${address.address}:${address.port}`;
      const client = new TOS({
        ...tosOptions,
        endpoint,
        secure: false,
        enableCRC: true,
      });

      const [err, res] = await safeAwait(
        client.appendObject({
          key,
          body: Buffer.from('0'),
          offset: 0,
          storageClass: StorageClassType.StorageClassStandard,
        })
      );
      expect(err.toString().includes('crc'));

      server.close();
      function startServer(): Promise<Server> {
        return new Promise((res) => {
          http
            .createServer(
              async (_req: IncomingMessage, res: ServerResponse) => {
                res.setHeader(
                  'x-tos-hash-crc64ecma',
                  'invalid crc value in test environment'
                );
                res.end();
              }
            )
            .listen(undefined, '0.0.0.0', function (this: Server) {
              res(this);
            });
        });
      }
    },
    NEVER_TIMEOUT
  );

  it(
    'downloadFile with crc',
    async () => {
      const partSize = 6972593;
      const key = `${objectPath100M}-downloadFile-with-crc`;
      const modifyPartNumber = 3;
      const checkpointPath = path.resolve(
        checkpointsDir,
        `${key}.checkpoint.json`
      );
      const client = new TOS({ ...tosOptions, enableCRC: true });
      await client.uploadFile({
        file: objectPath100M,
        key,
        taskNum: 5,
        partSize,
      });

      const filePath = path.resolve(downloadFileDir, key);
      const cancelTokenSource = CancelToken.source();
      const [err] = await safeAwait(
        client.downloadFile({
          key,
          filePath,
          taskNum: 2,
          partSize,
          checkpoint: checkpointPath,
          downloadEventChange: function (e) {
            if (e.type === DownloadEventType.DownloadPartSucceed) {
              if (e.downloadPartInfo?.partNumber === modifyPartNumber) {
                cancelTokenSource.cancel();
              }
            }
          },
          cancelToken: cancelTokenSource.token,
        })
      );
      expect(err.toString().includes('cancel')).toBeTruthy();

      await client.downloadFile({
        key,
        filePath,
        taskNum: 5,
        partSize,
        checkpoint: checkpointPath,
      });

      const fileCrc = await new Promise((resolve, reject) => {
        let fileCrc = '0';
        const readStream = fs.createReadStream(filePath);
        readStream.on('data', (d: Buffer) => {
          fileCrc = crc64(d, fileCrc);
        });
        readStream.on('end', () => {
          resolve(fileCrc);
        });
        readStream.on('error', reject);
      });
      const { data } = await client.headObject(key);
      expect(data['x-tos-hash-crc64ecma']).toBe(fileCrc);
    },
    NEVER_TIMEOUT
  );

  it(
    'downloadFile with error crc',
    async () => {
      const partSize = 6972593;
      const key = `${objectPath100M}-downloadFile-with-error-crc`;
      const modifyPartNumber = 3;
      const checkpointPath = path.resolve(
        checkpointsDir,
        `${key}.checkpoint.json`
      );
      const client = new TOS({ ...tosOptions, enableCRC: true });
      await client.uploadFile({
        file: objectPath100M,
        key,
        taskNum: 5,
        partSize,
      });

      const filePath = path.resolve(downloadFileDir, key);
      const cancelTokenSource = CancelToken.source();
      const [err] = await safeAwait(
        client.downloadFile({
          key,
          filePath,
          taskNum: 2,
          partSize,
          checkpoint: checkpointPath,
          downloadEventChange: function (e) {
            if (e.type === DownloadEventType.DownloadPartSucceed) {
              if (e.downloadPartInfo?.partNumber === modifyPartNumber) {
                cancelTokenSource.cancel();
              }
            }
          },
          cancelToken: cancelTokenSource.token,
        })
      );
      expect(err.toString().includes('cancel')).toBeTruthy();

      const cpJson: DownloadFileCheckpointRecord = require(checkpointPath);
      const modifyPart = cpJson.parts_info!.find(
        (it: any) => it.part_number === modifyPartNumber
      );
      modifyPart!.hash_crc64ecma = '123';
      await fsp.writeFile(checkpointPath, JSON.stringify(cpJson, null, 2));

      const [err2] = await safeAwait(
        client.downloadFile({
          key,
          filePath,
          taskNum: 5,
          partSize,
          checkpoint: checkpointPath,
        })
      );
      expect(err2.toString().includes('crc')).toBe(true);
    },
    NEVER_TIMEOUT
  );
});
