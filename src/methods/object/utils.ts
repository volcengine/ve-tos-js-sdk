import TosClientError from '../../TosClientError';
import mimeTypes from '../../mime-types';
import { Headers, SupportObjectBody } from '../../interface';
import { createReadNReadStream } from '../../nodejs/EmitReadStream';
import { isBuffer, isBlob, isReadable } from '../../utils';
import { CRC, CRCCls } from '../../universal/crc';
import { IRateLimiter, createRateLimiterStream } from '../../rate-limiter';
import { Buffer2Stream } from '../../nodejs/buffer2Stream';
import { createCrcReadStream } from '../../nodejs/CrcReadStream';
import {
  RestoreInfo,
  RestoreOngoingRequestTrueStr,
  TosHeader,
} from './sharedTypes';
import { TierType } from '../../TosExportEnum';

export const getObjectInputKey = (input: string | { key: string }): string => {
  return typeof input === 'string' ? input : input.key;
};

export const DEFAULT_CONTENT_TYPE = 'application/octet-stream';

export function lookupMimeType(key: string) {
  const lastDotIndex = key.lastIndexOf('.');

  if (lastDotIndex <= 0) {
    return undefined;
  }

  const extName = key.slice(lastDotIndex + 1).toLowerCase();

  return mimeTypes[extName];
}

// for all object methods
export function validateObjectName(input: { key: string } | string) {
  const key = typeof input === 'string' ? input : input.key;
  if (key.length < 1) {
    throw new TosClientError(
      'invalid object name, the length must be greater than 1'
    );
  }
}

export function getSize(body: unknown, headers?: Headers) {
  if (isBuffer(body)) {
    return body.length;
  }
  if (isBlob(body)) {
    return body.size;
  }
  if (headers && headers['content-length']) {
    const v = +headers['content-length'];
    if (v >= 0) {
      return v;
    }
  }
  return null;
}

interface GetNewBodyConfigIn<T> {
  body: T;
  dataTransferCallback: (n: number) => void;
  beforeRetry?: () => void;
  makeRetryStream?: () => NodeJS.ReadableStream | undefined;
  enableCRC: boolean;
  rateLimiter?: IRateLimiter;
}
interface GetNewBodyConfigOut<T> {
  body: T | NodeJS.ReadableStream;
  beforeRetry?: () => void;
  makeRetryStream?: () => NodeJS.ReadableStream | undefined;
  crc?: CRCCls;
}

interface GetEmitReadBodyConfigIn<T> {
  body: T;
  dataTransferCallback: (n: number) => void;
  makeRetryStream?: () => NodeJS.ReadableStream | undefined;
  rateLimiter?: IRateLimiter;
}
interface GetEmitReadBodyConfigOut<T> {
  body: T | NodeJS.ReadableStream;
  makeRetryStream?: () => NodeJS.ReadableStream | undefined;
}

export function getEmitReadBodyConfig<T extends SupportObjectBody>({
  body,
  dataTransferCallback,
  makeRetryStream,
  rateLimiter,
}: GetEmitReadBodyConfigIn<T>): GetEmitReadBodyConfigOut<T> {
  let newBody: T | NodeJS.ReadableStream = body;

  const getDefaultRet = () => ({
    body: newBody,
    makeRetryStream: undefined,
  });

  if (process.env.TARGET_ENVIRONMENT !== 'node') {
    return getDefaultRet();
  }

  if (isBuffer(newBody)) {
    const bodyBuf = newBody;
    makeRetryStream = () => new Buffer2Stream(bodyBuf);
    newBody = new Buffer2Stream(bodyBuf);
  }

  if (isReadable(newBody)) {
    if (rateLimiter && isValidRateLimiter(rateLimiter)) {
      newBody = createRateLimiterStream(newBody, rateLimiter);
    }
    newBody = createReadNReadStream(newBody, dataTransferCallback);

    if (makeRetryStream) {
      const oriMakeRetryStream = makeRetryStream;
      return {
        body: newBody,
        makeRetryStream: () => {
          let stream = oriMakeRetryStream();
          if (!stream) {
            return stream;
          }

          if (rateLimiter && isValidRateLimiter(rateLimiter)) {
            stream = createRateLimiterStream(stream, rateLimiter);
          }
          stream = createReadNReadStream(stream, dataTransferCallback);
          return stream;
        },
      };
    }
  }

  return getDefaultRet();
}

export async function getCRCBodyConfig<T extends SupportObjectBody>({
  body,
  beforeRetry,
  makeRetryStream,
  enableCRC,
}: GetNewBodyConfigIn<T>): Promise<GetNewBodyConfigOut<T>> {
  if (process.env.TARGET_ENVIRONMENT === 'browser' || !enableCRC) {
    return {
      body,
      beforeRetry,
      makeRetryStream,
    };
  }

  let newBody: T | NodeJS.ReadableStream = body;
  const crc = new CRC();
  if (isReadable(body)) {
    newBody = createCrcReadStream(body, crc);
    if (makeRetryStream) {
      const oriMakeRetryStream = makeRetryStream;
      makeRetryStream = () => {
        const stream = oriMakeRetryStream();
        if (!stream) {
          return stream;
        }
        return createCrcReadStream(stream, crc);
      };
    }
  }

  return {
    body: newBody,
    beforeRetry: () => {
      crc.reset();
      beforeRetry?.();
    },
    makeRetryStream,
    crc,
  };
}

export async function getNewBodyConfig<T extends SupportObjectBody>(
  input: GetNewBodyConfigIn<T>
): Promise<GetNewBodyConfigOut<T>> {
  const config1 = getEmitReadBodyConfig(input);
  input = { ...input, ...config1 } as GetNewBodyConfigIn<T>;
  const config2 = getCRCBodyConfig(input);
  return config2;
}

export function getCopySourceHeaderValue(srcBucket: string, srcKey: string) {
  return `/${srcBucket}/${encodeURIComponent(srcKey)}`;
}

export function isValidRateLimiter(rateLimiter?: IRateLimiter) {
  if (!rateLimiter?.Acquire || !(rateLimiter?.Acquire instanceof Function)) {
    throw new TosClientError(`The rateLimiter is not valid function`);
  }
  return true;
}

export function validateCheckpoint(cp: undefined | string | Object) {
  if (process.env.TARGET_ENVIRONMENT === 'node' && typeof cp === 'object') {
    console.warn(
      `The \`checkpoint\` parameter should be passed as a string in node.js environment, representing a file or directory.` +
        `Passing a checkpoint object to it will be removed in the future.`
    );
  }
}

export const getRestoreInfoFromHeaders = (headers: Headers) => {
  if (!headers) return;
  const headerStoreValue = headers?.[TosHeader.HeaderRestore];

  if (headerStoreValue) {
    /**
     * value example:
     * X-Tos-Restore: ongoing-request="false", expiry-date="Fri, 19 Apr 2024 00:00:00 GMT"
     */
    const ExpiryDate =
      (headerStoreValue ?? '').split('",')[1]?.split?.('=')?.[1] ?? '';
    const OngoingRequest =
      headerStoreValue?.trim() === RestoreOngoingRequestTrueStr ? true : false;
    const restoreInfo: RestoreInfo = {
      RestoreStatus: {
        OngoingRequest,
        ExpiryDate,
      },
    };
    if (OngoingRequest) {
      restoreInfo.RestoreParam = {
        ExpiryDays: headers[TosHeader.HeaderRestoreExpiryDays]
          ? Number(headers[TosHeader.HeaderRestoreExpiryDays])
          : 0,
        RequestDate: headers[TosHeader.HeaderRestoreRequestDate] ?? '',
        Tier: headers[TosHeader.HeaderRestoreTier] as TierType,
      };
    }
    return restoreInfo;
  }
  return;
};
