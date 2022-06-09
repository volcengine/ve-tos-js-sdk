import TOSBase from '../../base';
import {
  createMultipartUpload,
  CreateMultipartUploadInput,
} from './createMultipartUpload';

import { isBlob } from '../utils';
import { calculateSafePartSize } from './listParts';
import { Stats } from 'fs';
import { uploadPart, UploadPartOutput } from './uploadPart';
import ResponseError from '../../../responseError';
import { completeMultipartUpload } from './completeMultipartUpload';
import { CancelToken } from 'axios';
import * as fs from '../../../nodejs/fs-promises';
import path from 'path';

export interface UploadFileInput extends CreateMultipartUploadInput {
  /**
   * if the type of `file` is string,
   * `file` represents the file path that will be uploaded
   */
  file: string | File | Blob | Buffer;

  /**
   * default is 20 MB
   */
  partSize?: number;

  /**
   * the number of request to parallel upload part，default value is 1
   */
  taskNum?: number;

  /**
   * if checkpoint is a string and point to a exist file,
   * the checkpoint record will recover from this file.
   *
   * if checkpoint is a string and point to a directory,
   * the checkpoint will be auto generated,
   * and its name is `{bucketName}_{objectName}.{uploadId}`.
   */
  checkpoint?: string | CheckpointRecord;

  /**
   * the feature fo progress
   * not support
   */
  // dataTransferStatusChange?: (status: DataTransferStatus) => void;

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
   * is axios CancelToken
   */
  cancelToken?: CancelToken;
}

export interface DataTransferStatus {
  /**
   * has read or wrote bytes
   */
  consumedBytes: number;

  totalBytes: number;

  /**
   * transferred bytes in this transfer
   */
  rwOnceBytes: number;

  type: DataTransferType;
}

export enum DataTransferType {
  Started = 1, // data transfer start
  Rw = 2, // one transfer
  Succeed = 3, // data transfer succeed
  Failed = 4, // data transfer failed
}

export enum UploadEventType {
  createMultipartUploadSucceed = 1,
  createMultipartUploadFailed = 2,
  uploadPartSucceed = 3,
  uploadPartFailed = 4,
  uploadPartAborted = 5,
  completeMultipartUploadSucceed = 6,
  completeMultipartUploadFailed = 7,
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
  // not support
  // hash_crc64ecma: number;
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

export const DEFAULT_PART_SIZE = 20 * 1024 * 1024; // 20 MB

export class CancelError extends Error {
  constructor(message: string) {
    super(message);

    // https://www.dannyguo.com/blog/how-to-fix-instanceof-not-working-for-custom-errors-in-typescript/
    Object.setPrototypeOf(this, CancelError.prototype);
  }
}

export async function uploadFile(this: TOSBase, input: UploadFileInput) {
  const { cancelToken } = input;
  const isCancel = () => cancelToken && !!cancelToken.reason;

  const fileStats: Stats | null = await (async () => {
    if (
      process.env.TARGET_ENVIRONMENT === 'node' &&
      typeof input.file === 'string'
    ) {
      return fs.stat(input.file);
    }
    return null;
  })();

  const fileSize = await (async () => {
    const { file } = input;
    if (fileStats) {
      return fileStats.size;
    }
    if (Buffer.isBuffer(file)) {
      return file.length;
    }
    if (isBlob(file)) {
      return file.size;
    }
    throw Error(FILE_PARAM_CHECK_MSG);
  })();

  const checkpointRichInfo = await (async (): Promise<CheckpointRichInfo> => {
    if (process.env.TARGET_ENVIRONMENT === 'node') {
      if (typeof input.checkpoint === 'string') {
        const { checkpoint } = input;
        // file doesn't exist when stat is null
        let checkpointStat: Stats | null = null;
        try {
          checkpointStat = await fs.stat(checkpoint);
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

        // filePath will generated by uploadId, use placeholder temporarily
        const filePath = isDirectory
          ? path.resolve(checkpoint, CHECKPOINT_FILE_NAME_PLACEHOLDER)
          : checkpoint;
        const dirPath = path.dirname(filePath);
        // ensure directory exist
        await fs.mkdir(dirPath, { recursive: true });

        if (isDirectory) {
          return {
            filePath,
            filePathIsPlaceholder: true,
          };
        }

        return {
          filePath,
          filePathIsPlaceholder: false,
          // filePath is json file
          // TODO: validate json schema
          record: checkpointStat ? require(filePath) : undefined,
        };
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
  let consumedBytes = (checkpointRichInfo.record?.parts_info || [])
    .filter(it => it.is_completed)
    .reduce((prev, it) => prev + it.part_size, 0);

  // recorded tasks
  const recordedTasks = checkpointRichInfo.record?.parts_info || [];
  const recordedTaskMap: Map<number, CheckpointRecordPart> = new Map();
  recordedTasks.forEach(it => recordedTaskMap.set(it.part_number, it));

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
  const triggerProgressEvent = () => {
    if (!input.progress) {
      return;
    }
    input.progress(consumedBytes / fileSize, getCheckpointContent());
  };
  const writeCheckpointFile = async () => {
    if (
      process.env.TARGET_ENVIRONMENT === 'node' &&
      checkpointRichInfo.filePath
    ) {
      const content = JSON.stringify(getCheckpointContent(), null, 2);
      await fs.writeFile(checkpointRichInfo.filePath, content, 'utf-8');
    }
  };
  const rmCheckpointFile = async () => {
    if (
      process.env.TARGET_ENVIRONMENT === 'node' &&
      checkpointRichInfo.filePath
    ) {
      await fs.rm(checkpointRichInfo.filePath).catch((err: any) => {
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
    uploadPartRes: UploadPartOutput | Error
  ) => {
    let existRecordTask = recordedTaskMap.get(task.partNumber);
    if (!existRecordTask) {
      existRecordTask = {
        part_number: task.partNumber,
        offset: task.offset,
        part_size: task.partSize,
        is_completed: false,
        etag: '',
      };
      recordedTasks.push(existRecordTask);
      recordedTaskMap.set(existRecordTask.part_number, existRecordTask);
    }

    if (!(uploadPartRes instanceof Error)) {
      existRecordTask.is_completed = true;
      existRecordTask.etag = uploadPartRes.ETag;
    }

    await writeCheckpointFile();
    const uploadPartInfo: UploadPartInfo = {
      partNumber: existRecordTask.part_number,
      partSize: existRecordTask.part_size,
      offset: existRecordTask.offset,
    };

    if (uploadPartRes instanceof Error) {
      const err = uploadPartRes;
      let type: UploadEventType = UploadEventType.uploadPartFailed;

      if (err instanceof ResponseError) {
        if (ABORT_ERROR_STATUS_CODE.includes(err.statusCode)) {
          type = UploadEventType.uploadPartAborted;
        }
      }

      triggerUploadEvent({
        type,
        err,
        uploadPartInfo,
      });
      return;
    }

    uploadPartInfo.etag = uploadPartRes.ETag;
    consumedBytes += uploadPartInfo.partSize;

    triggerUploadEvent({
      type: UploadEventType.uploadPartSucceed,
      uploadPartInfo,
    });
    triggerProgressEvent();
  };

  if (checkpointRichInfo.record) {
    bucket = checkpointRichInfo.record.bucket;
    uploadId = checkpointRichInfo.record.upload_id;

    // checkpoint info exists, so need to calculate remain tasks
    const uploadedPartSet: Set<number> = new Set(
      (checkpointRichInfo.record.parts_info || [])
        .filter(it => it.is_completed)
        .map(it => it.part_number)
    );
    tasks = allTasks.filter(it => !uploadedPartSet.has(it.partNumber));
  } else {
    // createMultipartUpload will check bucket
    try {
      const { data: multipartRes } = await createMultipartUpload.call(
        this,
        input
      );
      // console.log('createMultipartUpload Res: ', multipartRes);
      if (isCancel()) {
        throw new CancelError('cancel uploadFile');
      }

      bucket = multipartRes.Bucket;
      uploadId = multipartRes.UploadId;
      if (checkpointRichInfo.filePathIsPlaceholder) {
        checkpointRichInfo.filePath = checkpointRichInfo.filePath?.replace(
          `${CHECKPOINT_FILE_NAME_PLACEHOLDER}`,
          getDefaultCheckpointFilePath(bucket, key, uploadId)
        );
      }

      triggerUploadEvent({
        type: UploadEventType.createMultipartUploadSucceed,
      });
      triggerProgressEvent();
    } catch (_err) {
      const err = _err as Error;
      triggerUploadEvent({
        type: UploadEventType.createMultipartUploadFailed,
        err,
      });
      throw err;
    }

    tasks = allTasks;
  }

  // handle tasks
  return (async () => {
    let firstErr: Error | null = null;
    let remainSuccessTaskCount = tasks.length;
    let index = 0;

    await Promise.all(
      new Array({ length: input.taskNum || 1 }).map(async () => {
        while (true) {
          const currentIndex = index++;
          if (currentIndex >= tasks.length) {
            return;
          }

          const curTask = tasks[currentIndex];
          try {
            // TODO(P0): backend is not stable, so I loop three time
            const LOOP = 10;
            const uploadPartRes = await (async () => {
              let lastErr = null;
              for (let i = 0; i < LOOP && !isCancel(); ++i) {
                try {
                  const { data: uploadPartRes } = await uploadPart.call(this, {
                    bucket,
                    key,
                    uploadId,
                    body: getBody(input.file, curTask),
                    partNumber: curTask.partNumber,
                  });
                  return uploadPartRes;
                } catch (_err) {
                  const err = _err as any;
                  if (process.env.NODE_ENV === 'development') {
                    console.log(
                      err.message,
                      `\npartNumber=${curTask.partNumber}, uploadId=${uploadId}`
                    );
                  }
                  lastErr = err;
                }
              }

              if (isCancel()) {
                throw new CancelError('cancel uploadFile');
              }

              throw lastErr;
            })();
            // console.log('uploadPart Res: ', uploadPartRes);

            if (isCancel()) {
              throw new CancelError('cancel uploadFile');
            }

            let shouldTriggerCompleteEvent = false;
            if (remainSuccessTaskCount === 1) {
              shouldTriggerCompleteEvent = true;
              // last task need call completeMultipart
              const parts = (getCheckpointContent().parts_info || []).map(
                it => ({
                  eTag: it.etag,
                  partNumber: it.part_number,
                })
              );
              parts.push({
                eTag: uploadPartRes.ETag,
                partNumber: curTask.partNumber,
              });

              await completeMultipartUpload.call(this, {
                bucket,
                key,
                uploadId,
                parts,
              });
              if (isCancel()) {
                throw new CancelError('cancel uploadFile');
              }
            }

            --remainSuccessTaskCount;
            await updateAfterUploadPart(curTask, uploadPartRes);
            if (shouldTriggerCompleteEvent) {
              await triggerUploadEvent({
                type: UploadEventType.completeMultipartUploadSucceed,
              });
              await rmCheckpointFile();
            }
          } catch (_err) {
            const err = _err as any;
            if (isCancelError(err)) {
              throw err;
            }

            if (!firstErr) {
              firstErr = err;
            }
            await updateAfterUploadPart(curTask, err);
          }
        }
      })
    );

    if (firstErr) {
      throw firstErr;
    }
  })();
}

export function isCancelError(err: any) {
  return err instanceof CancelError;
}

export default uploadFile;

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

function getDefaultCheckpointFilePath(
  bucket: string,
  key: string,
  uploadId: string
) {
  return `${bucket}_${key}.${uploadId}.json`;
}

function getBody(file: UploadFileInput['file'], task: Task) {
  const { offset: start, partSize } = task;
  const end = start + partSize;

  if (process.env.TARGET_ENVIRONMENT === 'node' && typeof file === 'string') {
    const fs = require('fs');
    return fs.createReadStream(file, {
      encoding: 'binary',
      start,
      end,
    }) as NodeJS.ReadableStream;
  }
  if (isBlob(file)) {
    return file.slice(start, end);
  }
  if (Buffer.isBuffer(file)) {
    return file.slice(start, end);
  }
  throw Error(FILE_PARAM_CHECK_MSG);
}
