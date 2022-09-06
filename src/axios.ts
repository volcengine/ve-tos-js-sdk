import axios from 'axios';

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
