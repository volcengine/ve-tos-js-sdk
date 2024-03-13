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
import { safeAwait } from '../../../utils';
import { CancelError } from '../../../CancelError';
import headObject from '../headObject';
import { uploadPartCopy, UploadPartCopyOutput } from './uploadPartCopy';
import { Headers } from '../../../interface';
import copyObject from '../copyObject';
import { getCopySourceHeaderValue, validateCheckpoint } from '../utils';
import cloneDeep from 'lodash/cloneDeep';

export interface ResumableCopyObjectInput extends CreateMultipartUploadInput {
  srcBucket: string;
  srcKey: string;
  srcVersionId?: string;

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
   * and its name is
   * `{srcBucketName}.{srcObjectName}.{srcVersionId}.{bucketName}.{objectName}.copy`.
   */
  checkpoint?: string | ResumableCopyCheckpointRecord;

  /**
   * the callback of copy event
   */
  copyEventListener?: (event: ResumableCopyEvent) => void;

  /**
   * the simple progress feature
   * percent is [0, 1]
   */
  progress?: (
    percent: number,
    checkpoint: ResumableCopyCheckpointRecord
  ) => void;

  /**
   * is axios CancelToken
   */
  cancelToken?: CancelToken;

  /**
   * unit: bit/s
   * server side traffic limit
   **/
  trafficLimit?: number;
}

export interface UploadFileOutput extends CompleteMultipartUploadOutput {}

export enum ResumableCopyEventType {
  CreateMultipartUploadSucceed = 1,
  CreateMultipartUploadFailed = 2,
  UploadPartCopySucceed = 3,
  UploadPartCopyFailed = 4,
  UploadPartCopyAborted = 5,
  CompleteMultipartUploadSucceed = 6,
  CompleteMultipartUploadFailed = 7,
}

export interface CopyPartInfo {
  partNumber: number;
  copySourceRangeStart: number;
  copySourceRangeEnd: number;

  // has value when upload part succeed
  etag?: string;
}

export interface ResumableCopyEvent {
  type: ResumableCopyEventType;

  /**
   * has value when event is failed or aborted
   */
  err?: Error;

  bucket: string;
  key: string;
  uploadId?: string;
  checkpointFile?: string;
  copyPartInfo?: CopyPartInfo;
}

export interface ResumableCopyCheckpointRecord {
  bucket: string;
  key: string;
  part_size: number;
  upload_id: string;
  parts_info?: ResumableCopyCheckpointRecordPart[];
  // Information about the file to be uploaded
  copy_source_object_info: {
    etag: string;
    hash_crc64ecma: string;
    last_modified: string;
    object_size: number;
  };
  // TODO: more information
}

interface ResumableCopyCheckpointRecordPart {
  part_number: number;
  copy_source_range_start: number;
  copy_source_range_end: number;
  etag: string;
  is_completed: boolean;
}

interface CheckpointRichInfo {
  filePath?: string | undefined;

  filePathIsPlaceholder?: boolean;

  record?: ResumableCopyCheckpointRecord;
}

interface Task {
  partSize: number;
  offset: number;
  partNumber: number;
}

const CHECKPOINT_FILE_NAME_PLACEHOLDER = '@@checkpoint-file-placeholder@@';
const ABORT_ERROR_STATUS_CODE = [403, 404, 405];
export const DEFAULT_PART_SIZE = 20 * 1024 * 1024; // 20 MB

export async function resumableCopyObject(
  this: TOSBase,
  input: ResumableCopyObjectInput
): Promise<TosResponse<UploadFileOutput>> {
  const { cancelToken } = input;
  const isCancel = () => cancelToken && !!cancelToken.reason;
  validateCheckpoint(input.checkpoint);

  const { data: objectStats } = await headObject.call(this, {
    bucket: input.srcBucket,
    key: input.srcKey,
    versionId: input.srcVersionId,
  });
  const etag = objectStats['etag'];
  const objectSize = +objectStats['content-length'];

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

        // filePath will generated by uploadId, use placeholder temporarily
        const filePath = isDirectory
          ? path.resolve(checkpoint, CHECKPOINT_FILE_NAME_PLACEHOLDER)
          : path.resolve(checkpoint);
        const dirPath = path.dirname(filePath);
        // ensure directory exist
        await fsp.mkdir(dirPath, { recursive: true });

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
          record: checkpointStat
            ? JSON.parse(await fsp.readFile(filePath, 'utf-8'))
            : undefined,
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
    if (checkpointRichInfo.record?.copy_source_object_info) {
      const { last_modified, object_size } =
        checkpointRichInfo.record?.copy_source_object_info;
      if (
        // TODO: `last-modified` aligns to number
        objectStats['last-modified'] !== last_modified ||
        +objectStats['content-length'] !== object_size
      ) {
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
    objectSize,
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
  const allTasks: Task[] = getAllTasks(objectSize, partSize);
  const initConsumedBytes = (checkpointRichInfo.record?.parts_info || [])
    .filter((it) => it.is_completed)
    .reduce(
      (prev, it) =>
        prev + it.copy_source_range_end - it.copy_source_range_start + 1,
      0
    );
  let consumedBytesForProgress = initConsumedBytes;

  // recorded tasks
  const recordedTasks = checkpointRichInfo.record?.parts_info || [];
  const recordedTaskMap: Map<number, ResumableCopyCheckpointRecordPart> =
    new Map();
  recordedTasks.forEach((it) => recordedTaskMap.set(it.part_number, it));

  const getCheckpointContent = () => {
    const checkpointContent: ResumableCopyCheckpointRecord = {
      bucket,
      key,
      part_size: partSize,
      upload_id: uploadId,
      parts_info: recordedTasks,
      copy_source_object_info: {
        last_modified: objectStats['last-modified'],
        etag: objectStats.etag,
        hash_crc64ecma: objectStats['x-tos-hash-crc64ecma'] || '',
        object_size: +objectStats['content-length'],
      },
    };
    return checkpointContent;
  };
  const triggerUploadEvent = (
    e: Omit<
      ResumableCopyEvent,
      'bucket' | 'uploadId' | 'key' | 'checkpointFile'
    >
  ) => {
    if (!input.copyEventListener) {
      return;
    }

    const event: ResumableCopyEvent = {
      bucket,
      uploadId,
      key,
      ...e,
    };
    if (checkpointRichInfo.filePath) {
      event.checkpointFile = checkpointRichInfo.filePath;
    }

    input.copyEventListener(event);
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
      if (type === TriggerProgressEventType.start && objectSize === 0) {
        return 0;
      }
      return !objectSize ? 1 : consumedBytesForProgress / objectSize;
    })();

    if (
      consumedBytesForProgress === objectSize &&
      type === TriggerProgressEventType.uploadPartSucceed
    ) {
      // 100% 仅在 complete 后处理，以便 100% 可以拉取到新对象
    } else {
      input.progress(percent, getCheckpointContent());
    }
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
          res: UploadPartCopyOutput;
          err?: null;
        }
      | {
          err: Error;
        }
  ) => {
    let existRecordTask = recordedTaskMap.get(task.partNumber);
    const rangeStart = task.offset;
    const rangeEnd = Math.min(task.offset + partSize - 1, objectSize - 1);
    if (!existRecordTask) {
      existRecordTask = {
        part_number: task.partNumber,
        copy_source_range_start: rangeStart,
        copy_source_range_end: rangeEnd,
        is_completed: false,
        etag: '',
      };
      recordedTasks.push(existRecordTask);
      recordedTaskMap.set(existRecordTask.part_number, existRecordTask);
    }

    if (!uploadPartRes.err) {
      existRecordTask.is_completed = true;
      existRecordTask.etag = uploadPartRes.res.ETag;
    }

    await writeCheckpointFile();
    const copyPartInfo: CopyPartInfo = {
      partNumber: existRecordTask.part_number,
      copySourceRangeEnd: existRecordTask.copy_source_range_end,
      copySourceRangeStart: existRecordTask.copy_source_range_start,
    };

    if (uploadPartRes.err) {
      const err = uploadPartRes.err;
      let type: ResumableCopyEventType =
        ResumableCopyEventType.UploadPartCopyFailed;

      if (err instanceof TosServerError) {
        if (ABORT_ERROR_STATUS_CODE.includes(err.statusCode)) {
          type = ResumableCopyEventType.UploadPartCopyAborted;
        }
      }

      triggerUploadEvent({
        type,
        err,
        copyPartInfo,
      });
      return;
    }

    copyPartInfo.etag = uploadPartRes.res.ETag;
    consumedBytesForProgress +=
      copyPartInfo.copySourceRangeEnd - copyPartInfo.copySourceRangeStart + 1;

    triggerUploadEvent({
      type: ResumableCopyEventType.UploadPartCopySucceed,
      copyPartInfo,
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
        cloneDeep(input)
      );
      if (isCancel()) {
        throw new CancelError('cancel uploadFile');
      }

      bucket = multipartRes.Bucket;
      uploadId = multipartRes.UploadId;
      if (checkpointRichInfo.filePathIsPlaceholder) {
        checkpointRichInfo.filePath = checkpointRichInfo.filePath?.replace(
          `${CHECKPOINT_FILE_NAME_PLACEHOLDER}`,
          getDefaultCheckpointFilePath({
            ...input,
            bucket,
          })
        );
      }

      triggerUploadEvent({
        type: ResumableCopyEventType.CreateMultipartUploadSucceed,
      });
    } catch (_err) {
      const err = _err as Error;
      triggerUploadEvent({
        type: ResumableCopyEventType.CreateMultipartUploadFailed,
        err,
      });
      throw err;
    }

    tasks = allTasks;
  }

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
          try {
            let copySource = getCopySourceHeaderValue(
              input.srcBucket,
              input.srcKey
            );
            if (input.srcVersionId) {
              copySource += `?versionId=${input.srcVersionId}`;
            }
            const copyRange = `bytes=${curTask.offset}-${
              curTask.offset + curTask.partSize - 1
            }`;
            const headers: Headers = {
              ...input.headers,
              ['x-tos-copy-source']: copySource,
              ['x-tos-copy-source-if-match']: etag,
              ['x-tos-copy-source-range']: copyRange,
            };

            if (!curTask.partSize) {
              delete headers['x-tos-copy-source-range'];
            }
            const { data: uploadPartRes } = await uploadPartCopy.call(this, {
              bucket,
              key,
              uploadId,
              partNumber: curTask.partNumber,
              headers,
              trafficLimit: input.trafficLimit,
            });

            if (isCancel()) {
              throw new CancelError('cancel resumableCopyObject');
            }

            await updateAfterUploadPart(curTask, { res: uploadPartRes });
          } catch (_err) {
            const err = _err as any;

            if (isCancelError(err)) {
              throw err;
            }

            if (isCancel()) {
              throw new CancelError('cancel resumableCopyObject');
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
        type: ResumableCopyEventType.CompleteMultipartUploadFailed,
      });
      throw err;
    }

    triggerUploadEvent({
      type: ResumableCopyEventType.CompleteMultipartUploadSucceed,
    });
    triggerProgressEvent(
      TriggerProgressEventType.completeMultipartUploadSucceed
    );
    await rmCheckpointFile();

    return res;
  };

  const handleEmptyObj = async (): Promise<TosResponse<UploadFileOutput>> => {
    let copySource = getCopySourceHeaderValue(input.srcBucket, input.srcKey);
    if (input.srcVersionId) {
      copySource += `?versionId=${input.srcVersionId}`;
    }
    const headers: Headers = {
      ...input.headers,
      ['x-tos-copy-source']: copySource,
      ['x-tos-copy-source-if-match']: etag,
    };

    const [err, res] = await safeAwait(
      copyObject.call(this, {
        bucket: input.bucket,
        key: input.key,
        headers,
        trafficLimit: input.trafficLimit,
      })
    );
    if (err || !res) {
      triggerUploadEvent({
        type: ResumableCopyEventType.UploadPartCopyFailed,
      });
      throw err;
    }

    triggerProgressEvent(
      TriggerProgressEventType.completeMultipartUploadSucceed
    );
    triggerUploadEvent({
      type: ResumableCopyEventType.UploadPartCopySucceed,
      copyPartInfo: {
        partNumber: 0,
        copySourceRangeStart: 0,
        copySourceRangeEnd: 0,
      },
    });
    triggerUploadEvent({
      type: ResumableCopyEventType.CompleteMultipartUploadSucceed,
    });

    return {
      ...res,
      data: {
        ETag: res.headers['etag'] || '',
        Bucket: bucket,
        Key: key,
        Location: `http${this.opts.secure ? 's' : ''}://${bucket}.${
          this.opts.endpoint
        }/${key}`,
        VersionID: res.headers['x-tos-version-id'],
        HashCrc64ecma: res.headers['x-tos-hash-crc64ecma'],
      },
    };
  };

  triggerProgressEvent(TriggerProgressEventType.start);
  return objectSize === 0 ? handleEmptyObj() : handleTasks();
}

export function isCancelError(err: any) {
  return err instanceof CancelError;
}

export default resumableCopyObject;

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

function getDefaultCheckpointFilePath(
  opts: Pick<
    ResumableCopyObjectInput,
    'srcBucket' | 'srcKey' | 'srcVersionId' | 'key'
  > & {
    bucket: string;
  }
) {
  const originPath = [
    opts.srcBucket,
    opts.srcKey,
    opts.srcVersionId,
    opts.bucket,
    opts.key,
    'copy',
  ]
    .filter(Boolean)
    .join('.');

  const normalizePath = originPath.replace(/[\\/]/g, '');
  return normalizePath;
}
