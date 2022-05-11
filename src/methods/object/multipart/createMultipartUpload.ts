import TOSBase from '../../base';
import { setContentTypeHeader } from '../utils';
import { normalizeHeaders } from '../../../utils';
import { Acl } from '../../../interface';

export interface CreateMultipartUploadInput {
  bucket?: string;
  key: string;

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
  input: CreateMultipartUploadInput
) {
  const headers = normalizeHeaders(input.headers);
  setContentTypeHeader(input, headers);

  return this.fetchObject<CreateMultipartUploadOutput>(
    input,
    'POST',
    { uploads: '' },
    headers
  );
}
