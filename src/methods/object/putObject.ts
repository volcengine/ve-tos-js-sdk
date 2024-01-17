import TOSBase, { TosResponse } from '../base';
import {
  fillRequestHeaders,
  normalizeHeadersKey,
  safeAwait,
} from '../../utils';
import {
  Acl,
  DataTransferStatus,
  DataTransferType,
  SupportObjectBody,
} from '../../interface';
import TosClientError from '../../TosClientError';
import * as fsp from '../../nodejs/fs-promises';
import fs, { Stats } from 'fs';
import { Readable } from 'stream';
import { getSize, getNewBodyConfig } from './utils';
import { retryNamespace } from '../../axios';
import { IRateLimiter } from '../../rate-limiter';
import { StorageClassType } from '../../TosExportEnum';

export interface PutObjectInput {
  bucket?: string;
  key: string;
  /**
   * body is empty buffer if it's falsy.
   */
  body?: SupportObjectBody;

  contentLength?: number;
  contentMD5?: string;
  contentSHA256?: string;
  cacheControl?: string;
  contentDisposition?: string;
  contentEncoding?: string;
  contentLanguage?: string;
  contentType?: string;
  expires?: Date;

  acl?: Acl;
  grantFullControl?: string;
  grantRead?: string;
  grantReadAcp?: string;
  grantWrite?: string;
  grantWriteAcp?: string;

  ssecAlgorithm?: string;
  ssecKey?: string;
  ssecKeyMD5?: string;
  serverSideEncryption?: string;

  meta?: Record<string, string>;
  websiteRedirectLocation?: string;
  storageClass?: StorageClassType;

  dataTransferStatusChange?: (status: DataTransferStatus) => void;

  /**
   * the simple progress feature
   * percent is [0, 1].
   *
   * since putObject is stateless, so if `putObject` fail and you retry it,
   * `percent` will start from 0 again rather than from the previous value.
   * if you need `percent` start from the previous value, you can use `uploadFile` instead.
   */
  progress?: (percent: number) => void;
  /**
   * unit: bit/s
   * server side traffic limit
   **/
  trafficLimit?: number;
  /**
   * only works for nodejs environment
   **/
  rateLimiter?: IRateLimiter;

  callback?: string;
  callbackVar?: string;

  headers?: {
    [key: string]: string | undefined;
    'content-length'?: string;
    'content-type'?: string;
    'content-md5'?: string;
    'cache-control'?: string;
    expires?: string;
    'x-tos-acl'?: Acl;
    'x-tos-grant-full-control'?: string;
    'x-tos-grant-read'?: string;
    'x-tos-grant-read-acp'?: string;
    'x-tos-grant-write-acp'?: string;
    'x-tos-server-side-encryption-customer-algorithm'?: string;
    'x-tos-server-side-encryption-customer-key'?: string;
    'x-tos-server-side-encryption-customer-key-md5'?: string;
    'x-tos-website-redirect-location'?: string;
    'x-tos-storage-class'?: string;
    'x-tos-server-side-encryption'?: string;
  };
}

interface PutObjectInputInner extends PutObjectInput {
  makeRetryStream?: () => Readable;
}

export interface PutObjectOutput {
  'x-tos-server-side-encryption-customer-algorithm'?: string;
  'x-tos-server-side-encryption-customer-key-md5'?: string;
  'x-tos-version-id'?: string;
  'x-tos-hash-crc64ecma'?: string;
  'x-tos-server-side-encryption'?: string;
  CallbackResult?: string;
}

export async function putObject(this: TOSBase, input: PutObjectInput | string) {
  return _putObject.call(this, input);
}

export async function _putObject(
  this: TOSBase,
  input: PutObjectInputInner | string
): Promise<TosResponse<PutObjectOutput>> {
  input = this.normalizeObjectInput(input);
  const headers = (input.headers = normalizeHeadersKey(input.headers));
  fillRequestHeaders(input, [
    'contentLength',
    'contentMD5',
    'contentSHA256',
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
    'grantWrite',
    'grantWriteAcp',
    'ssecAlgorithm',
    'ssecKey',
    'ssecKeyMD5',
    'serverSideEncryption',
    'meta',
    'websiteRedirectLocation',
    'storageClass',
    'trafficLimit',
    'callback',
    'callbackVar',
  ]);
  this.setObjectContentTypeHeader(input, headers);

  const totalSize = getSize(input.body, headers);
  const totalSizeValid = totalSize != null;

  if (!totalSizeValid && (input.dataTransferStatusChange || input.progress)) {
    console.warn(
      `Don't get totalSize of putObject's body, the \`dataTransferStatusChange\` and \`progress\` callback will not trigger. You can use \`putObjectFromFile\` instead`
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
    makeRetryStream: input.makeRetryStream,
    enableCRC: this.opts.enableCRC,
    rateLimiter: input.rateLimiter,
  });

  triggerDataTransfer(DataTransferType.Started);
  const [err, res] = await safeAwait(
    this._fetchObject<PutObjectOutput>(
      input,
      'PUT',
      {},
      headers,
      bodyConfig.body || '',
      {
        handleResponse: (res) => {
          const result = { ...res.headers };
          if ((input as PutObjectInputInner)?.callback && res.data) {
            result.CallbackResult = `${JSON.stringify(res.data)}`;
          }
          return result;
        },
        crc: bodyConfig.crc,
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

  if (err || !res) {
    triggerDataTransfer(DataTransferType.Failed);
    throw err;
  }

  triggerDataTransfer(DataTransferType.Succeed);
  return res;
}

interface PutObjectFromFileInput extends Omit<PutObjectInput, 'body'> {
  filePath: string;
}

export async function putObjectFromFile(
  this: TOSBase,
  input: PutObjectFromFileInput
): Promise<TosResponse<PutObjectOutput>> {
  const normalizedHeaders = normalizeHeadersKey(input.headers);
  if (process.env.TARGET_ENVIRONMENT !== 'node') {
    throw new TosClientError(
      "putObjectFromFile doesn't support in browser environment"
    );
  }

  if (!normalizedHeaders['content-length']) {
    const stats: Stats = await fsp.stat(input.filePath);
    normalizedHeaders['content-length'] = `${stats.size}`;
  }
  const makeRetryStream = () => {
    const stream = fs.createReadStream(input.filePath);
    return stream;
  };

  return _putObject.call(this, {
    ...input,
    body: makeRetryStream(),
    headers: normalizedHeaders,
    makeRetryStream,
  });
}

export default putObject;
