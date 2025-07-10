import { Readable } from 'stream';
import {
  CamelCasedPropertiesDeep,
  KebabCasedPropertiesDeep,
  PascalCasedPropertiesDeep,
} from 'type-fest';
import get from 'lodash/get';
import set from 'lodash/set';
import { CancelError } from './CancelError';
import TosClientError from './TosClientError';
import { Headers } from './interface';
import { TOSConstructorOptions, TosResponse } from './methods/base';
import qs from 'qs';
import TosServerError from './TosServerError';
import { CRCCls } from './universal/crc';
import * as fsp from './nodejs/fs-promises';
import { ReadStream, WriteStream } from 'fs';
import * as log from './log';

// obj[key] must be a array
export const makeArrayProp = (obj: unknown) => (key: string) => {
  if (obj == null || typeof obj !== 'object') {
    return;
  }

  const value = get(obj, key);
  if (!Array.isArray(value)) {
    set(obj, key, value == null ? [] : [value]);
  }
};

const makeConvertProp = (convertMethod: (prop: string) => string) => {
  const finalMethod = <T = unknown>(target: T): T => {
    if (Array.isArray(target)) {
      return target.map((it) => finalMethod(it)) as unknown as T;
    }

    if (typeof target === 'string') {
      return convertMethod(target) as unknown as T;
    }

    if (typeof target === 'object' && target != null) {
      type Obj = Record<string, unknown>;
      const ret = Object.keys(target).reduce((acc: Obj, key: string) => {
        const nextKey = finalMethod(key);
        acc[nextKey] = (target as Obj)[key];
        return acc;
      }, {});
      return ret as unknown as T;
    }

    return target;
  };

  return finalMethod;
};

export const covertCamelCase2Kebab = makeConvertProp((camelCase: string) => {
  return camelCase.replace(/[A-Z]/g, '-$&').toLowerCase();
}) as <T = unknown>(target: T) => KebabCasedPropertiesDeep<T>;

export const convertUpperCamelCase2Normal = makeConvertProp(
  (upperCamelCase: string) => {
    return upperCamelCase[0].toLocaleLowerCase() + upperCamelCase.slice(1);
  }
) as <T = unknown>(target: T) => CamelCasedPropertiesDeep<T>;

export const convertNormalCamelCase2Upper = makeConvertProp(
  (normalCamelCase: string) => {
    return normalCamelCase[0].toUpperCase() + normalCamelCase.slice(1);
  }
) as <T = unknown>(target: T) => PascalCasedPropertiesDeep<T>;

export const getSortedQueryString = (query: Record<string, any>) => {
  const searchParts: string[] = [];
  Object.keys(query)
    .sort()
    .forEach((key) => {
      searchParts.push(
        `${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`
      );
    });
  return searchParts.join('&');
};

export const normalizeHeadersKey = <T extends Headers>(
  headers: T | undefined
): T => {
  const headers1: Headers = headers || {};
  const headers2: Headers = {};
  Object.keys(headers1).forEach((key: string) => {
    if (headers1[key] != null) {
      headers2[key] = headers1[key];
    }
  });

  const headers3: Headers = {};
  Object.keys(headers2).forEach((key: string) => {
    const newKey = key.toLowerCase();
    headers3[newKey] = headers2[key];
  });

  return headers3 as T;
};

export const encodeHeadersValue = (headers: Headers) => {
  const header2: Headers = {};
  Object.entries(headers).forEach(([key, value]) => {
    header2[key] = `${value}`
      // reference:
      //  https://stackoverflow.com/questions/38345372/why-is-length-2
      .match(/./gu)!
      .map((ch: string) => {
        if (ch.length > 1 || ch.charCodeAt(0) >= 128) {
          return encodeURIComponent(ch);
        }
        return ch;
      })
      .join('');
  });
  return header2;
};

// TODO: getRegion from endpoint, maybe user passes it is better.
export const getRegion = (endpoint: string) => {
  const region = endpoint.match(/-(\w+).volces.com/);
  if (!region) {
    return 'cn-beijing';
  }
  return `cn-${region[1]}`;
};

export const getEndpoint = (region: string) => {
  return `tos-${region}.volces.com`;
};

export const normalizeProxy = (proxy: TOSConstructorOptions['proxy']) => {
  if (typeof proxy === 'string') {
    proxy = {
      url: proxy,
    };
  }

  if (
    proxy &&
    proxy?.needProxyParams == null &&
    process.env.TARGET_ENVIRONMENT === 'browser'
  ) {
    proxy.needProxyParams = true;
  }

  return proxy;
};

export async function safeAwait<T>(
  p: T
): Promise<[null, Awaited<T>] | [any, null]> {
  try {
    const v = await p;
    return [null, v];
  } catch (err) {
    return [err, null];
  }
}

export function safeSync<T>(func: () => T): [any, null] | [null, T] {
  try {
    const ret = func();
    return [null, ret];
  } catch (err) {
    return [err, null];
  }
}

export function isBlob(obj: unknown): obj is Blob {
  return typeof Blob !== 'undefined' && obj instanceof Blob;
}

export function isBuffer(obj: unknown): obj is Buffer {
  return typeof Buffer !== 'undefined' && obj instanceof Buffer;
}

export function isReadable(obj: unknown): obj is NodeJS.ReadableStream {
  if (process.env.TARGET_ENVIRONMENT !== 'node') {
    return false;
  }

  return obj instanceof Readable;
}

export function isValidNumber(v: number): v is number {
  return !!v || v == 0;
}

export function obj2QueryStr(v?: Record<string, unknown>) {
  if (!v) {
    return '';
  }
  return Object.keys(v)
    .map((key) => {
      const vStr = `${v[key]}`;
      return `${encodeURIComponent(key)}=${encodeURIComponent(vStr)}`;
    })
    .join('&');
}

export function isCancelError(err: any) {
  return err instanceof CancelError;
}

export const DEFAULT_PART_SIZE = 20 * 1024 * 1024; // 20 MB

export const getGMTDateStr = (v: Date) => {
  return v.toUTCString();
};
const gmtDateOrStr = (v: Date | string) => {
  if (typeof v === 'string') {
    return v;
  }
  return v.toUTCString();
};

export const requestHeadersMap: Record<
  string,
  string | [string, (v: any) => string] | ((v: any) => Record<string, string>)
> = {
  projectName: 'x-tos-project-name',
  encodingType: 'encoding-type',
  cacheControl: 'cache-control',
  contentDisposition: 'content-disposition',
  contentLength: 'content-length',
  contentMD5: 'content-md5',
  contentSHA256: 'x-tos-content-sha256',
  contentEncoding: 'content-encoding',
  contentLanguage: 'content-language',
  contentType: 'content-type',
  expires: ['expires', getGMTDateStr],
  range: 'range',

  ifMatch: 'if-match',
  ifModifiedSince: ['if-modified-since', gmtDateOrStr],
  ifNoneMatch: 'if-none-match',
  ifUnmodifiedSince: ['if-unmodified-since', gmtDateOrStr],

  acl: 'x-tos-acl',
  grantFullControl: 'x-tos-grant-full-control',
  grantRead: 'x-tos-grant-read',
  grantReadAcp: 'x-tos-grant-read-acp',
  grantWrite: 'x-tos-grant-write',
  grantWriteAcp: 'x-tos-grant-write-acp',

  serverSideEncryption: 'x-tos-server-side-encryption',
  serverSideDataEncryption: 'x-tos-server-side-data-encryption',
  ssecAlgorithm: 'x-tos-server-side-encryption-customer-algorithm',
  ssecKey: 'x-tos-server-side-encryption-customer-key',
  ssecKeyMD5: 'x-tos-server-side-encryption-customer-key-md5',

  copySourceRange: 'x-tos-copy-source-range',
  copySourceIfMatch: 'x-tos-copy-source-if-match',
  copySourceIfModifiedSince: [
    'x-tos-copy-source-if-modified-since',
    gmtDateOrStr,
  ],
  copySourceIfNoneMatch: 'x-tos-copy-source-if-none-match',
  copySourceIfUnmodifiedSince: 'x-tos-copy-source-if-unmodified-since',
  copySourceSSECAlgorithm:
    'x-tos-copy-source-server-side-encryption-customer-algorithm',
  copySourceSSECKey: 'x-tos-copy-source-server-side-encryption-customer-key',
  copySourceSSECKeyMD5:
    'x-tos-copy-source-server-side-encryption-customer-key-MD5',

  metadataDirective: 'x-tos-metadata-directive',
  meta: (v: any) => {
    return Object.keys(v).reduce((prev, key) => {
      prev[`x-tos-meta-${key}`] = `${v[key]}`;
      return prev;
    }, {} as Record<string, string>);
  },
  websiteRedirectLocation: 'x-tos-website-redirect-location',
  storageClass: 'x-tos-storage-class',
  azRedundancy: 'x-tos-az-redundancy',
  trafficLimit: 'x-tos-traffic-limit',
  callback: 'x-tos-callback',
  callbackVar: 'x-tos-callback-var',
  allowSameActionOverlap: ['x-tos-allow-same-action-overlap', (v) => String(v)],
  symLinkTargetKey: 'x-tos-symlink-target',
  symLinkTargetBucket: 'x-tos-symlink-bucket',
  forbidOverwrite: 'x-tos-forbid-overwrite',
  bucketType: 'x-tos-bucket-type',
  recursiveMkdir: 'x-tos-recursive-mkdir',
};
// type RequestHeadersMapKeys = keyof typeof requestHeadersMap;

export const requestQueryMap: Record<
  string,
  string | [string, (v: any) => string] | ((v: any) => Record<string, string>)
> = {
  versionId: 'versionId',
  process: 'x-tos-process',
  saveBucket: 'x-tos-save-bucket',
  saveObject: 'x-tos-save-object',

  responseCacheControl: 'response-cache-control',
  responseContentDisposition: 'response-content-disposition',
  responseContentEncoding: 'response-content-encoding',
  responseContentLanguage: 'response-content-language',
  responseContentType: 'response-content-type',
  responseExpires: ['response-expires', (v: Date) => v.toUTCString()],
};

export function fillRequestHeaders<T extends { headers?: Headers }>(
  v: T,
  // keys: (keyof T & RequestHeadersMapKeys)[]
  keys: (keyof T & string)[]
) {
  if (!keys.length) {
    return;
  }

  const headers = v.headers || {};
  v.headers = headers;

  function setOneHeader(k: string, v: string) {
    if (headers[k] == null) {
      headers[k] = v;
    }
  }

  keys.forEach((k) => {
    const confV = requestHeadersMap[k];
    if (!confV) {
      // maybe warning
      throw new TosClientError(
        `\`${k}\` isn't in keys of \`requestHeadersMap\``
      );
    }

    const oriValue = v[k];
    if (oriValue == null) {
      return;
    }

    const oriValueStr = `${oriValue}`;
    if (typeof confV === 'string') {
      return setOneHeader(confV, oriValueStr);
    }

    if (Array.isArray(confV)) {
      const newKey = confV[0];
      const newValue = confV[1](oriValue);
      return setOneHeader(newKey, newValue);
    }

    const obj = confV(oriValue);
    Object.entries(obj).forEach(([k, v]) => {
      setOneHeader(k, v);
    });
  });
}

export function fillRequestQuery<T>(
  v: T,
  query: Record<string, unknown>,
  keys: (keyof T & string)[]
) {
  if (!keys.length) {
    return;
  }

  function setOneKey(k: string, v: string) {
    if (query[k] == null) {
      query[k] = v;
    }
  }

  keys.forEach((k) => {
    const confV = requestQueryMap[k];
    if (!confV) {
      // maybe warning
      throw new TosClientError(`\`${k}\` isn't in keys of \`requestQueryMap\``);
    }

    const oriValue = v[k];
    if (oriValue == null) {
      return;
    }

    const oriValueStr = `${oriValue}`;
    if (typeof confV === 'string') {
      return setOneKey(confV, oriValueStr);
    }

    if (Array.isArray(confV)) {
      const newKey = confV[0];
      const newValue = confV[1](oriValue);
      return setOneKey(newKey, newValue);
    }

    const obj = confV(oriValue);
    Object.entries(obj).forEach(([k, v]) => {
      setOneKey(k, v);
    });
  });
}

export const paramsSerializer = (params: Record<string, string>) => {
  return qs.stringify(params);
};

export function getNormalDataFromError<T>(
  data: T,
  err: TosServerError
): TosResponse<T> {
  return {
    data,
    statusCode: err.statusCode,
    headers: err.headers,
    requestId: err.requestId,
    id2: err.id2,
  };
}
export const streamToBuf = async (
  stream: NodeJS.ReadableStream
): Promise<Buffer> => {
  let buf = Buffer.from([]);
  return new Promise((resolve, reject) => {
    stream.on('data', (data) => {
      buf = Buffer.concat([buf, data]);
    });
    stream.on('end', () => {
      resolve(buf);
    });
    stream.on('error', (err) => {
      reject(err);
    });
  });
};

export function checkCRC64WithHeaders(crc: CRCCls | string, headers: Headers) {
  const serverCRC64 = headers['x-tos-hash-crc64ecma'];
  if (serverCRC64 == null) {
    if (process.env.TARGET_ENVIRONMENT === 'browser') {
      console.warn(
        "No x-tos-hash-crc64ecma in response's headers, please see https://www.volcengine.com/docs/6349/127737 to add `x-tos-hash-crc64ecma` to Expose-Headers field."
      );
    } else {
    }
    return;
  }

  const crcStr = typeof crc === 'string' ? crc : crc.getCrc64();
  if (crcStr !== serverCRC64) {
    throw new TosClientError(
      `validate file crc64 failed. Expect crc64 ${serverCRC64}, actual crc64 ${crcStr}. Please try again.`
    );
  }
}

export const bindStreamErrorHandler = (
  stream:
    | NodeJS.ReadableStream
    | ReadStream
    | NodeJS.WritableStream
    | WriteStream,
  prefix?: string
) =>
  stream.on('error', (err: any) => {
    log.TOS('bindStreamErrorHandler: ', `${prefix || ''} stream error:`, err);
  });

export enum HttpHeader {
  LastModified = 'last-modified',
  ContentLength = 'content-length',
  AcceptEncoding = 'accept-encoding',
  ContentEncoding = 'content-encoding',
  ContentMD5 = 'content-md5',
  TosRawContentLength = 'x-tos-raw-content-length',
  TosTrailer = 'x-tos-trailer',
  TosHashCrc64ecma = 'x-tos-hash-crc64ecma',
  TosContentSha256 = 'x-tos-content-sha256',
  TosDecodedContentLength = 'x-tos-decoded-content-length',
  TosEc = 'x-tos-ec',
  TosRequestId = 'x-tos-request-id',
}

/**
 * make async tasks serial
 * @param makeTask
 * @returns
 */
export const makeSerialAsyncTask = (makeTask: () => Promise<void>) => {
  let lastTask = Promise.resolve();
  return async () => {
    lastTask = lastTask.then(() => makeTask());
    return lastTask;
  };
};

export const safeParseCheckpointFile = async (filePath: string) => {
  try {
    return JSON.parse(await fsp.readFile(filePath, 'utf-8'));
  } catch (err) {
    console.warn("checkpoint's content is not a valid JSON");
    return undefined;
  }
};

export const makeRetryStreamAutoClose = (
  makeStream: () => NodeJS.ReadableStream | ReadStream
) => {
  let lastStream: ReadStream | NodeJS.ReadableStream | null = null;
  const makeRetryStream = () => {
    if (lastStream) {
      bindStreamErrorHandler(lastStream, 'retry new stream');

      tryDestroy(
        lastStream,
        new Error('retry new stream by makeRetryStreamAutoClose')
      );
    }

    lastStream = makeStream();
    return lastStream;
  };

  return {
    getLastStream: () => lastStream,
    make: makeRetryStream,
  };
};

export const tryDestroy = (
  stream:
    | NodeJS.ReadableStream
    | ReadStream
    | NodeJS.WritableStream
    | WriteStream
    | null
    | undefined,
  err: any
) => {
  if (stream && 'destroy' in stream && typeof stream.destroy === 'function') {
    if ('destroyed' in stream && !stream.destroyed) {
      stream.destroy(err);
    }
  }
};
export const pipeStreamWithErrorHandle = <
  Src extends NodeJS.ReadableStream | ReadStream,
  Dest extends NodeJS.WritableStream | WriteStream
>(
  src: Src,
  dest: Dest,
  label: string
): Dest => {
  bindStreamErrorHandler(dest, label);
  src.on('error', (err) => tryDestroy(dest, err));
  dest.on('error', (err) => tryDestroy(src, err));
  return src.pipe(dest) as Dest;
};

export const isValidBucketName = (bucket: string, isCustomDomain?: boolean) => {
  if (isCustomDomain) {
    return;
  }

  if (bucket) {
    if (bucket.length < 3 || bucket.length > 63) {
      throw new TosClientError(
        'invalid bucket name, the length must be [3, 63]'
      );
    }
    if (!/^([a-z]|-|\d)+$/.test(bucket)) {
      throw new TosClientError(
        'invalid bucket name, the character set is illegal'
      );
    }
    if (/^-/.test(bucket) || /-$/.test(bucket)) {
      throw new TosClientError(
        `invalid bucket name, the bucket name can be neither starting with '-' nor ending with '-'`
      );
    }
  }

}