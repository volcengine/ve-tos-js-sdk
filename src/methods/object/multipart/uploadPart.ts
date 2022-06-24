import { isBlob, isBuffer } from '../utils';
import TOSBase from '../../base';

export interface UploadPartInput {
  body: Blob | Buffer | ReadableStream | NodeJS.ReadableStream;
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
