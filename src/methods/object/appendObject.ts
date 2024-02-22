import TOSBase from '../base';
import {
  fillRequestHeaders,
  normalizeHeadersKey,
  safeAwait,
} from '../../utils';
import { Acl, DataTransferStatus, DataTransferType } from '../../interface';
import { IRateLimiter } from '../../rate-limiter';
import { getNewBodyConfig, getSize } from './utils';
import { StorageClassType } from '../../TosExportEnum';
import { retryNamespace } from '../../axios';
import TosClientError from '../../TosClientError';

export interface AppendObjectInput {
  bucket?: string;
  key: string;
  offset: number;
  // body is empty buffer if it's falsy
  body?: File | Blob | Buffer | NodeJS.ReadableStream;

  /**
   * unit: bit/s
   * server side traffic limit
   **/
  trafficLimit?: number;
  /**
   * only works for nodejs environment
   */
  rateLimiter?: IRateLimiter;

  contentLength?: number;
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
  grantWriteAcp?: string;

  meta?: Record<string, string>;
  websiteRedirectLocation?: string;
  storageClass?: StorageClassType;

  dataTransferStatusChange?: (status: DataTransferStatus) => void;

  /**
   * the simple progress feature
   * percent is [0, 1].
   *
   * since appendObject is stateless, so if `appendObject` fail and you retry it,
   * `percent` will start from 0 again rather than from the previous value.
   * if you need `percent` start from the previous value, you can use `uploadFile` instead.
   */
  progress?: (percent: number) => void;

  headers?: {
    [key: string]: string | undefined;
    'Cache-Control'?: string;
    'x-tos-acl'?: Acl;
    'x-tos-grant-full-control'?: string;
    'x-tos-grant-read'?: string;
    'x-tos-grant-read-acp'?: string;
    'x-tos-grant-write-acp'?: string;
    'x-tos-website-redirect-location'?: string;
    'x-tos-storage-class'?: string;
  };
}

export interface AppendObjectOutput {
  nextAppendOffset: number;
  hashCrc64ecma: string;
  'x-tos-version-id'?: string;
  'x-tos-hash-crc64ecma'?: string;
  'x-tos-next-append-offset'?: string;
}

export async function appendObject(
  this: TOSBase,
  input: AppendObjectInput | string
) {
  input = this.normalizeObjectInput(input);
  const headers = (input.headers = normalizeHeadersKey(input.headers));
  fillRequestHeaders(input, [
    'contentLength',
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
    'meta',
    'websiteRedirectLocation',
    'storageClass',
    'trafficLimit',
  ]);
  this.setObjectContentTypeHeader(input, headers);

  const totalSize = getSize(input.body, headers);
  const totalSizeValid = totalSize != null;
  if (!totalSizeValid) {
    throw new TosClientError(
      `appendObject needs to know the content length in advance`
    );
  }
  headers['content-length'] = headers['content-length'] || `${totalSize}`;

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
    makeRetryStream: undefined,
    enableCRC: this.opts.enableCRC,
    rateLimiter: input.rateLimiter,
  });

  triggerDataTransfer(DataTransferType.Started);
  const [err, res] = await safeAwait(
    this._fetchObject<AppendObjectOutput>(
      input,
      'POST',
      { append: '', offset: input.offset },
      headers,
      bodyConfig.body || '',
      {
        handleResponse: (res) => ({
          ...res.headers,
          nextAppendOffset: +res.headers['x-tos-next-append-offset'],
          hashCrc64ecma: res.headers['x-tos-hash-crc64ecma'],
        }),
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

export default appendObject;
