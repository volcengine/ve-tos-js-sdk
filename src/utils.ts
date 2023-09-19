import { Readable } from 'stream';
import {
  CamelCasedPropertiesDeep,
  KebabCasedPropertiesDeep,
  PascalCasedPropertiesDeep,
} from 'type-fest';
import { CancelError } from './CancelError';
import TosClientError from './TosClientError';
import { Headers } from './interface';
import { TOSConstructorOptions, TosResponse } from './methods/base';
import qs from 'qs';
import TosServerError from './TosServerError';

// obj[key] must be a array
export const makeArrayProp = (obj: unknown) => (key: string) => {
  if (obj == null || typeof obj !== 'object') {
    return;
  }

  const objAny = obj as any;
  const v = objAny[key];
  if (!Array.isArray(v)) {
    objAny[key] = v == null ? [] : [v];
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

export async function readAllDataToBuffer(
  readableStream: NodeJS.ReadableStream
): Promise<Buffer> {
  let chunks = '';

  for await (const chunk of readableStream) {
    chunks += chunk;
  }

  return Buffer.from(chunks);
}

export const DEFAULT_PART_SIZE = 20 * 1024 * 1024; // 20 MB

export const requestHeadersMap: Record<
  string,
  string | [string, (v: any) => string] | ((v: any) => Record<string, string>)
> = {
  encodingType: 'encoding-type',
  cacheControl: 'cache-control',
  contentDisposition: 'content-disposition',
  contentEncoding: 'content-encoding',
  contentLanguage: 'content-language',
  contentType: 'content-type',
  expires: ['expires', (v: Date) => v.toUTCString()],
  range: 'content-range',

  ifMatch: 'if-match',
  ifModifiedSince: 'if-modified-since',
  ifNoneMatch: 'if-none-match',
  ifUnmodifiedSince: 'if-unmodified-since',

  acl: 'x-tos-acl',
  grantFullControl: 'x-tos-grant-full-control',
  grantRead: 'x-tos-grant-read',
  grantReadAcp: 'x-tos-grant-read-acp',
  grantWrite: 'x-tos-grant-write',
  grantWriteAcp: 'x-tos-grant-write-acp',

  serverSideEncryption: 'x-tos-server-side-encryption',
  ssecAlgorithm: 'x-tos-server-side-encryption-customer-algorithm',
  ssecKey: 'x-tos-server-side-encryption-customer-key',
  ssecKeyMD5: 'x-tos-server-side-encryption-customer-key-md5',

  copySourceIfMatch: 'x-tos-copy-source-if-match',
  copySourceIfModifiedSince: 'x-tos-copy-source-if-modified-since',
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
  process: 'x-tos-process',
  trafficLimit: 'x-tos-traffic-limit',
  callback: 'x-tos-callback',
  callbackVar: 'x-tos-callback-var',
};
// type RequestHeadersMapKeys = keyof typeof requestHeadersMap;

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
export function handleEmptyServerError<T>(
  err: Error | TosServerError | unknown,
  defaultResponse: T
) {
  if (err instanceof TosServerError) {
    if (err.statusCode === 404) {
      return getNormalDataFromError(defaultResponse, err);
    }
  }
  throw err;
}
