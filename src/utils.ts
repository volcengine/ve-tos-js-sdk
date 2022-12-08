import { Headers } from './interface';
import { TOSConstructorOptions } from './methods/base';
import { Readable } from 'stream';
import { CancelError } from './CancelError';

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
      return (target.map(it => finalMethod(it)) as unknown) as T;
    }

    if (typeof target === 'string') {
      return (convertMethod(target) as unknown) as T;
    }

    if (typeof target === 'object' && target != null) {
      type Obj = Record<string, unknown>;
      const ret = Object.keys(target).reduce((acc: Obj, key: string) => {
        const nextKey = finalMethod(key);
        acc[nextKey] = (target as Obj)[key];
        return acc;
      }, {});
      return (ret as unknown) as T;
    }

    return target;
  };

  return finalMethod;
};

export const covertCamelCase2Kebab = makeConvertProp((camelCase: string) => {
  return camelCase.replace(/[A-Z]/g, '-$&').toLowerCase();
});

export const convertUpperCamelCase2Normal = makeConvertProp(
  (upperCamelCase: string) => {
    return upperCamelCase[0].toLocaleLowerCase() + upperCamelCase.slice(1);
  }
);

export const convertNormalCamelCase2Upper = makeConvertProp(
  (normalCamelCase: string) => {
    return normalCamelCase[0].toUpperCase() + normalCamelCase.slice(1);
  }
);

export const getSortedQueryString = (query: Record<string, any>) => {
  const searchParts: string[] = [];
  Object.keys(query)
    .sort()
    .forEach(key => {
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
    .map(key => {
      const vStr = `${v[key]}`;
      return `${encodeURIComponent(key)}=${encodeURIComponent(vStr)}`;
    })
    .join('&');
}

export function isCancelError(err: any) {
  return err instanceof CancelError;
}

export const DEFAULT_PART_SIZE = 20 * 1024 * 1024; // 20 MB
