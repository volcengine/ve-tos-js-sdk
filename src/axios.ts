import axios from 'axios';
import { Readable } from 'stream';
import { safeSync } from './utils';
import { SignersV4 } from './signatureV4';
import * as log from './log';

export const retryNamespace = '__retryConfig__';
export const retrySignatureNamespace = '__retrySignature__';

export interface RetryConfig {
  // 对于文件流重试应该重新生成新的文件流
  makeRetryStream?: () => NodeJS.ReadableStream | undefined;

  beforeRetry?: () => void;
}

interface InnerRetryConfig extends RetryConfig {
  retryCount?: number;
}

interface RetrySignature {
  signOpt: any;
  sigInst: SignersV4;
}

declare module 'axios' {
  interface AxiosRequestConfig {
    __retryConfig__?: RetryConfig;
    __retrySignature__?: RetrySignature;
  }
}

function isNetworkError(error: any) {
  // no response or no requestId, ignore no network(error.code is undefined)
  return (
    (!error.response && Boolean(error.code)) ||
    (error.response && !error.response.headers?.['x-tos-request-id'])
  );
}

function isCanRetryStatusCode(error: any) {
  if (!error.response) {
    return false;
  }

  const { status } = error.response;
  if (status === 429 || status === 408 || status >= 500) {
    return true;
  }
  return false;
}

const BROWSER_NEED_DELETE_HEADERS = ['content-length', 'user-agent', 'host'];

export const makeAxiosInst = (maxRetryCount: number) => {
  const axiosInst = axios.create();
  // set `axiosInst` default values to avoid being affected by the global default values of axios
  axiosInst.defaults.auth = undefined;
  axiosInst.defaults.responseType = 'json';
  axiosInst.defaults.params = undefined;
  axiosInst.defaults.headers = {};
  axiosInst.defaults.withCredentials = false;
  axiosInst.defaults.maxContentLength = -1;
  axiosInst.defaults.maxBodyLength = -1;
  axiosInst.defaults.maxRedirects = 0;
  axiosInst.defaults.validateStatus = function (status) {
    return status >= 200 && status < 300; // default
  };
  axiosInst.defaults.decompress = false;
  axiosInst.defaults.transitional = {
    silentJSONParsing: true,
    forcedJSONParsing: true,
    clarifyTimeoutError: false,
  };

  // delete browser headers
  if (process.env.TARGET_ENVIRONMENT === 'browser') {
    axiosInst.interceptors.request.use((config) => {
      if (!config.headers) {
        return config;
      }

      Object.keys(config.headers).forEach((key) => {
        if (BROWSER_NEED_DELETE_HEADERS.includes(key.toLowerCase())) {
          delete config.headers[key];
        }
      });

      return config;
    });
  }

  // headers
  const ensureHeaders = (v: any) => {
    v.headers = v.headers || v.header || v?.response?.headers || {};
    return v;
  };
  axiosInst.interceptors.response.use(ensureHeaders, (error) => {
    ensureHeaders(error);
    return Promise.reject(error);
  });

  // decode header. Encode headers' value by encodeHeadersValue method before calling axios
  function handleResponseHeader(headers: Record<string, string>) {
    Object.entries(headers).forEach(([key, value]) => {
      const [err, decodedValue] = safeSync(() => decodeURI(value));
      if (err || decodedValue == null || decodedValue === value) {
        return;
      }
      let sArr = [];
      const valueArr = `${value}`.match(/./gu)!;
      const decodedValueArr = decodedValue.match(/./gu)!;
      for (let i = 0, j = 0; i < decodedValueArr.length; ) {
        const ch = decodedValueArr[i];
        if (ch === valueArr[j]) {
          sArr.push(ch);
          ++i;
          ++j;
          continue;
        }

        const encodedCh = encodeURIComponent(ch);
        if (ch.length > 1 || ch.charCodeAt(0) >= 128) {
          sArr.push(ch);
        } else {
          sArr.push(encodedCh);
        }
        ++i;
        j += encodedCh.length;
      }
      headers[key] = sArr.join('');
    });
  }
  axiosInst.interceptors.response.use(
    (res) => {
      if (!res.headers) {
        return res;
      }
      handleResponseHeader(res.headers);
      return res;
    },
    async (error) => {
      if (!axios.isAxiosError(error)) {
        return Promise.reject(error);
      }

      const headers = error.response?.headers;
      if (!headers) {
        return Promise.reject(error);
      }
      handleResponseHeader(headers);
      return Promise.reject(error);
    }
  );

  // retry
  axiosInst.interceptors.response.use(undefined, async (error) => {
    const { config } = error;
    if (!config) {
      return Promise.reject(error);
    }

    if (!config[retryNamespace]) {
      config[retryNamespace] = {};
    }
    const retryConfig: InnerRetryConfig = config[retryNamespace];
    const retryCount = retryConfig.retryCount ?? 0;

    let newData = config.data;
    const canRetryData = (() => {
      if (process.env.TARGET_ENVIRONMENT === 'node') {
        if (config.data && config.data instanceof Readable) {
          const v = retryConfig.makeRetryStream?.();
          if (!v) {
            return false;
          }
          newData = v;
        }
      }
      return true;
    })();

    const canRetry =
      (isNetworkError(error) || isCanRetryStatusCode(error)) &&
      retryCount < maxRetryCount &&
      canRetryData;

    if (!canRetry) {
      return Promise.reject(error);
    }

    const retrySignature = config[retrySignatureNamespace] as RetrySignature;
    if (retrySignature) {
      const { signOpt, sigInst } = retrySignature;
      const signatureHeaders = sigInst.signatureHeader(signOpt);
      signatureHeaders.forEach((value, key) => {
        config.headers[key] = value;
      });
    }

    //console.log('config: ', config)
    log.TOS('retryConfig: ', config);
    const nextConfig = {
      ...config,
      data: newData,
      [retryNamespace]: {
        ...retryConfig,
        retryCount: retryCount + 1,
      },
    };

    retryConfig.beforeRetry?.();
    return axiosInst(nextConfig);
  });

  return axiosInst;
};
