import { StorageClass } from '../../interface';
import TOSBase from '../base';

export interface HeadObjectInput {
  bucket?: string;
  key: string;
  versionId?: string;
  headers?: {
    [key: string]: string | undefined;
    'If-Match'?: string;
    'If-Modified-Since'?: string;
    'If-None-Match'?: string;
    'If-Unmodified-Since'?: string;
    'x-tos-server-side-encryption-customer-algorithm'?: string;
    'x-tos-server-side-encryption-customer-key'?: string;
    'x-tos-server-side-encryption-customer-key-md5'?: string;
  };
}

export interface HeadObjectOutput {
  [key: string]: string | undefined;
  'content-length': string;
  'last-modified': string;
  'content-md5': string;
  etag: string;
  'x-tos-object-type'?: 'Appendable';
  'x-tos-delete-marker'?: string;
  'x-tos-server-side-encryption-customer-algorithm'?: string;
  'x-tos-server-side-encryption-customer-key-md5'?: string;
  'x-tos-version-id'?: string;
  'x-tos-website-redirect-location'?: string;
  'x-tos-hash-crc64ecma'?: string;
  'x-tos-storage-class': StorageClass;
  'x-tos-server-side-encryption'?: string;
}

export async function headObject(
  this: TOSBase,
  input: HeadObjectInput | string
) {
  const normalizedInput = typeof input === 'string' ? { key: input } : input;
  const query: Record<string, any> = {};
  if (normalizedInput.versionId) {
    query.versionId = normalizedInput.versionId;
  }

  return this.fetchObject<HeadObjectOutput>(
    input,
    'HEAD',
    query,
    normalizedInput?.headers || {},
    undefined,
    {
      handleResponse: res => {
        return res.headers;
      },
    }
  );
}

export default headObject;
