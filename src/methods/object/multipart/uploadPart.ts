import { isBlob, isBuffer } from '../utils';
import TOSBase from '../../base';
import TosClientError from '../../../TosClientError';
import fs, { Stats } from 'fs';
import * as fsp from '../../../nodejs/fs-promises';

export interface UploadPartInput {
  body: Blob | Buffer | NodeJS.ReadableStream;
  bucket?: string;
  key: string;
  partNumber: number;
  uploadId: string;
  headers?: {
    [key: string]: string | undefined;
    'Content-Length'?: string;
    'Content-MD5'?: string;
    'x-tos-server-side-encryption-customer-algorithm'?: string;
    'x-tos-server-side-encryption-customer-key'?: string;
    'x-tos-server-side-encryption-customer-key-MD5'?: string;
  };
}

export interface UploadPartOutput {
  ETag: string;
}

function getSize(body: unknown) {
  if (isBuffer(body)) {
    return body.length;
  }
  if (isBlob(body)) {
    return body.size;
  }
  return null;
}

export async function uploadPart(this: TOSBase, input: UploadPartInput) {
  const { uploadId, partNumber, body } = input;
  const headers = input.headers || {};
  const size = getSize(body);
  if (size && headers['Content-Length'] == null) {
    // browser will error: Refused to set unsafe header "Content-Length"
    if (process.env.TARGET_ENVIRONMENT === 'node') {
      headers['Content-Length'] = size.toFixed(0);
    }
  }

  return this.fetchObject<UploadPartOutput>(
    input,
    'PUT',
    { partNumber, uploadId },
    headers,
    body,
    {
      handleResponse: res => ({ ETag: res.headers.etag }),
    }
  );
}

interface UploadPartFromFileInput extends Omit<UploadPartInput, 'body'> {
  filePath: string;
  /**
   * default: 0
   */
  offset?: number;

  /**
   * default: file size
   */
  partSize?: number;
}
export async function uploadPartFromFile(
  this: TOSBase,
  input: UploadPartFromFileInput
) {
  if (process.env.TARGET_ENVIRONMENT !== 'node') {
    throw new TosClientError(
      "uploadPartFromFile doesn't support in browser environment"
    );
  }

  const stats: Stats = await fsp.stat(input.filePath);
  const start = input.offset ?? 0;
  const end = start + (input.partSize ?? stats.size);
  const stream = fs.createReadStream(input.filePath, {
    start,
    end: end - 1,
  }) as NodeJS.ReadableStream;

  return uploadPart.call(this, {
    ...input,
    body: stream,
    headers: {
      ...(input.headers || {}),
      ['Content-Length']: `${end - start}`,
    },
  });
}
