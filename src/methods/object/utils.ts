import { Headers } from '../../interface';
import mimeTypes from '../../mime-types';

export const getObjectInputKey = (input: string | { key: string }): string => {
  return typeof input === 'string' ? input : input.key;
};

const DEFAULT_CONTENT_TYPE = 'application/octet-stream';

export const setContentTypeHeader = (
  input: string | { key: string },
  headers: Headers
): void => {
  if (headers['content-type'] != null) {
    return;
  }

  const key = getObjectInputKey(input);

  const mimeType = lookupMimeType(key) || DEFAULT_CONTENT_TYPE;
  if (mimeType) {
    headers['content-type'] = mimeType;
  }
};

function lookupMimeType(key: string) {
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
