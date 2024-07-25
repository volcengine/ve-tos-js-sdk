import TOSBase, { TosResponse } from '../../base';
import {
  createMultipartUpload,
  CreateMultipartUploadInput,
} from './createMultipartUpload';

import { calculateSafePartSize } from './listParts';
import { Stats } from 'fs';
import { UploadPartOutput, _uploadPart } from './uploadPart';
import TosServerError from '../../../TosServerError';
import {
  completeMultipartUpload,
  CompleteMultipartUploadOutput,
} from './completeMultipartUpload';
import { CancelToken } from 'axios';
import * as fsp from '../../../nodejs/fs-promises';
import path from 'path';
import TosClientError from '../../../TosClientError';
import { DataTransferStatus, DataTransferType } from '../../../interface';
import {
  safeAwait,
  isBlob,
  isBuffer,
  isCancelError,
  DEFAULT_PART_SIZE,
  normalizeHeadersKey,
  fillRequestHeaders,
} from '../../../utils';
import { EmptyReadStream } from '../../../nodejs/EmptyReadStream';
import { CancelError } from '../../../CancelError';
import { hashMd5 } from '../../../universal/crypto';
import { IRateLimiter } from '../../../rate-limiter';
import { validateCheckpoint } from '../utils';
import { combineCrc64 } from '../../../universal/crc';

export interface UploadFileInput extends CreateMultipartUploadInput {
  /**
   * if the type of `file` is string,
   * `file` represents the file path that will be uploaded
   */
  file: string | File | Blob | Buffer;

  /**
   * default is 20 MB
   *
   * unit: B
   */
  partSize?: number;

  /**
   * the number of request to parallel upload part，default value is 1
   */
  taskNum?: number;

  // TODO: default file name is not aligned.
  /**
   * if checkpoint is a string and point to a exist file,
   * the checkpoint record will recover from this file.
   *
   * if checkpoint is a string and point to a directory,
   * the checkpoint will be auto generated,
   * and its name is `{bucketName}_{objectName}.{uploadId}`.
   */
  checkpoint?: string | CheckpointRecord;

  dataTransferStatusChange?: (status: DataTransferStatus) => void;

  /**
   * the feature of pause and continue uploading
   */
  uploadEventChange?: (event: UploadEvent) => void;

  /**
   * the simple progress feature
   * percent is [0, 1]
   */
  progress?: (percent: number, checkpoint: CheckpointRecord) => void;

  /**
   * cancel this upload progress
   */
  cancelToken?: CancelToken;

  /**
   * enable md5 checksum to uploadPart method
   *
   * default: false
   */
  enableContentMD5?: boolean;

  /**
   * unit: bit/s
   * server side traffic limit
   **/
  trafficLimit?: number;

  /**
   * only works for nodejs environment
   */
  rateLimiter?: IRateLimiter;
}

export interface UploadFileOutput extends CompleteMultipartUploadOutput {}

export enum UploadEventType {
  CreateMultipartUploadSucceed = 1,
  CreateMultipartUploadFailed = 2,
  UploadPartSucceed = 3,
  UploadPartFailed = 4,
  UploadPartAborted = 5,
  CompleteMultipartUploadSucceed = 6,
  CompleteMultipartUploadFailed = 7,
}

export interface UploadPartInfo {
  partNumber: number;
  partSize: number;
  offset: number;

  // has value when upload part succeed
  etag?: string;

  // not support
  // hashCrc64ecma?: number;
}

export interface UploadEvent {
  type: UploadEventType;

  /**
   * has value when event is failed or aborted
   */
  err?: Error;

  bucket: string;
  key: string;
  uploadId: string;
  checkpointFile?: string;
  uploadPartInfo?: UploadPartInfo;
}

export interface CheckpointRecord {
  bucket: string;
  key: string;
  part_size: number;
  upload_id: string;
  parts_info?: CheckpointRecordPart[];
  // Information about the file to be uploaded
  file_info?: {
    last_modified: number;
    file_size: number;
  };

  // TODO: Not support the fields below
  // ssec_algorithm?: string;
  // ssec_key_md5?: string;
  // encoding_type?: string;
}

interface CheckpointRecordPart {
  part_number: number;
  part_size: number;
  offset: number;
  etag: string;
  hash_crc64ecma: string;
  is_completed: boolean;
}

interface CheckpointRichInfo {
  filePath?: string | undefined;

  filePathIsPlaceholder?: boolean;

  record?: CheckpointRecord;
}

interface Task {
  partSize: number;
  offset: number;
  partNumber: number;
}

const CHECKPOINT_FILE_NAME_PLACEHOLDER = '@@checkpoint-file-placeholder@@';
const FILE_PARAM_CHECK_MSG = '`file` must be string, Buffer, File or Blob';
const ABORT_ERROR_STATUS_CODE = [403, 404, 405];

export async function uploadFile(
  this: TOSBase,
  input: UploadFileInput
): Promise<TosResponse<UploadFileOutput>> {
  const { cancelToken, enableContentMD5 = false } = input;
  const headers = normalizeHeadersKey(input.headers);
  input.headers = headers;
  fillRequestHeaders(input, [
    'encodingType',
    'cacheControl',
    'contentDisposition',
    'contentEncoding',
    'contentLanguage',
    'contentType',
    'expires',

    'acl',
    'grantFullControl',
    'grantRead',
    'grantReadAcp',
    'grantWriteAcp',

    'ssecAlgorithm',
    'ssecKey',
    'ssecKeyMD5',
    'serverSideEncryption',

    'meta',
    'websiteRedirectLocation',
    'storageClass',
  ]);

  const isCancel = () => cancelToken && !!cancelToken.reason;
  validateCheckpoint(input.checkpoint);

  const fileStats: Stats | null = await (async () => {
    if (
      process.env.TARGET_ENVIRONMENT === 'node' &&
      typeof input.file === 'string'
    ) {
      return fsp.stat(input.file);
    }
    return null;
  })();

  const fileSize = await (async () => {
    const { file } = input;
    if (fileStats) {
      return fileStats.size;
    }
    if (isBuffer(file)) {
      return file.length;
    }
    if (isBlob(file)) {
      return file.size;
    }
    throw new TosClientError(FILE_PARAM_CHECK_MSG);
  })();

  const checkpointRichInfo = await (async (): Promise<CheckpointRichInfo> => {
    if (process.env.TARGET_ENVIRONMENT === 'node') {
      if (typeof input.checkpoint === 'string') {
        const { checkpoint } = input;
        // file doesn't exist when stat is null
        let checkpointStat: Stats | null = null;
        try {
          checkpointStat = await fsp.stat(checkpoint);
        } catch (_err) {
          // TODO: remove any
          const err = _err as any;
          if (err.code === 'ENOENT') {
            // file doesn't exist
          } else {
            throw err;
          }
        }

        const isDirectory = (() => {
          if (checkpointStat) {
            return checkpointStat.isDirectory();
          }
          return checkpoint.endsWith('/');
        })();

        // TODO: this is not a right decision
        // filePath will generated by uploadId, use placeholder temporarily
        const filePath = isDirectory
          ? path.resolve(checkpoint, CHECKPOINT_FILE_NAME_PLACEHOLDER)
          : // ensure relative path require
            path.resolve(checkpoint);
        const dirPath = path.dirname(filePath);
        // ensure directory exist
        await fsp.mkdir(dirPath, { recursive: true });

        if (isDirectory) {
          return {
            filePath,
            filePathIsPlaceholder: true,
          };
        }

        try {
          const record = checkpointStat
            ? JSON.parse(await fsp.readFile(filePath, 'utf-8'))
            : undefined;
          return {
            filePath,
            filePathIsPlaceholder: false,
            // filePath is json file
            // TODO: validate json schema
            record,
          };
        } catch (error) {
          console.warn(
            'the checkpoint file is invalid JSON format. please check checkpoint file'
          );
          throw error;
        }
      }
    }

    if (typeof input.checkpoint === 'object') {
      return {
        record: input.checkpoint,
      };
    }

    return {};
  })();

  // check if file info is matched
  await (async () => {
    if (fileStats && checkpointRichInfo.record?.file_info) {
      const { last_modified, file_size } = checkpointRichInfo.record?.file_info;
      if (fileStats.mtimeMs !== last_modified || fileStats.size !== file_size) {
        console.warn(
          `The file has been modified since ${new Date(
            last_modified
          )}, so the checkpoint file is invalid, and specified file will be uploaded again.`
        );
        delete checkpointRichInfo.record;
      }
    }
  })();

  const partSize = calculateSafePartSize(
    fileSize,
    input.partSize || checkpointRichInfo.record?.part_size || DEFAULT_PART_SIZE,
    true
  );

  // check partSize is matched
  if (
    checkpointRichInfo.record &&
    checkpointRichInfo.record.part_size !== partSize
  ) {
    console.warn(
      'The partSize param does not equal the partSize in checkpoint file, ' +
        'so the checkpoint file is invalid, and specified file will be uploaded again.'
    );
    delete checkpointRichInfo.record;
  }

  let bucket = input.bucket || this.opts.bucket || '';
  const key = input.key;
  let uploadId = '';
  let tasks: Task[] = [];
  const allTasks: Task[] = getAllTasks(fileSize, partSize);
  const initConsumedBytes = (checkpointRichInfo.record?.parts_info || [])
    .filter((it) => it.is_completed)
    .reduce((prev, it) => prev + it.part_size, 0);
  let consumedBytesForProgress = initConsumedBytes;

  // recorded tasks
  const recordedTasks = checkpointRichInfo.record?.parts_info || [];
  const recordedTaskMap: Map<number, CheckpointRecordPart> = new Map();
  recordedTasks.forEach((it) => recordedTaskMap.set(it.part_number, it));

  const getCheckpointContent = () => {
    const checkpointContent: CheckpointRecord = {
      bucket,
      key,
      part_size: partSize,
      upload_id: uploadId,
      parts_info: recordedTasks,
    };
    if (fileStats) {
      checkpointContent.file_info = {
        last_modified: fileStats.mtimeMs,
        file_size: fileStats.size,
      };
    }
    return checkpointContent;
  };
  const triggerUploadEvent = (
    e: Omit<UploadEvent, 'bucket' | 'uploadId' | 'key' | 'checkpointFile'>
  ) => {
    if (!input.uploadEventChange) {
      return;
    }

    const event: UploadEvent = {
      bucket,
      uploadId,
      key,
      ...e,
    };
    if (checkpointRichInfo.filePath) {
      event.checkpointFile = checkpointRichInfo.filePath;
    }

    input.uploadEventChange(event);
  };
  enum TriggerProgressEventType {
    start = 1,
    uploadPartSucceed = 2,
    completeMultipartUploadSucceed = 3,
  }
  const triggerProgressEvent = (type: TriggerProgressEventType) => {
    if (!input.progress) {
      return;
    }

    const percent = (() => {
      if (type === TriggerProgressEventType.start && fileSize === 0) {
        return 0;
      }
      return !fileSize ? 1 : consumedBytesForProgress / fileSize;
    })();

    if (
      consumedBytesForProgress === fileSize &&
      type === TriggerProgressEventType.uploadPartSucceed
    ) {
      // 100% 仅在 complete 后处理，以便 100% 可以拉取到新对象
    } else {
      input.progress(percent, getCheckpointContent());
    }
  };
  let consumedBytes = initConsumedBytes;
  const { dataTransferStatusChange } = input;
  const triggerDataTransfer = (
    type: DataTransferType,
    rwOnceBytes: number = 0
  ) => {
    if (!dataTransferStatusChange) {
      return;
    }
    consumedBytes += rwOnceBytes;

    dataTransferStatusChange?.({
      type,
      rwOnceBytes,
      consumedBytes,
      totalBytes: fileSize,
    });
  };
  const writeCheckpointFile = async () => {
    if (
      process.env.TARGET_ENVIRONMENT === 'node' &&
      checkpointRichInfo.filePath
    ) {
      const content = JSON.stringify(getCheckpointContent(), null, 2);
      const dirPath = path.dirname(checkpointRichInfo.filePath); // ensure directory exist
      await fsp.mkdir(dirPath, {
        recursive: true,
      });
      await fsp.writeFile(checkpointRichInfo.filePath, content, 'utf-8');
    }
  };
  const rmCheckpointFile = async () => {
    if (
      process.env.TARGET_ENVIRONMENT === 'node' &&
      checkpointRichInfo.filePath
    ) {
      await fsp.rm(checkpointRichInfo.filePath).catch((err: any) => {
        // eat err
        console.warn(
          'remove checkpoint file failure, you can remove it by hand.\n',
          `checkpoint file path: ${checkpointRichInfo.filePath}\n`,
          err.message
        );
      });
    }
  };

  /**
   *
   * @param task one part task
   * @param uploadPartRes upload part failed if `uploadPartRes` is Error
   */
  const updateAfterUploadPart = async (
    task: Task,
    uploadPartRes:
      | {
          res: UploadPartOutput;
          err?: null;
        }
      | {
          err: Error;
        }
  ) => {
    let existRecordTask = recordedTaskMap.get(task.partNumber);
    if (!existRecordTask) {
      existRecordTask = {
        part_number: task.partNumber,
        offset: task.offset,
        part_size: task.partSize,
        is_completed: false,
        etag: '',
        hash_crc64ecma: '',
      };
      recordedTasks.push(existRecordTask);
      recordedTaskMap.set(existRecordTask.part_number, existRecordTask);
    }

    if (!uploadPartRes.err) {
      existRecordTask.is_completed = true;
      existRecordTask.etag = uploadPartRes.res.ETag;
      existRecordTask.hash_crc64ecma = uploadPartRes.res.hashCrc64ecma;
    }

    await writeCheckpointFile();
    const uploadPartInfo: UploadPartInfo = {
      partNumber: existRecordTask.part_number,
      partSize: existRecordTask.part_size,
      offset: existRecordTask.offset,
    };

    if (uploadPartRes.err) {
      const err = uploadPartRes.err;
      let type: UploadEventType = UploadEventType.UploadPartFailed;

      if (err instanceof TosServerError) {
        if (ABORT_ERROR_STATUS_CODE.includes(err.statusCode)) {
          type = UploadEventType.UploadPartAborted;
        }
      }

      triggerUploadEvent({
        type,
        err,
        uploadPartInfo,
      });
      return;
    }

    uploadPartInfo.etag = uploadPartRes.res.ETag;
    consumedBytesForProgress += uploadPartInfo.partSize;

    triggerUploadEvent({
      type: UploadEventType.UploadPartSucceed,
      uploadPartInfo,
    });
    triggerProgressEvent(TriggerProgressEventType.uploadPartSucceed);
  };

  if (checkpointRichInfo.record) {
    bucket = checkpointRichInfo.record.bucket;
    uploadId = checkpointRichInfo.record.upload_id;

    // checkpoint info exists, so need to calculate remain tasks
    const uploadedPartSet: Set<number> = new Set(
      (checkpointRichInfo.record.parts_info || [])
        .filter((it) => it.is_completed)
        .map((it) => it.part_number)
    );
    tasks = allTasks.filter((it) => !uploadedPartSet.has(it.partNumber));
  } else {
    // createMultipartUpload will check bucket
    try {
      const { data: multipartRes } = await createMultipartUpload.call(
        this,
        input
      );
      if (isCancel()) {
        throw new CancelError('cancel uploadFile');
      }

      bucket = multipartRes.Bucket;
      uploadId = multipartRes.UploadId;
      if (checkpointRichInfo.filePathIsPlaceholder) {
        checkpointRichInfo.filePath = checkpointRichInfo.filePath?.replace(
          `${CHECKPOINT_FILE_NAME_PLACEHOLDER}`,
          getDefaultCheckpointFilePath(bucket, key)
        );
      }

      triggerUploadEvent({
        type: UploadEventType.CreateMultipartUploadSucceed,
      });
    } catch (_err) {
      const err = _err as Error;
      triggerUploadEvent({
        type: UploadEventType.CreateMultipartUploadFailed,
        err,
      });
      throw err;
    }

    tasks = allTasks;
  }

  triggerProgressEvent(TriggerProgressEventType.start);
  const handleTasks = async () => {
    let firstErr: Error | null = null;
    let index = 0;

    // TODO: how to test parallel does work, measure time is not right
    await Promise.all(
      Array.from({ length: input.taskNum || 1 }).map(async () => {
        while (true) {
          const currentIndex = index++;
          if (currentIndex >= tasks.length) {
            return;
          }

          const curTask = tasks[currentIndex];
          let consumedBytesThisTask = 0;
          try {
            const { data: uploadPartRes } = await _uploadPart.call(this, {
              bucket,
              key,
              uploadId,
              body: getBody(input.file, curTask),
              enableContentMD5,
              makeRetryStream: getMakeRetryStream(input.file, curTask),
              beforeRetry: () => {
                consumedBytes -= consumedBytesThisTask;
                consumedBytesThisTask = 0;
              },
              partNumber: curTask.partNumber,
              headers: {
                ['content-length']: `${curTask.partSize}`,
                ['x-tos-server-side-encryption-customer-algorithm']:
                  headers['x-tos-server-side-encryption-customer-algorithm'],
                ['x-tos-server-side-encryption-customer-key']:
                  headers['x-tos-server-side-encryption-customer-key'],
                ['x-tos-server-side-encryption-customer-key-md5']:
                  headers['x-tos-server-side-encryption-customer-key-md5'],
              },
              dataTransferStatusChange(status) {
                if (status.type !== DataTransferType.Rw) {
                  return;
                }
                if (isCancel()) {
                  return;
                }
                consumedBytesThisTask += status.rwOnceBytes;
                triggerDataTransfer(status.type, status.rwOnceBytes);
              },
              trafficLimit: input.trafficLimit,
              rateLimiter: input.rateLimiter,
            });

            if (isCancel()) {
              throw new CancelError('cancel uploadFile');
            }

            await updateAfterUploadPart(curTask, { res: uploadPartRes });
          } catch (_err) {
            const err = _err as any;
            consumedBytes -= consumedBytesThisTask;
            consumedBytesThisTask = 0;

            if (isCancelError(err)) {
              throw err;
            }

            if (isCancel()) {
              throw new CancelError('cancel uploadFile');
            }

            if (!firstErr) {
              firstErr = err;
            }
            await updateAfterUploadPart(curTask, { err });
          }
        }
      })
    );

    if (firstErr) {
      throw firstErr;
    }

    const parts = (getCheckpointContent().parts_info || []).map((it) => ({
      eTag: it.etag,
      partNumber: it.part_number,
    }));

    const [err, res] = await safeAwait(
      completeMultipartUpload.call(this, {
        bucket,
        key,
        uploadId,
        parts,
      })
    );

    if (err || !res) {
      triggerUploadEvent({
        type: UploadEventType.CompleteMultipartUploadFailed,
      });
      throw err;
    }

    triggerUploadEvent({
      type: UploadEventType.CompleteMultipartUploadSucceed,
    });
    triggerProgressEvent(
      TriggerProgressEventType.completeMultipartUploadSucceed
    );
    await rmCheckpointFile();

    if (
      this.opts.enableCRC &&
      res.data.HashCrc64ecma &&
      combineCRCInParts(getCheckpointContent()) !== res.data.HashCrc64ecma
    ) {
      throw new TosClientError('crc of entire file mismatch.');
    }

    return res;
  };

  triggerDataTransfer(DataTransferType.Started);
  const [err, res] = await safeAwait(handleTasks());
  if (err || !res) {
    triggerDataTransfer(DataTransferType.Failed);
    throw err;
  }
  triggerDataTransfer(DataTransferType.Succeed);
  return res;
}

export default uploadFile;

/**
 * 即使 totalSize 是 0，也需要一个 Part，否则 Server 端会报错 read request body failed
 */
function getAllTasks(totalSize: number, partSize: number) {
  const tasks: Task[] = [];
  for (let i = 0; ; ++i) {
    const offset = i * partSize;
    const currPartSize = Math.min(partSize, totalSize - offset);

    tasks.push({
      offset,
      partSize: currPartSize,
      partNumber: i + 1,
    });

    if ((i + 1) * partSize >= totalSize) {
      break;
    }
  }

  return tasks;
}

function getBody(file: UploadFileInput['file'], task: Task) {
  const { offset: start, partSize } = task;
  const end = start + partSize;

  const makeRetryStream = getMakeRetryStream(file, task);
  if (makeRetryStream) {
    return makeRetryStream();
  }

  if (isBlob(file)) {
    return file.slice(start, end);
  }
  if (isBuffer(file)) {
    return file.slice(start, end);
  }
  throw new TosClientError(FILE_PARAM_CHECK_MSG);
}

function getMakeRetryStream(file: UploadFileInput['file'], task: Task) {
  const { offset: start, partSize } = task;
  const end = start + partSize;

  if (process.env.TARGET_ENVIRONMENT === 'node' && typeof file === 'string') {
    return () => {
      if (!partSize) {
        return new EmptyReadStream();
      }
      return fsp.createReadStream(file, {
        start,
        end: end - 1,
      });
    };
  }

  return undefined;
}

function getDefaultCheckpointFilePath(bucket: string, key: string) {
  const originPath = `${key}.${hashMd5(`${bucket}.${key}`, 'hex')}.upload`;
  const normalizePath = originPath.replace(/[\\/]/g, '');
  return normalizePath;
}

function combineCRCInParts(cp: CheckpointRecord) {
  const size = cp.file_info?.file_size || 0;
  let res = '0';
  for (const part of cp.parts_info || []) {
    res = combineCrc64(
      res,
      part.hash_crc64ecma,
      Math.min(part.part_size, size - part.offset)
    );
  }
  return res;
}
