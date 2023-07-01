import { getNewBodyConfig, getSize } from '../utils';
import TOSBase from '../../base';
import TosClientError from '../../../TosClientError';
import fs, { Stats } from 'fs';
import * as fsp from '../../../nodejs/fs-promises';
import { DataTransferStatus, DataTransferType } from '../../../interface';
import { Readable } from 'stream';
import { safeAwait } from '../../../utils';
import { retryNamespace } from '../../../axios';
import { hashMd5 } from '../../../universal/crypto';

export interface UploadPartInput {
  body: Blob | Buffer | NodeJS.ReadableStream;
  bucket?: string;
  key: string;
  partNumber: number;
  uploadId: string;
  dataTransferStatusChange?: (status: DataTransferStatus) => void;
  /**
   * the simple progress feature
   * percent is [0, 1].
   *
   * since uploadPart is stateless, so if `uploadPart` fail and you retry it,
   * `percent` will start from 0 again rather than from the previous value.
   */
  progress?: (percent: number) => void;
  headers?: {
    [key: string]: string | undefined;
    'content-length'?: string;
    'content-md5'?: string;
    'x-tos-server-side-encryption-customer-algorithm'?: string;
    'x-tos-server-side-encryption-customer-key'?: string;
    'x-tos-server-side-encryption-customer-key-MD5'?: string;
  };
}

export interface UploadPartInputInner extends UploadPartInput {
  makeRetryStream?: () => Readable;
  beforeRetry?: () => void;
  /**
   * default: false
   */
  enableContentMD5?: boolean;
}

export interface UploadPartOutput {
  ETag: string;
}

export async function _uploadPart(this: TOSBase, input: UploadPartInputInner) {
  const { uploadId, partNumber, body, enableContentMD5 = false } = input;
  const headers = input.headers || {};
  const size = getSize(body);
  if (size && headers['content-length'] == null) {
    headers['content-length'] = size.toFixed(0);
  }

  if (enableContentMD5 && headers['content-md5'] == null) {
    // current only support in nodejs
    if (
      process.env.TARGET_ENVIRONMENT === 'node' &&
      body instanceof Readable &&
      input.makeRetryStream
    ) {
      const newStream = input.makeRetryStream();
      let allContent = Buffer.from([]);
      for await (const chunk of newStream) {
        allContent = Buffer.concat([allContent, chunk]);
      }
      const md5 = hashMd5(allContent, 'base64');
      headers['content-md5'] = md5;
    } else {
      console.warn(`current not support enableMD5Checksum`);
    }
  }

  const totalSize = getSize(input.body, headers);
  const totalSizeValid = totalSize != null;
  if (!totalSizeValid && (input.dataTransferStatusChange || input.progress)) {
    console.warn(
      `Don't get totalSize of uploadPart's body, the \`dataTransferStatusChange\` callback will not trigger. You can use \`uploadPartFromFile\` instead`
    );
  }

  let consumedBytes = 0;
  const { dataTransferStatusChange, progress } = input;
  const triggerDataTransfer = (
    type: DataTransferType,
    rwOnceBytes: number = 0
  ) => {
    // request cancel will make rwOnceBytes < 0 in browser
    if (!totalSizeValid || rwOnceBytes < 0) {
      return;
    }
    if (!dataTransferStatusChange && !progress) {
      return;
    }
    consumedBytes += rwOnceBytes;

    dataTransferStatusChange?.({
      type,
      rwOnceBytes,
      consumedBytes,
      totalBytes: totalSize,
    });

    const progressValue = (() => {
      if (totalSize === 0) {
        if (type === DataTransferType.Succeed) {
          return 1;
        }
        return 0;
      }
      return consumedBytes / totalSize;
    })();
    if (progressValue === 1) {
      if (type === DataTransferType.Succeed) {
        progress?.(progressValue);
      } else {
        // not exec progress
      }
    } else {
      progress?.(progressValue);
    }
  };
  const bodyConfig = await getNewBodyConfig({
    body: input.body,
    totalSize,
    dataTransferCallback: (n) => triggerDataTransfer(DataTransferType.Rw, n),
    beforeRetry: input.beforeRetry,
    makeRetryStream: input.makeRetryStream,
    enableCRC: this.opts.enableCRC,
  });

  triggerDataTransfer(DataTransferType.Started);
  const [err, res] = await safeAwait(
    this.fetchObject<UploadPartOutput>(
      input,
      'PUT',
      { partNumber, uploadId },
      headers,
      bodyConfig.body,
      {
        crc: bodyConfig.crc,
        handleResponse: (res) => ({ ETag: res.headers.etag }),
        axiosOpts: {
          [retryNamespace]: {
            beforeRetry: () => {
              consumedBytes = 0;
              bodyConfig.beforeRetry?.();
            },
            makeRetryStream: bodyConfig.makeRetryStream,
          },
          onUploadProgress: (event) => {
            triggerDataTransfer(
              DataTransferType.Rw,
              event.loaded - consumedBytes
            );
          },
        },
      }
    )
  );

  // FAQ: no etag
  if (process.env.TARGET_ENVIRONMENT === 'browser') {
    if (res && !res.data.ETag) {
      throw new TosClientError(
        "No ETag in uploadPart's response headers, please see https://www.volcengine.com/docs/6349/127737 to fix CORS problem"
      );
    }
  }

  if (err || !res) {
    triggerDataTransfer(DataTransferType.Failed);
    throw err;
  }

  triggerDataTransfer(DataTransferType.Succeed);
  return res;
}

export async function uploadPart(this: TOSBase, input: UploadPartInput) {
  return _uploadPart.call(this, input);
}

interface UploadPartFromFileInput extends Omit<UploadPartInput, 'body'> {
  filePath: string;
  /**
   * default: 0
   */
  offset?: number;

  /**
   * default: file size
   */
  partSize?: number;
}
export async function uploadPartFromFile(
  this: TOSBase,
  input: UploadPartFromFileInput
) {
  if (process.env.TARGET_ENVIRONMENT !== 'node') {
    throw new TosClientError(
      "uploadPartFromFile doesn't support in browser environment"
    );
  }

  const stats: Stats = await fsp.stat(input.filePath);
  const start = input.offset ?? 0;
  const end = Math.min(stats.size, start + (input.partSize ?? stats.size));
  const makeRetryStream = () => {
    const stream = fs.createReadStream(input.filePath, {
      start,
      end: end - 1,
    });
    return stream;
  };

  return _uploadPart.call(this, {
    ...input,
    body: makeRetryStream(),
    headers: {
      ...(input.headers || {}),
      ['content-length']: `${end - start}`,
    },
    makeRetryStream,
  });
}
