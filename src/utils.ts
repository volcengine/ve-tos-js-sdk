import pickBy from 'lodash/pickBy';
import get from 'lodash/get';
import set from 'lodash/set';
import { Headers } from './interface';
import { TOSConstructorOptions } from './methods/base';

// obj[key] must be a array
export const makeArrayProp = (obj: Object) => (key: string) => {
  const v = get(obj, key);
  if (!Array.isArray(v)) {
    set(obj, key, v == null ? [] : [v]);
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

export const normalizeHeaders = <T extends Headers>(
  headers: T | undefined
): T => {
  const headers1 = (pickBy(
    headers || {},
    v => v != null
  ) as unknown) as Headers;

  const headers2: Headers = {};
  Object.keys(headers1).forEach((key: string) => {
    const newKey = key.toLowerCase();
    headers2[newKey] = headers1[key];
  });

  return headers2 as T;
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
