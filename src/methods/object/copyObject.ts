import { safeAwait } from '@/utils';
import { StorageClass, ServerSideEncryption } from '../../interface';
import TOSBase, { TosResponse } from '../base';

export interface CopyObjectInput {
  bucket?: string;
  key: string;
  headers?: {
    [key: string]: string | undefined;
    ['x-tos-copy-source']?: string;
    ['x-tos-acl']?: string;
    ['x-tos-copy-source-if-match']?: string;
    ['x-tos-copy-source-if-modified-since']?: string;
    ['x-tos-copy-source-if-none-match']?: string;
    ['x-tos-copy-source-if-unmodified-since']?: string;
    ['x-tos-copy-source-server-side-encryption-customer-algorithm']?: string;
    ['x-tos-copy-source-server-side-encryption-customer-key']?: string;
    ['x-tos-copy-source-server-side-encryption-customer-key-MD5']?: string;
    ['x-tos-grant-full-control']?: string;
    ['x-tos-grant-read']?: string;
    ['x-tos-grant-read-acp']?: string;
    ['x-tos-metadata-directive']?: string;
    ['x-tos-website-redirect-location']?: string;
    ['x-tos-storage-class']?: StorageClass;
    ['x-tos-server-side-encryption']?: ServerSideEncryption;
  };
}

interface CopyObjectBody {
  ETag: string;
}

export interface CopyObjectOutput extends CopyObjectBody {}

export async function copyObject(
  this: TOSBase,
  input: CopyObjectInput
): Promise<TosResponse<CopyObjectOutput>> {
  const [err, res] = await safeAwait(
    this.fetchObject<CopyObjectBody>(input, 'PUT', {}, input.headers || {})
  );

  if (err || !res || !res.data.ETag) {
    // TODO: throw TosServerErr
    throw err;
  }
  return res;
}

export default copyObject;
