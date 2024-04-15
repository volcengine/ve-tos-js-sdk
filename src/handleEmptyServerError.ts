import TosServerError from './TosServerError';
import { getNormalDataFromError } from './utils';

const defaultEmptyMethodMap: Record<string, boolean> = {
  getBucketCustomDomain: true,
  getBucketIntelligenttiering: true,
  getBucketInventory: true,
  listBucketInventory: true,
  getBucketMirrorBack: true,
  getBucketNotification: true,
  getBucketPolicy: true,
  getBucketRealTimeLog: true,
  getBucketReplication: true,
  getBucketTagging: true,
  getBucketWebsite: true,
};

export function handleEmptyServerError<T>(
  err: Error | TosServerError | unknown,
  opts: {
    defaultResponse: T;
    enableCatchEmptyServerError?: boolean;
    methodKey: string;
  }
) {
  const { enableCatchEmptyServerError, methodKey, defaultResponse } = opts;
  if (err instanceof TosServerError) {
    if (enableCatchEmptyServerError) {
      if (err.statusCode === 404) {
        return getNormalDataFromError(defaultResponse, err);
      }
    }
    // 在本次更改前已经有一些接口对404做了catch处理，在不显式声明enableCatchEmptyServerError的情况下，保持原样，不做break change
    else if (enableCatchEmptyServerError === undefined) {
      if (err.statusCode === 404 && defaultEmptyMethodMap[methodKey]) {
        return getNormalDataFromError(defaultResponse, err);
      }
    }
  }
  throw err;
}
