import TosClientError from '../../TosClientError';
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

// only for uploading object
export function validateObjectName(input: { key: string } | string) {
  const key = typeof input === 'string' ? input : input.key;
  if (key.length < 1 || key.length > 696) {
    throw new TosClientError(
      'invalid object name, the length must be [1, 696]'
    );
  }

  for (let i = 0; i < key.length; ++i) {
    const charCode = key.charCodeAt(i);
    if (charCode < 32 || charCode > 127) {
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
