import axios from 'axios';
import TOS, { CancelToken, isCancel } from '../../src/browser-index';
import { NEVER_TIMEOUT, sleepCache } from '../utils';
import { tosOptions } from '../utils/options';
import * as fsPromises from '../../src/nodejs/fs-promises';
import path from 'path';
import {
  CheckpointRecord,
  UploadEvent,
  UploadEventType,
  UploadFileInput,
} from '../../src/methods/object/multipart/uploadFile';
import {
  checkpointsDir,
  objectKey100M,
  objectKey1K,
  objectKeyEmpty,
  objectPath100M,
  objectPath1K,
  objectPathEmpty,
} from './utils';
import { DataTransferType } from '../../src/interface';
import { streamToBuf } from '../../src/utils';
import { hashMd5 } from '../../src/universal/crypto';

describe('uploadFile in node.js environment', () => {
  it(
    'small file without checkpoint',
    async () => {
      const key = `${objectKey1K}_without_checkpoint`;
      const client = new TOS(tosOptions);
      await client.uploadFile({ file: objectPath1K, key });
      const { data } = await client.getObjectV2(key);
      expect((await streamToBuf(data.content)).length === 1024).toBeTruthy();
    },
    NEVER_TIMEOUT
  );

  it(
    'without checkpoint',
    async () => {
      const key = `${objectKey100M}-without-checkpoint`;
      const client = new TOS(tosOptions);
      await client.uploadFile({ file: objectPath100M, key });
      const { data } = await client.headObject(key);
      expect(+data['content-length'] === 100 * 1024 * 1024).toBeTruthy();
    },
    NEVER_TIMEOUT
  );

  it(
    'small file with checkpoint file',
    async () => {
      const key = `${objectKey1K}_with_checkpoint_file`;
      const client = new TOS(tosOptions);
      const uploadEventChangeFn = jest.fn();
      const progressFn = jest.fn();
      await client.uploadFile({
        file: objectPath1K,
        key,
        checkpoint: checkpointsDir,
        uploadEventChange: uploadEventChangeFn,
        progress: progressFn,
      });
      expect(uploadEventChangeFn.mock.calls.length).toBe(3);
      expect(uploadEventChangeFn.mock.calls[0][0].type).toBe(
        UploadEventType.CreateMultipartUploadSucceed
      );
      const checkpointFilePath =
        uploadEventChangeFn.mock.calls[0][0].checkpointFile;
      expect(checkpointFilePath).not.toBeUndefined();
      expect(uploadEventChangeFn.mock.calls[0][0].type).toBe(
        UploadEventType.CreateMultipartUploadSucceed
      );

      expect(progressFn.mock.calls.length).toBe(2);
      expect(progressFn.mock.calls[0][0]).toBe(0);
      expect(progressFn.mock.calls[1][0]).toBe(1);

      const { data } = await client.getObjectV2(key);
      expect((await streamToBuf(data.content)).length === 1024).toBeTruthy();
    },
    NEVER_TIMEOUT
  );

  it(
    'with specific checkpoint filename',
    async () => {
      const key = `${objectKey1K}_with_specific_checkpoint_file`;
      const client = new TOS(tosOptions);
      const uploadEventChangeFn = jest.fn();
      const filepath = path.resolve(
        checkpointsDir,
        'uploadFile-specific_checkpoint_file.json'
      );

      await client.uploadFile({
        file: objectPath1K,
        key,
        checkpoint: filepath,
        uploadEventChange: uploadEventChangeFn,
      });

      expect(uploadEventChangeFn.mock.calls[0][0].checkpointFile).toBe(
        filepath
      );
    },
    NEVER_TIMEOUT
  );

  it(
    'pause and resume with checkpoint',
    async () => {
      const key = `${objectKey100M}-pause-and-resume-with-checkpoint`;
      const client = new TOS(tosOptions);
      const cpFilepath = path.resolve(
        checkpointsDir,
        'uploadFile-pause-and-resume-checkpoint.json'
      );
      await fsPromises.rm(cpFilepath).catch(() => {});

      let resolve = (_v?: unknown) => {};
      const p = new Promise((r) => (resolve = r));
      const pausePartCount = 4;
      const allPartCount = 10;
      let currentPartCount = 0;
      const source = axios.CancelToken.source();
      const uploadEventChange = (e: UploadEvent) => {
        if (e.type === UploadEventType.UploadPartSucceed) {
          ++currentPartCount;

          if (currentPartCount === pausePartCount) {
            source.cancel('');
            setTimeout(resolve, 1000);
          }
        }
      };

      const uploadFilePromise = client.uploadFile({
        file: objectPath100M,
        key,
        checkpoint: cpFilepath,
        uploadEventChange,
        partSize: (100 * 1024 * 1024) / allPartCount,
        cancelToken: source.token,
      });
      await uploadFilePromise.catch((err) => {
        if (!isCancel(err)) {
          console.log(err);
        }
        expect(isCancel(err)).toBeTruthy();
      });
      const checkpointFileContent: CheckpointRecord = require(cpFilepath);
      const uploadedPartCount = checkpointFileContent.parts_info?.length || 0;

      // first write file, then call callback
      // so there maybe be more part
      expect(uploadedPartCount).toBeGreaterThanOrEqual(pausePartCount);

      await p;
      const uploadEventChangeFn = jest.fn();
      await client.uploadFile({
        file: objectPath100M,
        key,
        checkpoint: cpFilepath,
        uploadEventChange: uploadEventChangeFn,
      });

      expect(
        uploadEventChangeFn.mock.calls.filter(
          (it) => it[0].type === UploadEventType.UploadPartSucceed
        ).length
      ).toBe(allPartCount - uploadedPartCount);
      expect(
        uploadEventChangeFn.mock.calls.filter(
          (it) => it[0].type === UploadEventType.CompleteMultipartUploadSucceed
        ).length
      ).toBe(1);

      const { data } = await client.headObject(key);
      expect(+data['content-length'] === 100 * 1024 * 1024).toBeTruthy();
    },
    NEVER_TIMEOUT
  );

  it(
    'pause and resume with checkpoint when partNum is 3',
    async () => {
      const key = `${objectKey100M}-pause-and-resume-with-checkpoint-when-partNum-is-3`;
      const client = new TOS(tosOptions);
      const cpFilepath = path.resolve(
        checkpointsDir,
        'uploadFile-pause-and-resume-checkpoint-when-partNum-is-3.json'
      );
      await fsPromises.rm(cpFilepath).catch(() => {});

      let resolve = (_v?: unknown) => {};
      const p = new Promise((r) => (resolve = r));
      const pausePartCount = 4;
      const allPartCount = 10;
      let currentPartCount = 0;
      const source = axios.CancelToken.source();
      const uploadEventChange = (e: UploadEvent) => {
        if (e.type === UploadEventType.UploadPartSucceed) {
          ++currentPartCount;

          if (currentPartCount === pausePartCount) {
            source.cancel('');
            setTimeout(resolve, 1000);
          }
        }
      };

      const uploadFilePromise = client.uploadFile({
        file: objectPath100M,
        key,
        checkpoint: cpFilepath,
        uploadEventChange,
        partSize: (100 * 1024 * 1024) / allPartCount,
        cancelToken: source.token,
        taskNum: 3,
      });
      await uploadFilePromise.catch((err) => {
        if (!isCancel(err)) {
          console.log(err);
        }
        expect(isCancel(err)).toBeTruthy();
      });
      const checkpointFileContent: CheckpointRecord = require(cpFilepath);
      const uploadedPartCount = checkpointFileContent.parts_info?.length || 0;

      // first write file, then call callback
      // so there maybe be more part
      expect(uploadedPartCount).toBeGreaterThanOrEqual(pausePartCount);

      await p;
      const uploadEventChangeFn = jest.fn();
      await client.uploadFile({
        file: objectPath100M,
        key,
        checkpoint: cpFilepath,
        uploadEventChange: uploadEventChangeFn,
        taskNum: 3,
      });

      expect(
        uploadEventChangeFn.mock.calls.filter(
          (it) => it[0].type === UploadEventType.UploadPartSucceed
        ).length
      ).toBe(allPartCount - uploadedPartCount);
      expect(
        uploadEventChangeFn.mock.calls.filter(
          (it) => it[0].type === UploadEventType.CompleteMultipartUploadSucceed
        ).length
      ).toBe(1);

      const { data } = await client.headObject(key);
      expect(+data['content-length'] === 100 * 1024 * 1024).toBeTruthy();
    },
    NEVER_TIMEOUT
  );

  it(
    'pause and resume without checkpoint file',
    async () => {
      const key = `${objectKey100M}-pause-and-resume-without-checkpoint-file`;
      const client = new TOS(tosOptions);

      let resolve = (_v?: unknown) => {};
      const p = new Promise((r) => (resolve = r));
      const size = 100 * 1024 * 1024;
      const pausePartCount = 5;
      const allPartCount = 10;
      const source = axios.CancelToken.source();
      let abortedCheckpoint: CheckpointRecord =
        null as unknown as CheckpointRecord;
      const progress: UploadFileInput['progress'] = (p, cp) => {
        if (p >= 0.5) {
          abortedCheckpoint = cp;
          source.cancel();

          setTimeout(resolve, 1000);
        }
      };
      const dataTransferStatusChangeFn = jest.fn();

      const uploadFilePromise = client.uploadFile({
        file: objectPath100M,
        key,
        progress,
        dataTransferStatusChange: dataTransferStatusChangeFn,
        partSize: size / allPartCount,
        cancelToken: source.token,
      });
      await uploadFilePromise.catch((err) => {
        if (!isCancel(err)) {
          console.log(err);
        }
        expect(isCancel(err)).toBeTruthy();
      });

      // first write file, then call callback
      // so there maybe be more part
      expect(abortedCheckpoint.parts_info?.length).toBeGreaterThanOrEqual(
        pausePartCount
      );

      expect(
        dataTransferStatusChangeFn.mock.calls.filter((it) => {
          return it[0].type === DataTransferType.Started;
        }).length
      ).toBe(1);
      expect(
        dataTransferStatusChangeFn.mock.calls.filter((it) => {
          return it[0].type === DataTransferType.Failed;
        }).length
      ).toBe(1);

      await p;
      await client.uploadFile({
        file: objectPath100M,
        key,
        dataTransferStatusChange: dataTransferStatusChangeFn,
        checkpoint: abortedCheckpoint,
      });
      expect(
        dataTransferStatusChangeFn.mock.calls.filter((it) => {
          return it[0].type === DataTransferType.Started;
        }).length
      ).toBe(2);
      const lastCall = dataTransferStatusChangeFn.mock.calls.slice(-1)[0];
      expect(lastCall[0].type === DataTransferType.Succeed).toBe(true);
      expect(lastCall[0].consumedBytes === lastCall[0].totalBytes).toBe(true);

      const { data } = await client.headObject(key);
      expect(+data['content-length'] === 100 * 1024 * 1024).toBeTruthy();
    },
    NEVER_TIMEOUT
  );

  it(
    'fileSize is 0',
    async () => {
      const client = new TOS(tosOptions);
      const progressFn = jest.fn();

      await client.uploadFile({
        key: 'test-fileSize-0',
        file: Buffer.from([]),
        progress: progressFn,
      });

      expect(progressFn.mock.calls.length).toBe(2);
      expect(progressFn.mock.calls[0][0]).toBe(0);
      expect(progressFn.mock.calls[1][0]).toBe(1);
    },
    NEVER_TIMEOUT
  );

  it(
    'fetch this object after progress 100%',
    async () => {
      const key = `${objectKey100M}-fetch-after-100%`;
      const client = new TOS(tosOptions);
      let p2Resolve: any = null;
      let p2Reject: any = null;
      const p2 = new Promise((r1, r2) => {
        p2Resolve = r1;
        p2Reject = r2;
      });

      const p1 = client.uploadFile({
        file: objectPath100M,
        key,
        progress: async (p) => {
          try {
            if (p === 1) {
              const { data } = await client.headObject(key);
              expect(
                +data['content-length'] === 100 * 1024 * 1024
              ).toBeTruthy();
              p2Resolve();
            }
          } catch (err) {
            p2Reject(err);
          }
        },
      });

      await Promise.all([p1, p2]);
    },
    NEVER_TIMEOUT
  );

  it(
    'upload empty file',
    async () => {
      const key = `${objectKeyEmpty}-uploadFile`;
      const client = new TOS(tosOptions);
      await client.uploadFile({ file: objectPathEmpty, key });
      const { data } = await client.headObject(key);
      expect(+data['content-length'] === 0).toBeTruthy();
    },
    NEVER_TIMEOUT
  );

  it(
    'test enableContentMD5',
    async () => {
      const key = `${objectKey100M}-test-enableContentMD5`;
      const client = new TOS(tosOptions);
      await client.uploadFile({
        file: objectPath100M,
        key,
        enableContentMD5: true,
      });

      const { data } = await client.headObject(key);
      expect(+data['content-length'] === 100 * 1024 * 1024).toBeTruthy();
    },
    NEVER_TIMEOUT
  );

  it(
    'uploadFile 100M cancal',
    async () => {
      const client = new TOS(tosOptions);
      const progressFn = jest.fn();
      const dataTransferFn = jest.fn();
      const uploadEventChangeFn = jest.fn();

      const cancelTokenSource = CancelToken.source();
      setTimeout(() => {
        cancelTokenSource.cancel();
      }, 2_000);

      try {
        await client.uploadFile({
          key: objectKey100M,
          file: objectPath100M,
          taskNum: 3,
          dataTransferStatusChange: dataTransferFn,
          progress: progressFn,
          uploadEventChange: uploadEventChangeFn,
          cancelToken: cancelTokenSource.token,
        });
        expect('').toBe('not enter this branch');
      } catch (err) {
        expect(isCancel(err)).toBeTruthy();
        const dataTransferStatusChangeCallsLen =
          dataTransferFn.mock.calls.length;
        const progressCallsLen = progressFn.mock.calls.length;
        const downloadEventChangeCallsLen =
          uploadEventChangeFn.mock.calls.length;
        // expect: don't receive new callbacks after cancel error
        await sleepCache(10_000);
        expect(dataTransferFn.mock.calls.length).toBe(
          dataTransferStatusChangeCallsLen
        );
        expect(progressFn.mock.calls.length).toBe(progressCallsLen);
        expect(uploadEventChangeFn.mock.calls.length).toBe(
          downloadEventChangeCallsLen
        );
      }
    },
    NEVER_TIMEOUT
  );

  it(
    'uploadFile by ssec',
    async () => {
      const key = `${objectKey100M}-test-uploadFile-by-ssec`;
      const client = new TOS(tosOptions);

      const ssecKey = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
      const ssecMd5 = hashMd5(ssecKey, 'base64');
      await client.uploadFile({
        file: objectPath100M,
        key,
        ssecAlgorithm: 'AES256',
        ssecKey: Buffer.from(ssecKey).toString('base64'),
        ssecKeyMD5: ssecMd5,
      });

      const { data } = await client.headObject({
        key,
        ssecAlgorithm: 'AES256',
        ssecKey: Buffer.from(ssecKey).toString('base64'),
        ssecKeyMD5: ssecMd5,
      });
      expect(+data['content-length'] === 100 * 1024 * 1024).toBeTruthy();
    },
    NEVER_TIMEOUT
  );

  it('modify file after pause', async () => {}, NEVER_TIMEOUT);

  it(
    "partSize param is not equal to checkpoint file's partSize",
    async () => {},
    NEVER_TIMEOUT
  );

  // first upload part will fail
  it('uploadId of checkpoint file is aborted', async () => {}, NEVER_TIMEOUT);
});
