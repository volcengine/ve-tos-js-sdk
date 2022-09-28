import TosClientError from '../../TosClientError';
import mimeTypes from '../../mime-types';
import { Headers } from '../../interface';
import { Readable } from 'stream';
import { EmitReadStream } from '../../nodejs/EmitReadStream';

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

export function isBlob(obj: unknown): obj is Blob {
  return typeof Blob !== 'undefined' && obj instanceof Blob;
}

export function isBuffer(obj: unknown): obj is Buffer {
  return typeof Buffer !== 'undefined' && obj instanceof Buffer;
}

// for all object methods
export function validateObjectName(input: { key: string } | string) {
  const key = typeof input === 'string' ? input : input.key;
  if (key.length < 1 || key.length > 696) {
    throw new TosClientError(
      'invalid object name, the length must be [1, 696]'
    );
  }

  for (let i = 0; i < key.length; ++i) {
    const charCode = key.charCodeAt(i);
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
  makeRetryStream?: () => Readable | undefined;
}
interface GetNewBodyConfigOut<T> {
  body: T | Readable;
  makeRetryStream?: () => Readable | undefined;
}

export function getNewBodyConfig<T extends unknown>({
  body,
  totalSize,
  dataTransferCallback,
  makeRetryStream,
}: GetNewBodyConfigIn<T>): GetNewBodyConfigOut<T> {
  let newBody: T | Readable = body;
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

  if (body instanceof Readable) {
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
          const stream = makeRetryStream();
          if (stream && totalSizeValid) {
            newBody = new EmitReadStream(
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
