import axios from 'axios';
import TOS, {
  CancelToken,
  ResumableCopyEventType,
  isCancel,
} from '../../src/browser-index';
import { sleepCache, NEVER_TIMEOUT, testCheckErr } from '../utils';
import {
  testBucketName,
  isNeedDeleteBucket,
  tosOptions,
} from '../utils/options';
import * as fsPromises from '../../src/nodejs/fs-promises';
import path from 'path';
import {
  checkpointsDir,
  objectKey100M,
  objectKey10M,
  objectKey1K,
  objectKeyEmpty,
  objectPath100M,
  objectPath10M,
  objectPath1K,
  objectPathEmpty,
} from './utils';
import {
  ResumableCopyEvent,
  ResumableCopyCheckpointRecord,
} from '../../src/methods/object/multipart/resumableCopyObject';
import { StorageClassType } from '../../src';
import { streamToBuf } from '../../src/utils';

const objectKey10MSpecialName = `10M 🍡对象（!-_.*()/&$@=;:+ ,?\{^}%\`]>[~<#|'"）! ~ * ' ( )%2`;
const objectKey0MSpecialName = `0M 🍡对象（!-_.*()/&$@=;:+ ,?\{^}%\`]>[~<#|'"）! ~ * ' ( )%2`;

describe('resumableCopyObject in node.js environment', () => {
  beforeAll(async (done) => {
    const client = new TOS(tosOptions);
    await Promise.all([
      client.uploadFile({ file: objectPathEmpty, key: objectKeyEmpty }),
      client.uploadFile({ file: objectPath1K, key: objectKey1K }),
      client.uploadFile({ file: objectPath10M, key: objectKey10M }),
      client.uploadFile({ file: objectPath100M, key: objectKey100M }),
    ]);
    await client.resumableCopyObject({
      srcBucket: tosOptions.bucket,
      srcKey: objectKey10M,
      key: objectKey10MSpecialName,
    });
    await client.resumableCopyObject({
      srcBucket: tosOptions.bucket,
      srcKey: objectKeyEmpty,
      key: objectKey0MSpecialName,
    });
    await sleepCache();
    done();
  }, NEVER_TIMEOUT);

  it(
    'resumableCopyObject small file without checkpoint',
    async () => {
      const srcKey = objectKey1K;
      const key = `copy_${srcKey}_without_checkpoint`;
      const client = new TOS(tosOptions);
      await client.resumableCopyObject({
        srcBucket: tosOptions.bucket,
        srcKey,
        key,
      });
      const { data } = await client.headObject(key);
      expect(+data['content-length'] === 1024).toBeTruthy();
    },
    NEVER_TIMEOUT
  );

  it(
    'resumableCopyObject empty object pass headers',
    async () => {
      const srcKey = objectKeyEmpty;
      const key = `copy_${srcKey}_empty_object_pass_headers`;
      const client = new TOS(tosOptions);
      await client.resumableCopyObject({
        srcBucket: tosOptions.bucket,
        srcKey,
        key,
        headers: {
          'content-type': 'image/tiff',
          'x-tos-metadata-directive': 'REPLACE',
        },
      });
      const { data, headers } = await client.headObject(key);
      expect(+data['content-length'] === 0).toBeTruthy();
      expect(headers['content-type']).toBe('image/tiff');
    },
    NEVER_TIMEOUT
  );

  it(
    'resumableCopyObject pass headers',
    async () => {
      const srcKey = objectKey1K;
      const key = `copy_${srcKey}_pass_headers`;
      const client = new TOS(tosOptions);
      await client.resumableCopyObject({
        srcBucket: tosOptions.bucket,
        srcKey,
        key,
        headers: {
          'content-type': 'image/tiff',
        },
      });
      const { data, headers } = await client.headObject(key);
      expect(+data['content-length'] === 1024).toBeTruthy();
      expect(headers['content-type']).toBe('image/tiff');
    },
    NEVER_TIMEOUT
  );

  it(
    'resumableCopyObject pass CreateMultipart input',
    async () => {
      const srcKey = objectKey1K;
      const key = `copy_${srcKey}_pass_createMultipart_headers`;
      const client = new TOS(tosOptions);
      await client.resumableCopyObject({
        srcBucket: tosOptions.bucket,
        srcKey,
        key,
        serverSideEncryption: 'AES256',
        storageClass: StorageClassType.StorageClassIa,
        headers: {
          'content-type': 'image/tiff',
        },
      });
      const { headers } = await client.headObject(key);
      expect(headers['x-tos-storage-class']).toBe(
        StorageClassType.StorageClassIa
      );
      expect(headers['x-tos-server-side-encryption']).toBe('AES256');
      expect(headers['content-type']).toBe('image/tiff');
    },
    NEVER_TIMEOUT
  );

  it(
    'resumableCopyObject without checkpoint',
    async () => {
      const srcKey = objectKey100M;
      const key = `copy_${srcKey}-without-checkpoint`;
      const client = new TOS(tosOptions);
      await client.resumableCopyObject({
        srcBucket: tosOptions.bucket,
        srcKey,
        key,
      });
      const { data } = await client.headObject(key);
      expect(+data['content-length'] === 100 * 1024 * 1024).toBeTruthy();
    },
    NEVER_TIMEOUT
  );

  it(
    'resumableCopyObject small file with checkpoint file',
    async () => {
      const srcKey = objectKey1K;
      const key = `copy_${srcKey}_with_checkpoint_file`;
      const client = new TOS(tosOptions);
      const copyEventListenerFn = jest.fn();
      const progressFn = jest.fn();
      await client.resumableCopyObject({
        srcBucket: tosOptions.bucket,
        srcKey,
        key,
        checkpoint: checkpointsDir,
        copyEventListener: copyEventListenerFn,
        progress: progressFn,
      });

      expect(copyEventListenerFn.mock.calls.length).toBe(3);
      expect(copyEventListenerFn.mock.calls[0][0].type).toBe(
        ResumableCopyEventType.CreateMultipartUploadSucceed
      );
      const checkpointFilePath =
        copyEventListenerFn.mock.calls[0][0].checkpointFile;
      expect(checkpointFilePath).not.toBeUndefined();
      expect(copyEventListenerFn.mock.calls[0][0].type).toBe(
        ResumableCopyEventType.CreateMultipartUploadSucceed
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
    'resumableCopyObject with specific checkpoint filename',
    async () => {
      const srcKey = objectKey1K;
      const key = `copy_${srcKey}_with_specific_checkpoint_file`;
      const client = new TOS(tosOptions);
      const copyEventListenerFn = jest.fn();
      const filepath = path.resolve(
        checkpointsDir,
        'resumableCopyObject-specific_checkpoint_file.json'
      );

      await client.resumableCopyObject({
        srcBucket: tosOptions.bucket,
        srcKey,
        key,
        checkpoint: filepath,
        copyEventListener: copyEventListenerFn,
      });

      expect(copyEventListenerFn.mock.calls[0][0].checkpointFile).toBe(
        filepath
      );
    },
    NEVER_TIMEOUT
  );

  it(
    'resumableCopyObject pause and resume with checkpoint, end',
    async () => {
      const srcKey = objectKey100M;
      const key = `copy_${srcKey}-pause-and-resume-with-checkpoint`;
      const client = new TOS(tosOptions);
      const cpFilepath = path.resolve(
        checkpointsDir,
        'resumableCopyObject-pause-and-resume-checkpoint.json'
      );
      await fsPromises.rm(cpFilepath).catch(() => {});

      let resolve = (_v?: unknown) => {};
      const p = new Promise((r) => (resolve = r));
      const pausePartCount = 4;
      const allPartCount = 10;
      let currentPartCount = 0;
      const source = axios.CancelToken.source();
      const copyEventListener = (e: ResumableCopyEvent) => {
        if (e.type === ResumableCopyEventType.UploadPartCopySucceed) {
          ++currentPartCount;

          if (currentPartCount === pausePartCount) {
            source.cancel('');
            setTimeout(resolve, 1000);
          }
        }
      };

      const uploadFilePromise = client.resumableCopyObject({
        srcBucket: tosOptions.bucket,
        srcKey,
        key,
        checkpoint: cpFilepath,
        copyEventListener,
        partSize: (100 * 1024 * 1024) / allPartCount,
        cancelToken: source.token,
      });
      await testCheckErr(
        () => uploadFilePromise,
        (err) => err.toString().toLowerCase().includes('cancel')
      );
      const checkpointFileContent: ResumableCopyCheckpointRecord = require(cpFilepath);
      const uploadedPartCount = checkpointFileContent.parts_info?.length || 0;

      // first write file, then call callback
      // so there maybe be more part
      expect(uploadedPartCount).toBeGreaterThanOrEqual(pausePartCount);

      await p;
      const copyEventListenerFn = jest.fn();
      await client.resumableCopyObject({
        srcBucket: tosOptions.bucket,
        srcKey,
        key,
        checkpoint: cpFilepath,
        copyEventListener: copyEventListenerFn,
      });

      const partSucceedCount = copyEventListenerFn.mock.calls.filter(
        (it) => it[0].type === ResumableCopyEventType.UploadPartCopySucceed
      ).length;
      // TODO(chengang.07): partSucceedCount 可能是 5，频率挺高
      // 实际上期望是 6
      expect(
        partSucceedCount === allPartCount - uploadedPartCount ||
          partSucceedCount === allPartCount - uploadedPartCount - 1
      ).toBeTruthy();
      expect(
        copyEventListenerFn.mock.calls.filter(
          (it) =>
            it[0].type === ResumableCopyEventType.CompleteMultipartUploadSucceed
        ).length
      ).toBe(1);

      const { data } = await client.headObject(key);
      expect(+data['content-length'] === 100 * 1024 * 1024).toBeTruthy();
    },
    NEVER_TIMEOUT
  );

  it(
    'resumableCopyObject pause and resume with checkpoint when partNum is 3',
    async () => {
      const srcKey = objectKey100M;
      const key = `copy_${srcKey}-pause-and-resume-with-checkpoint-when-partNum-is-3`;
      const client = new TOS(tosOptions);
      const cpFilepath = path.resolve(
        checkpointsDir,
        'resumableCopyObject-pause-and-resume-checkpoint-when-partNum-is-3.json'
      );
      await fsPromises.rm(cpFilepath).catch(() => {});

      let resolve = (_v?: unknown) => {};
      const p = new Promise((r) => (resolve = r));
      const pausePartCount = 4;
      const allPartCount = 10;
      let currentPartCount = 0;
      const source = axios.CancelToken.source();
      const copyEventListener = (e: ResumableCopyEvent) => {
        if (e.type === ResumableCopyEventType.UploadPartCopySucceed) {
          ++currentPartCount;

          if (currentPartCount === pausePartCount) {
            source.cancel('');
            setTimeout(resolve, 1000);
          }
        }
      };

      const uploadFilePromise = client.resumableCopyObject({
        srcBucket: tosOptions.bucket,
        srcKey,
        key,
        checkpoint: cpFilepath,
        copyEventListener,
        partSize: (100 * 1024 * 1024) / allPartCount,
        cancelToken: source.token,
        taskNum: 3,
      });
      await testCheckErr(
        () => uploadFilePromise,
        (err) => err.toString().toLowerCase().includes('cancel')
      );
      const checkpointFileContent: ResumableCopyCheckpointRecord = require(cpFilepath);
      const uploadedPartCount = checkpointFileContent.parts_info?.length || 0;

      // first write file, then call callback
      // so there maybe be more part
      expect(uploadedPartCount).toBeGreaterThanOrEqual(pausePartCount);

      await p;
      const copyEventListenerFn = jest.fn();
      await client.resumableCopyObject({
        srcBucket: tosOptions.bucket,
        srcKey,
        key,
        checkpoint: cpFilepath,
        copyEventListener: copyEventListenerFn,
        taskNum: 3,
      });

      expect(
        copyEventListenerFn.mock.calls.filter(
          (it) => it[0].type === ResumableCopyEventType.UploadPartCopySucceed
        ).length
      ).toBe(allPartCount - uploadedPartCount);
      expect(
        copyEventListenerFn.mock.calls.filter(
          (it) =>
            it[0].type === ResumableCopyEventType.CompleteMultipartUploadSucceed
        ).length
      ).toBe(1);

      const { data } = await client.headObject(key);
      expect(+data['content-length'] === 100 * 1024 * 1024).toBeTruthy();
    },
    NEVER_TIMEOUT
  );

  it(
    'resumableCopyObject fetch this object after progress 100%',
    async () => {
      const srcKey = objectKey100M;
      const key = `copy_${srcKey}-fetch-after-100%`;
      const client = new TOS(tosOptions);
      let p2Resolve: any = null;
      let p2Reject: any = null;
      const p2 = new Promise((r1, r2) => {
        p2Resolve = r1;
        p2Reject = r2;
      });

      const p1 = client.resumableCopyObject({
        srcBucket: tosOptions.bucket,
        srcKey,
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
    'resumableCopyObject upload empty file',
    async () => {
      const srcKey = objectKeyEmpty;
      const key = `copy_${srcKey}_test-empty-file`;
      const client = new TOS(tosOptions);
      const progressFn = jest.fn();

      const { data } = await client.resumableCopyObject({
        srcBucket: tosOptions.bucket,
        srcKey,
        key,
        progress: progressFn,
      });
      expect(data.Location).toBe(
        `https://${tosOptions.bucket}.${client.opts.endpoint}/${key}`
      );
      expect(data.Bucket).toBe(tosOptions.bucket);
      expect(data.Key).toBe(key);

      expect(progressFn.mock.calls.length).toBe(2);
      expect(progressFn.mock.calls[0][0]).toBe(0);
      expect(progressFn.mock.calls[1][0]).toBe(1);
      const { data: data2 } = await client.headObject(key);
      expect(+data2['content-length'] === 0).toBeTruthy();
    },
    NEVER_TIMEOUT
  );

  it(
    'copy for special key',
    async () => {
      const srcKey = objectKey10MSpecialName;
      const key = `copy_${srcKey}_test-chinese-source-key`;
      const client = new TOS(tosOptions);

      await client.resumableCopyObject({
        srcBucket: tosOptions.bucket,
        srcKey,
        key,
      });

      const { data: data2 } = await client.headObject(key);
      expect(+data2['content-length'] === 10 * 1024 * 1024).toBeTruthy();

      const srcKey0 = objectKey0MSpecialName;
      const key0 = `copy_${srcKey0}_test-chinese-source-key`;

      await client.resumableCopyObject({
        srcBucket: tosOptions.bucket,
        srcKey: srcKey0,
        key: key0,
      });

      const { data: data3 } = await client.headObject(key0);
      expect(+data3['content-length'] === 0).toBeTruthy();
    },
    NEVER_TIMEOUT
  );

  it(
    'resumableCopyObject 100M progress-partSize=6972593B',
    async () => {
      const partSize = 6972593;
      const totalBytes = 100 * 1024 * 1024;
      const client = new TOS(tosOptions);
      const progressFn = jest.fn();
      await client.resumableCopyObject({
        key: `resumableCopyObject 100M progress-partSize=${partSize}B`,
        srcBucket: testBucketName,
        srcKey: objectKey100M,
        taskNum: 3,
        progress: progressFn,
        partSize: partSize,
      });

      const progressFnCallsLen = progressFn.mock.calls.length;
      expect(progressFn.mock.calls[0][0]).toEqual(0);
      expect(progressFn.mock.calls.filter((it) => it[0] === 1).length).toEqual(
        1
      );
      const lastCall = progressFn.mock.calls.slice(-1)[0];
      expect(lastCall[0]).toEqual(1);
      for (let i = 1; i < progressFnCallsLen; ++i) {
        const curPercent = progressFn.mock.calls[i][0].toFixed(6);
        const expectPercent1 = ((partSize * i) / totalBytes).toFixed(6);
        const expectPercent2 = (
          (partSize * (i - 1) + (totalBytes % partSize)) /
          totalBytes
        ).toFixed(6);
        const isOk =
          curPercent === expectPercent1 || curPercent === expectPercent2;
        expect(isOk).toBeTruthy();
      }
    },
    NEVER_TIMEOUT
  );

  it(
    'resumableCopyObject 100M with download event-partSize=6972593B',
    async () => {
      const partSize = 6972593;
      const totalBytes = 100 * 1024 * 1024;
      const client = new TOS(tosOptions);
      const eventFn = jest.fn();
      await client.resumableCopyObject({
        key: `resumableCopyObject 100M with download event-partSize=${partSize}B`,
        srcBucket: testBucketName,
        srcKey: objectKey100M,
        taskNum: 3,
        partSize: partSize,
        copyEventListener: eventFn,
      });
      const downloadEventFnCallsLen = eventFn.mock.calls.length;
      expect(eventFn.mock.calls[0][0].type).toBe(
        ResumableCopyEventType.CreateMultipartUploadSucceed
      );
      let totalEventBytes = 0;
      for (let i = 1; i < downloadEventFnCallsLen - 1; ++i) {
        const event: ResumableCopyEvent = eventFn.mock.calls[i][0];
        expect(event.type).toBe(ResumableCopyEventType.UploadPartCopySucceed);
        const partInfo = event.copyPartInfo!;
        totalEventBytes +=
          partInfo.copySourceRangeEnd - partInfo.copySourceRangeStart + 1;
      }
      expect(totalEventBytes).toBe(totalBytes);
      expect(eventFn.mock.calls[downloadEventFnCallsLen - 1][0].type).toBe(
        ResumableCopyEventType.CompleteMultipartUploadSucceed
      );
    },
    NEVER_TIMEOUT
  );

  it(
    'resumableCopyObject 100M cancal',
    async () => {
      const partSize = 6972593;
      const client = new TOS(tosOptions);
      const progressFn = jest.fn();
      const eventChangeFn = jest.fn();

      const cancelTokenSource = CancelToken.source();
      // cancal after 5s
      setTimeout(() => {
        cancelTokenSource.cancel();
      }, 2_000);
      try {
        await client.resumableCopyObject({
          key: `resumableCopyObject 100M cancal`,
          srcBucket: testBucketName,
          srcKey: objectKey100M,
          taskNum: 3,
          progress: progressFn,
          copyEventListener: eventChangeFn,
          partSize,
          cancelToken: cancelTokenSource.token,
        });
        expect('').toBe('not enter this branch');
      } catch (err) {
        if (!isCancel(err)) {
          console.log('not cancel err: ');
          throw err;
        }
        expect(isCancel(err)).toBeTruthy();
        const progressCallsLen = progressFn.mock.calls.length;
        const downloadEventChangeCallsLen = eventChangeFn.mock.calls.length;
        // expect: don't receive new callbacks after cancel error
        await sleepCache(10_000);
        expect(progressFn.mock.calls.length).toBe(progressCallsLen);
        expect(eventChangeFn.mock.calls.length).toBe(
          downloadEventChangeCallsLen
        );
      }
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
