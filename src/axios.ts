import axios from 'axios';
import { safeSync } from './utils';

export const retryNamespace = '__retryConfig__';
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
  if (status === 429 || status >= 500) {
    return true;
  }
  return false;
}

export const makeAxiosInst = (maxRetryCount: number) => {
  const axiosInst = axios.create();
  // header encode/decode
  axiosInst.interceptors.request.use(config => {
    if (!config.headers) {
      return config;
    }

    Object.entries(config.headers).forEach(([key, value]) => {
      config.headers[key] = `${value}`
        .split('')
        .map((ch: string) => {
          if (ch.charCodeAt(0) >= 128) {
            return encodeURIComponent(ch);
          }
          return ch;
        })
        .join('');
    });

    return config;
  });
  function handleResponseHeader(headers: Record<string, string>) {
    Object.entries(headers).forEach(([key, value]) => {
      const [err, decodedValue] = safeSync(() => decodeURI(value));
      if (err || decodedValue == null || decodedValue === value) {
        return;
      }
      let sArr = [];
      for (let i = 0, j = 0; i < decodedValue.length; ) {
        const ch = decodedValue[i];
        if (ch === value[j]) {
          sArr.push(ch);
          ++i;
          ++j;
          continue;
        }

        const encodedCh = encodeURIComponent(ch);
        if (ch.charCodeAt(0) >= 128) {
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
    res => {
      if (!res.headers) {
        return res;
      }
      handleResponseHeader(res.headers);
      return res;
    },
    async error => {
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
  axiosInst.interceptors.response.use(undefined, async error => {
    const { config } = error;
    if (!config) {
      return Promise.reject(error);
    }

    if (!config[retryNamespace]) {
      config[retryNamespace] = {};
    }
    const retryCount = config[retryNamespace].retryCount ?? 0;

    const canRetry =
      (isNetworkError(error) || isCanRetryStatusCode(error)) &&
      retryCount < maxRetryCount;
    if (!canRetry) {
      return Promise.reject(error);
    }

    const nextConfig = {
      ...config,
      [retryNamespace]: {
        ...config[retryNamespace],
        retryCount: retryCount + 1,
      },
    };
    return axiosInst(nextConfig);
  });

  return axiosInst;
};
