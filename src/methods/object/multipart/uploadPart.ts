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

export async function uploadPart(this: TOSBase, input: UploadPartInput) {
  const { uploadId, partNumber, body } = input;
  const headers = input.headers || {};
  if (Buffer.isBuffer(body) && headers['Content-Length'] == null) {
    headers['Content-Length'] = body.length.toFixed(0);
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
