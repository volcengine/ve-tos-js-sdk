import TOSBase from '../../base';
import { normalizeHeaders } from '../../../utils';
import { Acl } from '../../../interface';

export interface CreateMultipartUploadInput {
  bucket?: string;
  key: string;
  acl?: Acl;

  headers?: {
    [key: string]: string | undefined;
    'encoding-type'?: string;
    'Content-Disposition'?: string;
    'x-tos-acl'?: Acl;
    'content-type'?: string;
    'x-tos-grant-full-control'?: string;
    'x-tos-grant-read'?: string;
    'x-tos-grant-read-acp'?: string;
    'x-tos-grant-write-acp'?: string;
    'x-tos-server-side-encryption-customer-algorithm'?: string;
    'x-tos-server-side-encryption-customer-key'?: string;
    'x-tos-server-side-encryption-customer-key-md5'?: string;
    'x-tos-website-redirect-location'?: string;
    'x-tos-storage-class'?: string;
    'x-tos-server-side-encryption'?: string;
  };
}

export interface CreateMultipartUploadOutput {
  UploadId: string;
  Bucket: string;
  Key: string;
  EncodingType?: string;
}

export async function createMultipartUpload(
  this: TOSBase,
  input: CreateMultipartUploadInput | string
) {
  input = this.normalizeObjectInput(input);
  const headers = normalizeHeaders(input.headers);
  if (input.acl) {
    if (!headers['x-tos-acl']) {
      headers['x-tos-acl'] = input.acl;
    }
  }

  this.setObjectContentTypeHeader(input, headers);

  return this.fetchObject<CreateMultipartUploadOutput>(
    input,
    'POST',
    { uploads: '' },
    headers
  );
}
