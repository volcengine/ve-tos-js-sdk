import { getNewBodyConfig, getSize } from '../utils';
import TOSBase from '../../base';
import TosClientError from '../../../TosClientError';
import { Stats } from 'fs';
import * as fsp from '../../../nodejs/fs-promises';
import { DataTransferStatus, DataTransferType } from '../../../interface';
import {
  checkCRC64WithHeaders,
  fillRequestHeaders,
  isReadable,
  safeAwait,
} from '../../../utils';
import { retryNamespace } from '../../../axios';
import { hashMd5 } from '../../../universal/crypto';
import { IRateLimiter } from '../../../rate-limiter';

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
  /**
   * unit: bit/s
   * server side traffic limit
   **/
  trafficLimit?: number;
  /**
   * only works for nodejs environment
   */
  rateLimiter?: IRateLimiter;
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
  makeRetryStream?: () => NodeJS.ReadableStream | undefined;
  beforeRetry?: () => void;
  /**
   * default: false
   */
  enableContentMD5?: boolean;
}

export interface UploadPartOutput {
  partNumber: number;
  ETag: string;
  ssecAlgorithm?: string;
  ssecKeyMD5?: string;
  hashCrc64ecma: string;
  serverSideEncryption?: string;
  serverSideEncryptionKeyId?: string;
}

export async function _uploadPart(this: TOSBase, input: UploadPartInputInner) {
  const { uploadId, partNumber, body, enableContentMD5 = false } = input;
  fillRequestHeaders(input, ['trafficLimit']);
  const headers = input.headers || {};
  const size = getSize(body);
  if (size && headers['content-length'] == null) {
    headers['content-length'] = size.toFixed(0);
  }

  if (enableContentMD5 && headers['content-md5'] == null) {
    // current only support in nodejs
    if (isReadable(body) && input.makeRetryStream) {
      const newStream = input.makeRetryStream();
      if (newStream) {
        let allContent = Buffer.from([]);
        for await (const chunk of newStream) {
          allContent = Buffer.concat([
            allContent,
            typeof chunk === 'string' ? Buffer.from(chunk) : chunk,
          ]);
        }
        const md5 = hashMd5(allContent, 'base64');
        headers['content-md5'] = md5;
      }
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
    dataTransferCallback: (n) => triggerDataTransfer(DataTransferType.Rw, n),
    beforeRetry: input.beforeRetry,
    makeRetryStream: input.makeRetryStream,
    enableCRC: this.opts.enableCRC,
    rateLimiter: input.rateLimiter,
  });

  triggerDataTransfer(DataTransferType.Started);
  const task = async () => {
    const res = await this._fetchObject<UploadPartOutput>(
      input,
      'PUT',
      { partNumber, uploadId },
      headers,
      bodyConfig.body,
      {
        handleResponse: (res) => ({
          partNumber,
          ETag: res.headers.etag,
          serverSideEncryption: res.headers['x-tos-server-side-encryption'],
          serverSideEncryptionKeyId:
            res.headers['x-tos-server-side-encryption-kms-key-id'],
          ssecAlgorithm:
            res.headers['x-tos-server-side-encryption-customer-algorithm'],
          ssecKeyMD5:
            res.headers['x-tos-server-side-encryption-customer-key-MD5'],
          hashCrc64ecma: res.headers['x-tos-hash-crc64ecma'],
        }),
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
    );
    if (this.opts.enableCRC && bodyConfig.crc) {
      checkCRC64WithHeaders(bodyConfig.crc, res.headers);
    }
    return res;
  };
  const [err, res] = await safeAwait(task());

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
    const stream = fsp.createReadStream(input.filePath, {
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
