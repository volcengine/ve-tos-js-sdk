import TosClientError from '../../TosClientError';
import mimeTypes from '../../mime-types';
import { Headers, SupportObjectBody } from '../../interface';
import { EmitReadStream } from '../../nodejs/EmitReadStream';
import { isBuffer, isBlob, isReadable } from '../../utils';
import { CRC, CRCCls } from '../../universal/crc';

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
  if (key.length < 1 || key.length > 696) {
    throw new TosClientError(
      'invalid object name, the length must be [1, 696]'
    );
  }

  if (key.length === 1) {
    // only check one ascii code, otherwise server maybe produce strange problems
    const charCode = key.charCodeAt(0);
    if (charCode < 32 || (charCode > 127 && charCode < 256)) {
      throw new TosClientError(
        'invalid object name, the character set is illegal'
      );
    }
  }

  if (/^(\/|\\)/.test(key)) {
    throw new TosClientError(
      `invalid object name, the object name can not start with '/' or '\\'`
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
  totalSize: number | null | undefined;
  dataTransferCallback: (n: number) => void;
  beforeRetry?: () => void;
  makeRetryStream?: () => NodeJS.ReadableStream | undefined;
  enableCRC: boolean;
}
interface GetNewBodyConfigOut<T> {
  body: T | NodeJS.ReadableStream;
  beforeRetry?: () => void;
  makeRetryStream?: () => NodeJS.ReadableStream | undefined;
  crc?: CRCCls;
}

interface GetEmitReadBodyConfigIn<T> {
  body: T;
  totalSize: number | null | undefined;
  dataTransferCallback: (n: number) => void;
  makeRetryStream?: () => NodeJS.ReadableStream | undefined;
}
interface GetEmitReadBodyConfigOut<T> {
  body: T | NodeJS.ReadableStream;
  makeRetryStream?: () => NodeJS.ReadableStream | undefined;
}

export function getEmitReadBodyConfig<T extends SupportObjectBody>({
  body,
  totalSize,
  dataTransferCallback,
  makeRetryStream,
}: GetEmitReadBodyConfigIn<T>): GetEmitReadBodyConfigOut<T> {
  let newBody: T | NodeJS.ReadableStream = body;

  const getDefaultRet = () => ({
    body: newBody,
    makeRetryStream: undefined,
  });

  if (process.env.TARGET_ENVIRONMENT !== 'node') {
    return getDefaultRet();
  }

  const totalSizeValid = totalSize != null;
  if (isBuffer(body) && totalSizeValid) {
    const bodyBuffer = body;
    const makeRetryStream = () =>
      new EmitReadStream(bodyBuffer, totalSize, dataTransferCallback).stream();
    return {
      body: makeRetryStream(),
      makeRetryStream,
    };
  }

  if (isReadable(body)) {
    if (totalSizeValid) {
      newBody = new EmitReadStream(
        body,
        totalSize,
        dataTransferCallback
      ).stream();
    }

    if (makeRetryStream) {
      return {
        body: newBody,
        makeRetryStream: () => {
          let stream = makeRetryStream();
          if (stream && totalSizeValid) {
            stream = new EmitReadStream(
              stream,
              totalSize,
              dataTransferCallback
            ).stream();
          }

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
  if (!enableCRC || process.env.TARGET_ENVIRONMENT === 'browser') {
    return {
      body,
      beforeRetry,
      makeRetryStream,
    };
  }

  const crc = new CRC();

  if (isReadable(body)) {
    body.on('data', (d: Buffer) => {
      crc.update(d);
    });
    body.pause();
  } else if (isBlob(body)) {
    await crc.updateBlob(body);
  } else {
    crc.update(body);
  }

  return {
    body,
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
