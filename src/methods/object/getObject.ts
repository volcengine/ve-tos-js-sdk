import { createWriteStream } from '../../nodejs/fs-promises';
import TosClientError from '../../TosClientError';
import { DataTransferStatus, DataTransferType, Headers } from '../../interface';
import {
  fillRequestHeaders,
  fillRequestQuery,
  streamToBuf,
  isReadable,
  normalizeHeadersKey,
  safeAwait,
} from '../../utils';
import TOSBase, { TosResponse } from '../base';
import { IRateLimiter, createRateLimiterStream } from '../../rate-limiter';
import { isValidRateLimiter } from './utils';
import { createReadNReadStream } from '../../nodejs/EmitReadStream';

export interface GetObjectInput {
  bucket?: string;
  key: string;
  versionId?: string;

  headers?: {
    [key: string]: string | undefined;
    'If-Modified-Since'?: string;
    'If-Unmodified-Since'?: string;
    'If-Match'?: string;
    'If-None-Match'?: string;
    'x-tos-server-side-encryption-customer-key'?: string;
    'x-tos-server-side-encryption-customer-key-md5'?: string;
    'x-tos-server-side-encryption-customer-algorithm'?: string;
    Range?: string;
  };
  response?: Headers & {
    'cache-control'?: string;
    'content-disposition'?: string;
    'content-encoding'?: string;
    'content-language'?: string;
    'content-type'?: string;
    expires?: string;
  };
}

/**
 * @deprecated use getObjectV2 instead
 * @returns arraybuffer
 */
export async function getObject(this: TOSBase, input: GetObjectInput | string) {
  const normalizedInput = typeof input === 'string' ? { key: input } : input;
  const query: Record<string, any> = {};
  if (normalizedInput.versionId) {
    query.versionId = normalizedInput.versionId;
  }
  const headers: Headers = normalizeHeadersKey(normalizedInput?.headers);
  const response: Partial<Headers> = normalizedInput?.response || {};
  Object.keys(response).forEach((key: string) => {
    const v = response[key];
    if (v != null) {
      query[`response-${key}`] = v;
    }
  });

  // TODO: maybe need to return response's headers
  return this._fetchObject<Buffer>(input, 'GET', query, headers, undefined, {
    axiosOpts: { responseType: 'arraybuffer' },
  });
}

type DataType = 'stream' | 'buffer' | 'blob';
export interface GetObjectV2Input {
  bucket?: string;
  key: string;
  versionId?: string;

  /**
   * The type of return value, 'stream' | 'blob'
   * default: 'stream'
   *
   * nodejs environment can use 'stream' and 'buffer'
   * browser environment can use 'blob'
   */
  dataType?: DataType;

  ifMatch?: string;
  ifModifiedSince?: string | Date;
  ifNoneMatch?: string;
  ifUnmodifiedSince?: string | Date;

  ssecAlgorithm?: string;
  ssecKey?: string;
  ssecKeyMD5?: string;
  /**
   * unit: bit/s
   * server side traffic limit
   **/
  trafficLimit?: number;
  /**
   * only works for nodejs environment
   */
  rateLimiter?: IRateLimiter;

  range?: string;
  rangeStart?: number;
  rangeEnd?: number;

  process?: string;
  // need base64url encode
  saveBucket?: string;
  // need base64url encode
  saveObject?: string;

  responseCacheControl?: string;
  responseContentDisposition?: string;
  responseContentEncoding?: string;
  responseContentLanguage?: string;
  responseContentType?: string;
  responseExpires?: Date;

  dataTransferStatusChange?: (status: DataTransferStatus) => void;
  /**
   * the simple progress feature
   * percent is [0, 1].
   */
  progress?: (percent: number) => void;

  headers?: {
    [key: string]: string | undefined;
    'If-Modified-Since'?: string;
    'If-Unmodified-Since'?: string;
    'If-Match'?: string;
    'If-None-Match'?: string;
    'x-tos-server-side-encryption-customer-key'?: string;
    'x-tos-server-side-encryption-customer-key-md5'?: string;
    'x-tos-server-side-encryption-customer-algorithm'?: string;
    range?: string;
  };
  /**
   * @deprecated use responseXxx options instead
   */
  response?: Headers & {
    'cache-control'?: string;
    'content-disposition'?: string;
    'content-encoding'?: string;
    'content-language'?: string;
    'content-type'?: string;
    expires?: string;
  };
}
export interface GetObjectV2Output {
  content: NodeJS.ReadableStream | Buffer | Blob;
  etag: string;
  lastModified: string;

  // object created before tos server supports crc, hashCrc64ecma will be empty string
  hashCrc64ecma: string;
}

interface GetObjectV2OutputStream extends Omit<GetObjectV2Output, 'content'> {
  content: NodeJS.ReadableStream;
}
interface GetObjectV2InputBuffer extends Omit<GetObjectV2Input, 'dataType'> {
  dataType: 'buffer';
}
interface GetObjectV2OutputBuffer extends Omit<GetObjectV2Output, 'content'> {
  content: Buffer;
}
interface GetObjectV2InputBlob extends Omit<GetObjectV2Input, 'dataType'> {
  dataType: 'blob';
}
interface GetObjectV2OutputBlob extends Omit<GetObjectV2Output, 'content'> {
  content: Blob;
}

const NODEJS_DATATYPE: DataType[] = ['stream', 'buffer'];
const BROWSER_DATATYPE: DataType[] = ['blob'];

function checkSupportDataType(dataType: DataType) {
  let environment: 'node' | 'browser' = 'node';
  let supportDataTypes: DataType[] = [];
  if (process.env.TARGET_ENVIRONMENT === 'node') {
    environment = 'node';
    supportDataTypes = NODEJS_DATATYPE;
  } else {
    environment = 'browser';
    supportDataTypes = BROWSER_DATATYPE;
  }
  if (!supportDataTypes.includes(dataType)) {
    throw new TosClientError(
      `The value of \`dataType\` only supports \`${supportDataTypes.join(
        ' | '
      )}\` in ${environment} environment`
    );
  }
}

/**
 * `getObjectV2` default returns stream, using `dataType` param to return other type(eg: buffer, blob)
 */
async function getObjectV2(
  this: TOSBase,
  input: GetObjectV2InputBlob
): Promise<TosResponse<GetObjectV2OutputBlob>>;
async function getObjectV2(
  this: TOSBase,
  input: GetObjectV2InputBuffer
): Promise<TosResponse<GetObjectV2OutputBuffer>>;
async function getObjectV2(
  this: TOSBase,
  input: GetObjectV2Input | string
): Promise<TosResponse<GetObjectV2OutputStream>>;
async function getObjectV2(
  this: TOSBase,
  input: GetObjectV2Input | string
): Promise<TosResponse<GetObjectV2Output>> {
  const normalizedInput = typeof input === 'string' ? { key: input } : input;
  const headers = normalizeHeadersKey(normalizedInput.headers);
  normalizedInput.headers = headers;
  const dataType = normalizedInput.dataType || 'stream';
  normalizedInput.dataType = dataType;

  checkSupportDataType(dataType);

  const query: Record<string, unknown> = {};
  const response: Partial<Headers> = normalizedInput?.response || {};
  Object.keys(response).forEach((key: string) => {
    const v = response[key];
    if (v != null) {
      query[`response-${key}`] = v;
    }
  });
  fillRequestQuery(normalizedInput, query, [
    'versionId',
    'process',
    'saveBucket',
    'saveObject',
    'responseCacheControl',
    'responseContentDisposition',
    'responseContentEncoding',
    'responseContentLanguage',
    'responseContentType',
    'responseExpires',
  ]);

  fillRequestHeaders(normalizedInput, [
    'ifMatch',
    'ifModifiedSince',
    'ifNoneMatch',
    'ifUnmodifiedSince',

    'ssecAlgorithm',
    'ssecKey',
    'ssecKeyMD5',

    'range',
    'trafficLimit',
  ]);

  if (
    normalizedInput.range == null &&
    (normalizedInput.rangeStart != null || normalizedInput.rangeEnd != null)
  ) {
    const start =
      normalizedInput.rangeStart != null ? `${normalizedInput.rangeStart}` : '';
    const end =
      normalizedInput.rangeEnd != null ? `${normalizedInput.rangeEnd}` : '';
    const range = `bytes=${start}-${end}`;
    headers['range'] = headers['range'] ?? range;
  }

  const responseType = (() => {
    if (process.env.TARGET_ENVIRONMENT === 'node') {
      return 'stream';
    }
    return 'arraybuffer';
  })();

  let consumedBytes = 0;
  // totalSize is unknown when start download
  let totalSize = -1;
  const { dataTransferStatusChange, progress } = normalizedInput;
  const triggerDataTransfer = (
    type: DataTransferType,
    rwOnceBytes: number = 0
  ) => {
    // request cancel will make rwOnceBytes < 0 in browser
    if (rwOnceBytes < 0) {
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
      // `totalSize` is unknown if it's in start or fail
      if (totalSize < 0) {
        return 0;
      }

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

  triggerDataTransfer(DataTransferType.Started);
  const [err, res] = await safeAwait(
    this._fetchObject<any>(input, 'GET', query, headers, undefined, {
      axiosOpts: {
        responseType,
        onDownloadProgress: (event) => {
          totalSize = event.total;
          triggerDataTransfer(
            DataTransferType.Rw,
            event.loaded - consumedBytes
          );
        },
      },
    })
  );
  if (err || !res) {
    triggerDataTransfer(DataTransferType.Failed);
    throw err;
  }

  let resHeaders = res.headers;
  let newData: NodeJS.ReadableStream | Blob | Buffer = res.data;
  totalSize = +(resHeaders['content-length'] || 0);

  if (process.env.TARGET_ENVIRONMENT === 'node') {
    // res.data must be a stream in nodejs environment
    if (isReadable(newData)) {
      if (
        normalizedInput.rateLimiter &&
        isValidRateLimiter(normalizedInput.rateLimiter)
      ) {
        newData = createRateLimiterStream(
          newData as NodeJS.ReadableStream,
          normalizedInput.rateLimiter
        );
      }

      newData = createReadNReadStream(newData, (n) =>
        triggerDataTransfer(DataTransferType.Rw, n)
      );
      newData.on('end', () => triggerDataTransfer(DataTransferType.Succeed));

      if (dataType === 'buffer') {
        // consume stream after `createRateLimiterStream`
        newData = await streamToBuf(newData);
      }
    } else {
      // should not enter this branch
    }
  } else {
    // 浏览器环境
    if (dataType === 'blob') {
      newData = new Blob([res.data], {
        type: resHeaders['content-type'],
      });
    }
    triggerDataTransfer(DataTransferType.Succeed);
  }

  const actualRes: TosResponse<GetObjectV2Output> = {
    ...res,
    data: {
      content: newData,
      etag: resHeaders['etag'] || '',
      lastModified: resHeaders['last-modified'] || '',
      hashCrc64ecma: resHeaders['x-tos-hash-crc64ecma'] || '',
    },
  };
  return actualRes;
}

interface GetObjectToFileInput extends Omit<GetObjectV2Input, 'dataType'> {
  filePath: string;
}
interface GetObjectToFileOutput extends Omit<GetObjectV2Output, 'content'> {}

export async function getObjectToFile(
  this: TOSBase,
  input: GetObjectToFileInput
): Promise<TosResponse<GetObjectToFileOutput>> {
  if (process.env.TARGET_ENVIRONMENT !== 'node') {
    throw new TosClientError(
      "getObjectToFile doesn't support in browser environment"
    );
  }

  return new Promise(async (resolve, reject) => {
    const getObjectRes = await getObjectV2.call(this, input);
    const stream = getObjectRes.data.content;

    const fsWriteStream = createWriteStream(input.filePath);
    stream.pipe(fsWriteStream);
    fsWriteStream.on('error', (err) => reject(err));
    fsWriteStream.on('finish', () => {
      const newData: any = { ...getObjectRes.data };
      delete newData.content;
      resolve({ ...getObjectRes, data: { ...newData } });
    });
  });
}

export { getObjectV2 };
